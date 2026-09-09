"""
Centralized Workflow & Finite State Machine Engine
Governs valid state transitions, RBAC enforcement, object ownership,
notification dispatching, and audit logging across all roles.
"""

from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.gate_pass import GatePass, GatePassAuditLog
from app.models.user import User, StudentLeave, StudentOD
from app.models.communication import Notification
from app.models.audit_log import AuditLog
from app.utils.websocket_manager import manager as ws_manager


class WorkflowEngine:
    # ─── GATE PASS STATE MACHINE ─────────────────────────────────────────────
    # Valid transitions map: current_state -> set of valid next_states
    GATE_PASS_TRANSITIONS = {
        "SUBMITTED": {"APPROVED", "PENDING_PARENT_OTP", "REJECTED", "CANCELLED"},
        "PENDING_PARENT_OTP": {"PENDING_WARDEN_APPROVAL", "APPROVED", "REJECTED", "CANCELLED"},
        "PENDING_WARDEN_APPROVAL": {"APPROVED", "REJECTED", "CANCELLED"},
        "APPROVED": {"OUT", "CANCELLED", "EXPIRED"},
        "OUT": {"RETURNED", "OVERDUE"},
        "OVERDUE": {"RETURNED"},
        "RETURNED": set(),
        "REJECTED": set(),
        "CANCELLED": set(),
        "EXPIRED": set(),
    }

    # Role permissions for each transition
    GATE_PASS_ROLE_PERMISSIONS = {
        "APPROVED": {"admin", "hod", "warden", "faculty", "system"},
        "PENDING_PARENT_OTP": {"student", "system"},
        "PENDING_WARDEN_APPROVAL": {"guardian", "admin", "system"},
        "OUT": {"security", "admin"},
        "RETURNED": {"security", "admin"},
        "OVERDUE": {"system", "security", "admin"},
        "REJECTED": {"guardian", "hod", "admin", "faculty", "warden"},
        "CANCELLED": {"student", "admin"},
    }

    @classmethod
    async def transition_gate_pass(
        cls,
        db: AsyncSession,
        pass_id: int,
        actor_user: Dict[str, Any],
        new_state: str,
        remarks: Optional[str] = None,
        action_name: Optional[str] = None,
    ) -> GatePass:
        """
        Validates and executes a state transition for a GatePass object.
        Enforces idempotency, role legality, object ownership, audit logging,
        and triggers notifications.
        """
        result = await db.execute(select(GatePass).where(GatePass.id == pass_id))
        gp = result.scalar_one_or_none()
        if not gp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"GatePass #{pass_id} not found",
            )

        current_state = gp.status
        role = (actor_user.get("role") or "").lower()
        actor_id = actor_user.get("id")

        # 1. Idempotency: If already in new_state, return cleanly
        if current_state == new_state:
            return gp

        # 2. Validate transition validity
        allowed_targets = cls.GATE_PASS_TRANSITIONS.get(current_state, set())
        if new_state not in allowed_targets:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Illegal gate pass transition from '{current_state}' to '{new_state}'. Allowed: {list(allowed_targets)}",
            )

        # 3. Validate Role Authority
        allowed_roles = cls.GATE_PASS_ROLE_PERMISSIONS.get(new_state, set())
        if role not in allowed_roles and role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role}' is not authorized to transition pass to '{new_state}'. Allowed roles: {list(allowed_roles)}",
            )

        # 4. Object Ownership Validation
        if role == "student" and new_state == "CANCELLED":
            if gp.student_id != actor_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot cancel a gate pass belonging to another student.",
                )

        # 5. Apply State Transition
        previous_state = current_state
        gp.status = new_state

        if new_state == "OUT" and not gp.actual_exit_time:
            gp.actual_exit_time = datetime.utcnow()
        elif new_state == "RETURNED" and not gp.actual_return_time:
            gp.actual_return_time = datetime.utcnow()
        elif new_state == "PENDING_WARDEN_APPROVAL":
            gp.parent_verified = True
        elif new_state == "APPROVED":
            if role in ("hod", "admin", "warden"):
                gp.warden_approved = True

        # 6. Audit Logging (Specific & Global)
        audit_log = GatePassAuditLog(
            pass_id=gp.id,
            actor_id=actor_id,
            actor_role=role.upper(),
            action=action_name or f"TRANSITION_TO_{new_state}",
            previous_state=previous_state,
            new_state=new_state,
            metadata_json=remarks or "",
            timestamp=datetime.utcnow(),
        )
        db.add(audit_log)

        system_audit = AuditLog(
            user_id=actor_id,
            user_email=actor_user.get("email"),
            role=role,
            action=action_name or f"GATE_PASS_{new_state}",
            resource="gate_pass",
            details=f"Pass #{gp.id} transitioned from {previous_state} to {new_state}. Remarks: {remarks or 'None'}",
            status_code=200,
            created_at=datetime.utcnow(),
        )
        db.add(system_audit)

        # 7. Targeted Notifications & Real-Time Events
        await cls._dispatch_gate_pass_notifications(db, gp, previous_state, new_state, actor_user, remarks)

        await db.commit()
        await db.refresh(gp)
        return gp

    @classmethod
    async def _dispatch_gate_pass_notifications(
        cls,
        db: AsyncSession,
        gp: GatePass,
        prev_state: str,
        new_state: str,
        actor: Dict[str, Any],
        remarks: Optional[str],
    ):
        """Sends targeted notifications based on the gate pass transition."""
        # Find student record to get guardian_id
        res = await db.execute(select(User).where(User.id == gp.student_id))
        student = res.scalar_one_or_none()
        student_name = student.name if student else f"Student #{gp.student_id}"
        guardian_id = getattr(student, "guardian_id", None) if student else None

        notifs_to_create = []

        if new_state == "PENDING_PARENT_OTP":
            # Notify Guardian
            if guardian_id:
                notifs_to_create.append(Notification(
                    title="Guardian Authorization Required",
                    message=f"Your ward {student_name} submitted a {gp.pass_type} pass to {gp.destination}. Verification OTP: {gp.parent_otp}",
                    category="gatepass",
                    priority="high",
                    user_id=guardian_id,
                    created_by=gp.student_id,
                ))

        elif new_state == "PENDING_WARDEN_APPROVAL":
            # Notify HOD / Warden
            notifs_to_create.append(Notification(
                title="Gate Pass Pending Warden/HOD Action",
                message=f"Parent authorized {student_name}'s {gp.pass_type} to {gp.destination}. Ready for final sign-off.",
                category="gatepass",
                priority="normal",
                target_role="hod",
                created_by=actor.get("id") or gp.student_id,
            ))

        elif new_state == "APPROVED":
            # Notify Student
            notifs_to_create.append(Notification(
                title="Gate Pass Approved!",
                message=f"Your {gp.pass_type} to {gp.destination} is APPROVED. Digital QR token is active for exit scan.",
                category="gatepass",
                priority="high",
                user_id=gp.student_id,
                created_by=actor.get("id") or 1,
            ))

        elif new_state == "OUT":
            # Notify Student & Guardian
            notifs_to_create.append(Notification(
                title="Campus Exit Authorized",
                message=f"Exit verified at Main Gate. Have a safe journey to {gp.destination}.",
                category="gatepass",
                priority="normal",
                user_id=gp.student_id,
                created_by=actor.get("id") or 1,
            ))
            if guardian_id:
                notifs_to_create.append(Notification(
                    title="Ward Left Campus",
                    message=f"{student_name} departed campus through Main Gate towards {gp.destination}.",
                    category="gatepass",
                    priority="normal",
                    user_id=guardian_id,
                    created_by=actor.get("id") or 1,
                ))

        elif new_state == "RETURNED":
            # Notify Student & Guardian
            notifs_to_create.append(Notification(
                title="Return Confirmed",
                message="Return scan recorded at Main Gate. Welcome back to campus!",
                category="gatepass",
                priority="normal",
                user_id=gp.student_id,
                created_by=actor.get("id") or 1,
            ))
            if guardian_id:
                notifs_to_create.append(Notification(
                    title="Ward Safely Returned to Campus",
                    message=f"{student_name} returned to campus safely.",
                    category="gatepass",
                    priority="normal",
                    user_id=guardian_id,
                    created_by=actor.get("id") or 1,
                ))

        elif new_state == "OVERDUE":
            # Alert Security, HOD, and Guardian
            alert_msg = f"OVERDUE ALERT: {student_name} has exceeded curfew window for pass #{gp.id} ({gp.destination})."
            if guardian_id:
                notifs_to_create.append(Notification(
                    title="⚠️ Curfew Notice: Ward Return Overdue",
                    message=alert_msg,
                    category="emergency",
                    priority="high",
                    user_id=guardian_id,
                    created_by=actor.get("id") or 1,
                ))
            notifs_to_create.append(Notification(
                title="⚠️ Overdue Gate Pass Incident",
                message=alert_msg,
                category="emergency",
                priority="high",
                target_role="security",
                created_by=actor.get("id") or 1,
            ))

        for n in notifs_to_create:
            db.add(n)

        # Broadcast via WebSockets
        try:
            await ws_manager.broadcast_to_role("security", {
                "event": "GATE_PASS_UPDATE",
                "pass_id": gp.id,
                "status": new_state,
                "student_id": gp.student_id,
            })
            await ws_manager.send_personal_message(gp.student_id, {
                "event": "GATE_PASS_UPDATE",
                "pass_id": gp.id,
                "status": new_state,
            })
        except Exception:
            pass
