from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional
from datetime import datetime

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.services.gate_pass_service import GatePassService
from app.models.gate_pass import GatePassPolicy

router = APIRouter(prefix="/gate-pass", tags=["Autonomous AI Gate Pass"])


@router.post("/request")
async def request_gate_pass(
    pass_type: str = Body("outpass"),
    reason: str = Body(...),
    destination: str = Body(...),
    return_hours: int = Body(4),
    custom_leave_time: Optional[str] = Body(None),
    custom_return_time: Optional[str] = Body(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Request an Autonomous AI Gate Pass.
    Multi-Tier Approval Matrix: Day outpass, Weekend Hostel Leave, Emergency.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    leave_dt = datetime.fromisoformat(custom_leave_time) if custom_leave_time else None
    return_dt = datetime.fromisoformat(custom_return_time) if custom_return_time else None

    return await GatePassService.request_gate_pass(
        db=db,
        student_id=user_id,
        pass_type=pass_type,
        reason=reason,
        destination=destination,
        return_hours=return_hours,
        custom_leave_time=leave_dt,
        custom_return_time=return_dt
    )


@router.get("/recommend-exit-time")
async def recommend_exit_time(
    requested_hours: int = Query(3),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Smart 'Find Best Exit Time' Recommendation Engine.
    Scans student timetable for optimal free exit window.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    return await GatePassService.recommend_exit_time(db=db, student_id=user_id, requested_hours=requested_hours)


@router.post("/exit")
async def gate_exit_scan(
    qr_token: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Security Guard Gate EXIT Scanner Endpoint.
    Transitions status APPROVED -> OUT. Sets actual_exit_time.
    """
    user_role = current_user.get("role")
    if user_role not in ["admin", "faculty", "security"]:
        raise HTTPException(status_code=403, detail="Gate Exit scan requires Security/Admin role")

    return await GatePassService.exit_scan(db=db, qr_token=qr_token, guard_id=current_user.get("id"))


@router.post("/return")
async def gate_return_scan(
    qr_token: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Security Guard Gate RETURN Scanner Endpoint.
    Transitions status OUT -> RETURNED. Sets actual_return_time.
    """
    user_role = current_user.get("role")
    if user_role not in ["admin", "faculty", "security"]:
        raise HTTPException(status_code=403, detail="Gate Return scan requires Security/Admin role")

    return await GatePassService.return_scan(db=db, qr_token=qr_token, guard_id=current_user.get("id"))


@router.post("/verify-parent-otp")
async def verify_parent_otp(
    pass_id: int = Body(...),
    otp_code: str = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Verify Parent Guardian OTP code for Hostel Weekend Leave.
    """
    return await GatePassService.verify_parent_otp(db=db, pass_id=pass_id, otp_code=otp_code)


@router.post("/warden-action")
async def warden_approve_pass(
    pass_id: int = Body(...),
    action: str = Body("approve"),  # approve or reject
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Hostel Warden / HOD 1-Click Approval endpoint.
    """
    user_role = current_user.get("role")
    if user_role not in ["admin", "faculty", "hod", "warden"]:
        raise HTTPException(status_code=403, detail="Warden or Faculty role required")

    return await GatePassService.warden_approve(db=db, pass_id=pass_id, action=action, warden_id=current_user.get("id"))


@router.post("/{pass_id}/cancel")
@router.post("/cancel/{pass_id}")
async def cancel_gate_pass(
    pass_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Cancel an active or pending gate pass.
    """
    user_id = current_user.get("id")
    user_role = current_user.get("role")
    res = await GatePassService.cancel_pass(db=db, pass_id=pass_id, user_id=user_id, user_role=user_role)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res


@router.post("/check-overdue")
async def trigger_overdue_check(
    db: AsyncSession = Depends(get_db)
):
    """
    Background Overdue Detection & Escalation Engine Task.
    """
    overdue_list = await GatePassService.check_overdue_passes(db=db)
    return {"success": True, "overdueCount": len(overdue_list), "overduePasses": overdue_list}


@router.get("/my-passes")
async def get_my_passes(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all active and past gate passes for current student.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    return await GatePassService.get_student_passes(db=db, student_id=user_id)


@router.get("/all-passes")
async def get_all_passes_admin(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Security / Admin / Warden list of all gate passes.
    """
    user_role = current_user.get("role")
    if user_role not in ["admin", "faculty", "security", "warden", "hod"]:
        raise HTTPException(status_code=403, detail="Admin/Security role required")

    return await GatePassService.get_all_passes_admin(db=db)


@router.get("/analytics")
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Gate Pass Analytics Engine endpoint.
    """
    return await GatePassService.get_analytics(db=db)


@router.get("/audit-logs")
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Immutable Gate Pass Audit Logs endpoint.
    """
    return await GatePassService.get_audit_logs(db=db)


@router.get("/policy")
async def get_policy(
    db: AsyncSession = Depends(get_db)
):
    """
    Get current Gate Pass Policy configuration.
    """
    policy = await GatePassService.get_active_policy(db)
    return {
        "policyName": policy.policy_name,
        "minAttendancePct": policy.min_attendance_pct,
        "autoApproveMaxHours": policy.auto_approve_max_hours,
        "overdueThresholdMinutes": policy.overdue_threshold_minutes,
        "maxActivePasses": policy.max_active_passes,
        "escalationParentMins": policy.escalation_parent_mins,
        "escalationWardenMins": policy.escalation_warden_mins,
        "escalationAdminMins": policy.escalation_admin_mins
    }


@router.put("/policy")
async def update_policy(
    min_attendance_pct: float = Body(...),
    auto_approve_max_hours: float = Body(...),
    overdue_threshold_minutes: int = Body(...),
    max_active_passes: int = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update institutional Gate Pass Policy configuration.
    """
    user_role = current_user.get("role")
    if user_role not in ["admin", "hod"]:
        raise HTTPException(status_code=403, detail="Admin role required to modify policy")

    policy = await GatePassService.get_active_policy(db)
    policy.min_attendance_pct = min_attendance_pct
    policy.auto_approve_max_hours = auto_approve_max_hours
    policy.overdue_threshold_minutes = overdue_threshold_minutes
    policy.max_active_passes = max_active_passes
    await db.commit()

    return {"success": True, "message": "Gate Pass Policy updated successfully!"}


