from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, or_, and_
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

from app.database import get_db
from app.models.user import User, StudentLeave
from app.models.attendance import Attendance
from app.models.communication import Notification
from app.models.gate_pass import GatePass
from app.middleware.auth_middleware import get_current_user
from app.middleware.role_checker import require_role
from app.utils.websocket_manager import manager as ws_manager

router = APIRouter(prefix="/warden", tags=["Warden Governance & Leaves"])


class WardenProfileUpdateRequest(BaseModel):
    phone_number: Optional[str] = None
    staff_room: Optional[str] = None
    name: Optional[str] = None


class ApproveLeaveRequest(BaseModel):
    comment: Optional[str] = "Approved by Hostel Warden"


class RejectLeaveRequest(BaseModel):
    reason: str = Field(..., min_length=2, description="Reason for rejecting the leave application")
    comment: Optional[str] = None


# Helper to send system notification
async def send_student_notification(
    db: AsyncSession,
    student_id: int,
    title: str,
    message: str,
    creator_id: int,
    dept: str = "Hostel"
):
    notif = Notification(
        title=title,
        message=message,
        category="disciplinary",
        priority="high",
        target_role="student",
        department=dept,
        user_id=student_id,
        created_by=creator_id
    )
    db.add(notif)
    await db.flush()
    try:
        await ws_manager.broadcast_notification({
            "id": notif.id,
            "title": notif.title,
            "message": notif.message,
            "category": notif.category,
            "priority": notif.priority,
            "created_at": str(notif.created_at),
            "is_read": False
        })
    except Exception:
        pass


# ─── Warden Profile Endpoints ───────────────────────────────────────────────

@router.get("/profile")
async def get_warden_profile(
    current_user: dict = Depends(require_role("warden", "admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch comprehensive authenticated Warden profile with actual DB records.
    """
    user_res = await db.execute(select(User).where(User.id == current_user["id"]))
    warden = user_res.scalar_one_or_none()
    if not warden:
        raise HTTPException(status_code=404, detail="Warden user account not found")

    # Real-time stats from database
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)

    pending_count_res = await db.execute(
        select(func.count(StudentLeave.id)).where(
            StudentLeave.status.in_([
                "Pending", "PENDING", "Pending Faculty Review",
                "Pending HOD Approval", "Pending Warden Review"
            ])
        )
    )
    pending_count = pending_count_res.scalar() or 0

    approved_today_res = await db.execute(
        select(func.count(StudentLeave.id)).where(
            StudentLeave.status.in_(["Approved", "APPROVED"]),
            or_(
                StudentLeave.warden_reviewed_at >= today_start,
                StudentLeave.created_at >= today_start
            )
        )
    )
    approved_today = approved_today_res.scalar() or 0

    rejected_today_res = await db.execute(
        select(func.count(StudentLeave.id)).where(
            StudentLeave.status.in_(["Rejected", "REJECTED"]),
            or_(
                StudentLeave.warden_reviewed_at >= today_start,
                StudentLeave.created_at >= today_start
            )
        )
    )
    rejected_today = rejected_today_res.scalar() or 0

    total_requests_res = await db.execute(select(func.count(StudentLeave.id)))
    total_requests = total_requests_res.scalar() or 0

    pending_gate_passes_res = await db.execute(
        select(func.count(GatePass.id)).where(GatePass.status == "PENDING_WARDEN_APPROVAL")
    )
    pending_gate_passes = pending_gate_passes_res.scalar() or 0

    hostel_students_res = await db.execute(
        select(func.count(User.id)).where(User.role == "student")
    )
    hostel_students = hostel_students_res.scalar() or 0

    return {
        "id": warden.id,
        "name": warden.name,
        "email": warden.email,
        "role": warden.role,
        "employee_id": warden.employee_id or "WAR001",
        "designation": "Chief Hostel Warden",
        "department": warden.department or "Hostel Administration",
        "staff_room": warden.staff_room or "Hostel Office Block A",
        "hostel_block": "Block A & Senior Hostels",
        "phone_number": warden.phone_number or "+91 98765 43222",
        "status": "Active",
        "created_at": str(warden.created_at) if warden.created_at else None,
        "assigned_responsibilities": [
            "Student Leave & Outpass Authorization",
            "Hostel Night Curfew & Biometric Checkpoint Oversight",
            "Hostel Room Allocation & Resident Welfare",
            "Emergency Escalation & Parent Grievance Coordination"
        ],
        "stats": {
            "pending_leaves": pending_count,
            "approved_today": approved_today,
            "rejected_today": rejected_today,
            "total_requests": total_requests,
            "pending_gate_passes": pending_gate_passes,
            "total_residents": hostel_students
        }
    }


@router.put("/profile")
async def update_warden_profile(
    req: WardenProfileUpdateRequest,
    current_user: dict = Depends(require_role("warden", "admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Update editable profile attributes for authenticated Warden.
    """
    user_res = await db.execute(select(User).where(User.id == current_user["id"]))
    warden = user_res.scalar_one_or_none()
    if not warden:
        raise HTTPException(status_code=404, detail="Warden user account not found")

    if req.name is not None and req.name.strip():
        warden.name = req.name.strip()
    if req.phone_number is not None:
        warden.phone_number = req.phone_number.strip()
    if req.staff_room is not None:
        warden.staff_room = req.staff_room.strip()

    await db.flush()
    await db.commit()
    await db.refresh(warden)

    return {
        "message": "Warden profile updated successfully",
        "warden": {
            "id": warden.id,
            "name": warden.name,
            "email": warden.email,
            "phone_number": warden.phone_number,
            "staff_room": warden.staff_room,
            "employee_id": warden.employee_id,
            "department": warden.department
        }
    }


# ─── Warden Stats Endpoint ──────────────────────────────────────────────────

@router.get("/stats")
async def get_warden_stats(
    current_user: dict = Depends(require_role("warden", "admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Real-time database statistics for Warden Dashboard.
    """
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)

    pending_count_res = await db.execute(
        select(func.count(StudentLeave.id)).where(
            StudentLeave.status.in_([
                "Pending", "PENDING", "Pending Faculty Review",
                "Pending HOD Approval", "Pending Warden Review"
            ])
        )
    )
    pending_count = pending_count_res.scalar() or 0

    approved_today_res = await db.execute(
        select(func.count(StudentLeave.id)).where(
            StudentLeave.status.in_(["Approved", "APPROVED"]),
            or_(
                StudentLeave.warden_reviewed_at >= today_start,
                StudentLeave.created_at >= today_start
            )
        )
    )
    approved_today = approved_today_res.scalar() or 0

    rejected_today_res = await db.execute(
        select(func.count(StudentLeave.id)).where(
            StudentLeave.status.in_(["Rejected", "REJECTED"]),
            or_(
                StudentLeave.warden_reviewed_at >= today_start,
                StudentLeave.created_at >= today_start
            )
        )
    )
    rejected_today = rejected_today_res.scalar() or 0

    total_requests_res = await db.execute(select(func.count(StudentLeave.id)))
    total_requests = total_requests_res.scalar() or 0

    pending_gate_passes_res = await db.execute(
        select(func.count(GatePass.id)).where(GatePass.status == "PENDING_WARDEN_APPROVAL")
    )
    pending_gate_passes = pending_gate_passes_res.scalar() or 0

    return {
        "pending_leaves": pending_count,
        "approved_today": approved_today,
        "rejected_today": rejected_today,
        "total_requests": total_requests,
        "pending_gate_passes": pending_gate_passes
    }


# ─── Warden Leave Management Endpoints ─────────────────────────────────────

@router.get("/leaves")
async def list_warden_leaves(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(require_role("warden", "admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    List all leave requests with student details for Warden approval.
    """
    query = select(StudentLeave, User).join(User, StudentLeave.student_id == User.id)

    if status_filter and status_filter.upper() != "ALL":
        s = status_filter.strip().upper()
        if s == "PENDING":
            query = query.where(
                StudentLeave.status.in_([
                    "Pending", "PENDING", "Pending Faculty Review",
                    "Pending HOD Approval", "Pending Warden Review"
                ])
            )
        elif s == "APPROVED":
            query = query.where(StudentLeave.status.in_(["Approved", "APPROVED"]))
        elif s == "REJECTED":
            query = query.where(StudentLeave.status.in_(["Rejected", "REJECTED"]))
        elif s == "CANCELLED":
            query = query.where(StudentLeave.status.in_(["Cancelled", "CANCELLED"]))
        else:
            query = query.where(StudentLeave.status == status_filter)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                User.name.ilike(term),
                User.email.ilike(term),
                User.roll_number.ilike(term),
                StudentLeave.leave_type.ilike(term),
                StudentLeave.reason.ilike(term)
            )
        )

    query = query.order_by(StudentLeave.created_at.desc()).limit(limit).offset(offset)
    res = await db.execute(query)
    rows = res.all()

    output = []
    for leave, student in rows:
        # Calculate number of days
        num_days = 1
        if leave.start_date and leave.end_date:
            try:
                num_days = max(1, (leave.end_date - leave.start_date).days + 1)
            except Exception:
                num_days = 1

        adv_name = "Assigned Faculty Advisor"
        if leave.advisor_id:
            adv_res = await db.execute(select(User.name).where(User.id == leave.advisor_id))
            adv_name = adv_res.scalar() or adv_name

        # Standardize canonical status
        raw_status = leave.status or "PENDING"
        canonical = "PENDING"
        if raw_status.upper() in ["APPROVED", "APPROVE"]:
            canonical = "APPROVED"
        elif raw_status.upper() in ["REJECTED", "REJECT"]:
            canonical = "REJECTED"
        elif raw_status.upper() in ["CANCELLED", "CANCEL"]:
            canonical = "CANCELLED"

        output.append({
            "id": leave.id,
            "student_id": student.id,
            "student_name": student.name,
            "student_roll": student.roll_number or "N/A",
            "student_email": student.email,
            "student_dept": student.department or "General",
            "student_phone": student.phone_number or "N/A",
            "student_section": student.section or "A",
            "student_room": f"Hostel Block A - Room {student.section or '1'}0{student.id % 20 + 1}",
            "leave_type": leave.leave_type,
            "start_date": str(leave.start_date),
            "end_date": str(leave.end_date),
            "number_of_days": num_days,
            "reason": leave.reason,
            "supporting_document": leave.supporting_document,
            "status": canonical,
            "raw_status": raw_status,
            "created_at": str(leave.created_at) if leave.created_at else None,
            "updated_at": str(leave.updated_at) if leave.updated_at else None,
            "advisor_name": adv_name,
            "faculty_comment": leave.faculty_comment,
            "hod_comment": leave.hod_comment,
            "warden_comment": leave.warden_comment,
            "warden_reviewed_at": str(leave.warden_reviewed_at) if leave.warden_reviewed_at else None,
            "rejection_reason": leave.rejection_reason
        })

    return output


@router.get("/leaves/{leave_id}")
async def get_warden_leave_detail(
    leave_id: int,
    current_user: dict = Depends(require_role("warden", "admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information for a specific leave application.
    """
    query = select(StudentLeave, User).join(User, StudentLeave.student_id == User.id).where(StudentLeave.id == leave_id)
    res = await db.execute(query)
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Leave request not found")

    leave, student = row
    num_days = max(1, (leave.end_date - leave.start_date).days + 1) if leave.start_date and leave.end_date else 1

    adv_name = "N/A"
    if leave.advisor_id:
        adv_res = await db.execute(select(User.name).where(User.id == leave.advisor_id))
        adv_name = adv_res.scalar() or "N/A"

    canonical = "PENDING"
    if (leave.status or "").upper() in ["APPROVED", "APPROVE"]:
        canonical = "APPROVED"
    elif (leave.status or "").upper() in ["REJECTED", "REJECT"]:
        canonical = "REJECTED"
    elif (leave.status or "").upper() in ["CANCELLED", "CANCEL"]:
        canonical = "CANCELLED"

    return {
        "id": leave.id,
        "student_id": student.id,
        "student_name": student.name,
        "student_roll": student.roll_number or "N/A",
        "student_email": student.email,
        "student_dept": student.department or "General",
        "student_phone": student.phone_number or "N/A",
        "student_room": f"Hostel Block A - Room {student.section or '1'}0{student.id % 20 + 1}",
        "leave_type": leave.leave_type,
        "start_date": str(leave.start_date),
        "end_date": str(leave.end_date),
        "number_of_days": num_days,
        "reason": leave.reason,
        "supporting_document": leave.supporting_document,
        "status": canonical,
        "raw_status": leave.status,
        "created_at": str(leave.created_at) if leave.created_at else None,
        "updated_at": str(leave.updated_at) if leave.updated_at else None,
        "advisor_name": adv_name,
        "faculty_comment": leave.faculty_comment,
        "hod_comment": leave.hod_comment,
        "warden_comment": leave.warden_comment,
        "warden_reviewed_at": str(leave.warden_reviewed_at) if leave.warden_reviewed_at else None,
        "rejection_reason": leave.rejection_reason
    }


@router.post("/leaves/{leave_id}/approve")
@router.patch("/leaves/{leave_id}/approve")
@router.put("/leaves/{leave_id}/approve")
async def approve_leave(
    leave_id: int,
    req: ApproveLeaveRequest = ApproveLeaveRequest(),
    current_user: dict = Depends(require_role("warden", "admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Approve a student leave request. Updates DB status from PENDING to APPROVED.
    """
    res = await db.execute(select(StudentLeave).where(StudentLeave.id == leave_id))
    leave = res.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    # Prevent re-approving already approved requests
    if (leave.status or "").upper() == "APPROVED":
        raise HTTPException(status_code=400, detail="Leave request is already approved")

    std_res = await db.execute(select(User).where(User.id == leave.student_id))
    student = std_res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student associated with leave not found")

    # Update leave record
    now = datetime.now()
    leave.status = "APPROVED"
    leave.warden_reviewer_id = current_user["id"]
    leave.warden_comment = req.comment or "Approved by Hostel Warden"
    leave.warden_reviewed_at = now
    leave.updated_at = now
    leave.rejection_reason = None  # Clear any previous rejection reason

    # Regularize attendance records for approved leave window
    try:
        att_query = select(Attendance).where(
            Attendance.student_id == leave.student_id,
            Attendance.date >= leave.start_date,
            Attendance.date <= leave.end_date
        )
        att_records = (await db.execute(att_query)).scalars().all()
        for att in att_records:
            if att.status in ["absent", "Absent"]:
                att.status = "present"
                att.status_type = "leave"
                att.remarks = f"Excused via Warden Approved Leave #{leave.id}"
    except Exception:
        pass

    await db.flush()
    await db.commit()

    # Send Notification to Student
    await send_student_notification(
        db=db,
        student_id=student.id,
        title="Leave Request Approved",
        message=f"Your {leave.leave_type} request from {leave.start_date} to {leave.end_date} has been approved by the Hostel Warden.",
        creator_id=current_user["id"],
        dept=student.department or "Hostel"
    )

    return {
        "success": True,
        "message": "Leave request approved successfully",
        "leave": {
            "id": leave.id,
            "status": "APPROVED",
            "warden_comment": leave.warden_comment,
            "warden_reviewed_at": str(leave.warden_reviewed_at),
            "updated_at": str(leave.updated_at)
        }
    }


@router.post("/leaves/{leave_id}/reject")
@router.patch("/leaves/{leave_id}/reject")
@router.put("/leaves/{leave_id}/reject")
async def reject_leave(
    leave_id: int,
    req: RejectLeaveRequest,
    current_user: dict = Depends(require_role("warden", "admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Reject a student leave request. Mandatory reason must be provided.
    Updates DB status from PENDING to REJECTED.
    """
    if not req.reason or not req.reason.strip():
        raise HTTPException(status_code=400, detail="Rejection reason is mandatory")

    res = await db.execute(select(StudentLeave).where(StudentLeave.id == leave_id))
    leave = res.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    # Prevent re-rejecting already rejected requests
    if (leave.status or "").upper() == "REJECTED":
        raise HTTPException(status_code=400, detail="Leave request is already rejected")

    std_res = await db.execute(select(User).where(User.id == leave.student_id))
    student = std_res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student associated with leave not found")

    now = datetime.now()
    clean_reason = req.reason.strip()
    leave.status = "REJECTED"
    leave.rejection_reason = clean_reason
    leave.warden_reviewer_id = current_user["id"]
    leave.warden_comment = clean_reason
    leave.warden_reviewed_at = now
    leave.updated_at = now

    await db.flush()
    await db.commit()

    # Send Notification to Student
    await send_student_notification(
        db=db,
        student_id=student.id,
        title="Leave Request Rejected",
        message=f"Your {leave.leave_type} request from {leave.start_date} to {leave.end_date} was rejected by the Hostel Warden. Reason: {clean_reason}",
        creator_id=current_user["id"],
        dept=student.department or "Hostel"
    )

    return {
        "success": True,
        "message": "Leave request rejected successfully",
        "leave": {
            "id": leave.id,
            "status": "REJECTED",
            "rejection_reason": clean_reason,
            "warden_comment": leave.warden_comment,
            "warden_reviewed_at": str(leave.warden_reviewed_at),
            "updated_at": str(leave.updated_at)
        }
    }
