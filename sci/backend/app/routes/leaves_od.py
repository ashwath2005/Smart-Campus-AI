from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

from app.database import get_db
from app.models.user import User, StudentLeave, StudentOD
from app.models.attendance import Attendance
from app.models.communication import Notification
from app.middleware.auth_middleware import get_current_user
from app.middleware.role_checker import require_role
from app.utils.websocket_manager import manager as ws_manager

router = APIRouter(prefix="/workflows", tags=["Workflows (Leave & OD)"])


class ApplyLeaveRequest(BaseModel):
    leave_type: str
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD
    reason: str
    supporting_document: Optional[str] = None
    advisor_id: Optional[int] = None


class ApplyODRequest(BaseModel):
    event_title: str
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD
    reason: str
    description: Optional[str] = None
    supporting_document: Optional[str] = None
    advisor_id: Optional[int] = None


class ReviewRequest(BaseModel):
    status: str  # Pending HOD Approval / Rejected
    comment: str


class ApproveRequest(BaseModel):
    status: str  # Approved / Rejected
    comment: str


# Helper to send notifications
async def send_workflow_notification(db: AsyncSession, title: str, message: str, role: str, dept: str, user_id: int, creator_id: int):
    notif = Notification(
        title=title,
        message=message,
        category="academic",
        priority="normal",
        target_role=role,
        department=dept,
        user_id=user_id,
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


# ─── Leave Endpoints ─────────────────────────────────────────────────────────

@router.post("/leaves")
async def apply_student_leave(
    req: ApplyLeaveRequest,
    current_user: dict = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db)
):
    try:
        start = datetime.strptime(req.start_date, "%Y-%m-%d").date()
        end = datetime.strptime(req.end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    if start > end:
        raise HTTPException(status_code=400, detail="Start date must be before end date")

    advisor_id = req.advisor_id
    if not advisor_id:
        student_res = await db.execute(select(User).where(User.id == current_user["id"]))
        student = student_res.scalar_one()
        advisor_id = student.advisor_id

    if not advisor_id:
        fac_res = await db.execute(
            select(User).where(User.role == "faculty", User.department == current_user["department"]).limit(1)
        )
        fac = fac_res.scalar_one_or_none()
        if not fac:
            raise HTTPException(status_code=400, detail="No advisor assigned and no faculty found in CSE department.")
        advisor_id = fac.id

    new_leave = StudentLeave(
        student_id=current_user["id"],
        advisor_id=advisor_id,
        leave_type=req.leave_type,
        start_date=start,
        end_date=end,
        reason=req.reason,
        supporting_document=req.supporting_document,
        status="Pending Faculty Review"
    )
    db.add(new_leave)
    await db.flush()
    await db.commit()

    await send_workflow_notification(
        db,
        title="New Student Leave Request",
        message=f"Student {current_user['name']} has applied for {req.leave_type} from {req.start_date} to {req.end_date} and is waiting for your review.",
        role="faculty",
        dept=current_user["department"],
        user_id=advisor_id,
        creator_id=current_user["id"]
    )

    return {"message": "Leave request submitted successfully", "leave_id": new_leave.id}


@router.get("/leaves")
async def list_student_leaves(
    student_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    role = current_user["role"]
    query = select(StudentLeave, User).join(User, StudentLeave.student_id == User.id)

    if role == "student":
        query = query.where(StudentLeave.student_id == current_user["id"])
    elif role == "faculty":
        query = query.where(StudentLeave.advisor_id == current_user["id"])
    elif role == "hod":
        query = query.where(User.department == current_user["department"])
    elif role == "admin":
        if student_id:
            query = query.where(StudentLeave.student_id == student_id)
    else:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    if status:
        query = query.where(StudentLeave.status == status)

    query = query.order_by(StudentLeave.created_at.desc())
    res = await db.execute(query)
    rows = res.all()

    output = []
    for leave, student in rows:
        adv_res = await db.execute(select(User.name).where(User.id == leave.advisor_id))
        adv_name = adv_res.scalar() or "N/A"

        fac_rev_name = "N/A"
        if leave.faculty_reviewer_id:
            fac_rev_res = await db.execute(select(User.name).where(User.id == leave.faculty_reviewer_id))
            fac_rev_name = fac_rev_res.scalar() or "N/A"

        hod_rev_name = "N/A"
        if leave.hod_reviewer_id:
            hod_rev_res = await db.execute(select(User.name).where(User.id == leave.hod_reviewer_id))
            hod_rev_name = hod_rev_res.scalar() or "N/A"

        output.append({
            "id": leave.id,
            "student_id": leave.student_id,
            "student_name": student.name,
            "student_email": student.email,
            "student_dept": student.department,
            "student_roll": student.roll_number,
            "advisor_id": leave.advisor_id,
            "advisor_name": adv_name,
            "leave_type": leave.leave_type,
            "start_date": str(leave.start_date),
            "end_date": str(leave.end_date),
            "reason": leave.reason,
            "supporting_document": leave.supporting_document,
            "status": leave.status,
            "faculty_comment": leave.faculty_comment,
            "faculty_reviewer_name": fac_rev_name,
            "faculty_reviewed_at": str(leave.faculty_reviewed_at) if leave.faculty_reviewed_at else None,
            "hod_comment": leave.hod_comment,
            "hod_reviewer_name": hod_rev_name,
            "hod_reviewed_at": str(leave.hod_reviewed_at) if leave.hod_reviewed_at else None,
            "created_at": str(leave.created_at) if leave.created_at else None
        })

    return output


@router.put("/leaves/{leave_id}/review")
async def review_student_leave(
    leave_id: int,
    req: ReviewRequest,
    current_user: dict = Depends(require_role("faculty")),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(StudentLeave).where(StudentLeave.id == leave_id))
    leave = res.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if leave.advisor_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="You are not the assigned advisor for this request")

    if req.status not in ["Pending HOD Approval", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid review status. Must be 'Pending HOD Approval' or 'Rejected'")

    leave.status = req.status
    leave.faculty_comment = req.comment
    leave.faculty_reviewer_id = current_user["id"]
    leave.faculty_reviewed_at = datetime.now()

    await db.flush()
    await db.commit()

    std_res = await db.execute(select(User).where(User.id == leave.student_id))
    student = std_res.scalar_one()

    await send_workflow_notification(
        db,
        title="Leave Request Reviewed by Faculty",
        message=f"Advisor {current_user['name']} has reviewed your leave application. Current status: {req.status}.",
        role="student",
        dept=student.department,
        user_id=leave.student_id,
        creator_id=current_user["id"]
    )

    if req.status == "Pending HOD Approval":
        hod_res = await db.execute(select(User).where(User.role == "hod", User.department == student.department).limit(1))
        hod = hod_res.scalar_one_or_none()
        if hod:
            await send_workflow_notification(
                db,
                title="Pending Student Leave Approval",
                message=f"Student {student.name} has a leave request forwarded by Faculty Advisor and is waiting for your final approval.",
                role="hod",
                dept=student.department,
                user_id=hod.id,
                creator_id=current_user["id"]
            )

    return {"message": f"Leave request updated to '{req.status}'"}


@router.put("/leaves/{leave_id}/approve")
async def approve_student_leave(
    leave_id: int,
    req: ApproveRequest,
    current_user: dict = Depends(require_role("hod")),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(StudentLeave).where(StudentLeave.id == leave_id))
    leave = res.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    std_res = await db.execute(select(User).where(User.id == leave.student_id))
    student = std_res.scalar_one()

    if student.department != current_user["department"]:
        raise HTTPException(status_code=403, detail="HOD can only approve leaves within their department")

    if req.status not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid approval status. Must be 'Approved' or 'Rejected'")

    leave.status = req.status
    leave.hod_comment = req.comment
    leave.hod_reviewer_id = current_user["id"]
    leave.hod_reviewed_at = datetime.now()

    if req.status == "Approved":
        # Regularize attendance records within the Leave date range
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
                att.remarks = f"Excused via Approved Leave #{leave.id} ({leave.leave_type})"

    await db.flush()
    await db.commit()

    await send_workflow_notification(
        db,
        title=f"Leave Request {req.status}",
        message=f"HOD {current_user['name']} has {req.status.lower()} your leave application. Comment: {req.comment or 'None'}.",
        role="student",
        dept=student.department,
        user_id=leave.student_id,
        creator_id=current_user["id"]
    )

    return {"message": f"Leave request final status set to '{req.status}'"}


# ─── OD Endpoints ───────────────────────────────────────────────────────────

@router.post("/ods")
async def apply_student_od(
    req: ApplyODRequest,
    current_user: dict = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db)
):
    try:
        start = datetime.strptime(req.start_date, "%Y-%m-%d").date()
        end = datetime.strptime(req.end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    if start > end:
        raise HTTPException(status_code=400, detail="Start date must be before end date")

    advisor_id = req.advisor_id
    if not advisor_id:
        student_res = await db.execute(select(User).where(User.id == current_user["id"]))
        student = student_res.scalar_one()
        advisor_id = student.advisor_id

    if not advisor_id:
        fac_res = await db.execute(
            select(User).where(User.role == "faculty", User.department == current_user["department"]).limit(1)
        )
        fac = fac_res.scalar_one_or_none()
        if not fac:
            raise HTTPException(status_code=400, detail="No advisor assigned and no faculty found in department.")
        advisor_id = fac.id

    new_od = StudentOD(
        student_id=current_user["id"],
        advisor_id=advisor_id,
        event_title=req.event_title,
        start_date=start,
        end_date=end,
        reason=req.reason,
        description=req.description,
        supporting_document=req.supporting_document,
        status="Pending Faculty Review"
    )
    db.add(new_od)
    await db.flush()
    await db.commit()

    await send_workflow_notification(
        db,
        title="New Student On-Duty Request",
        message=f"Student {current_user['name']} has applied for On-Duty for '{req.event_title}' from {req.start_date} to {req.end_date}.",
        role="faculty",
        dept=current_user["department"],
        user_id=advisor_id,
        creator_id=current_user["id"]
    )

    return {"message": "On-Duty request submitted successfully", "od_id": new_od.id}


@router.get("/ods")
async def list_student_ods(
    student_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    role = current_user["role"]
    query = select(StudentOD, User).join(User, StudentOD.student_id == User.id)

    if role == "student":
        query = query.where(StudentOD.student_id == current_user["id"])
    elif role == "faculty":
        query = query.where(StudentOD.advisor_id == current_user["id"])
    elif role == "hod":
        query = query.where(User.department == current_user["department"])
    elif role == "admin":
        if student_id:
            query = query.where(StudentOD.student_id == student_id)
    else:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    if status:
        query = query.where(StudentOD.status == status)

    query = query.order_by(StudentOD.created_at.desc())
    res = await db.execute(query)
    rows = res.all()

    output = []
    for od, student in rows:
        adv_res = await db.execute(select(User.name).where(User.id == od.advisor_id))
        adv_name = adv_res.scalar() or "N/A"

        fac_rev_name = "N/A"
        if od.faculty_reviewer_id:
            fac_rev_res = await db.execute(select(User.name).where(User.id == od.faculty_reviewer_id))
            fac_rev_name = fac_rev_res.scalar() or "N/A"

        hod_rev_name = "N/A"
        if od.hod_reviewer_id:
            hod_rev_res = await db.execute(select(User.name).where(User.id == od.hod_reviewer_id))
            hod_rev_name = hod_rev_res.scalar() or "N/A"

        output.append({
            "id": od.id,
            "student_id": od.student_id,
            "student_name": student.name,
            "student_email": student.email,
            "student_dept": student.department,
            "student_roll": student.roll_number,
            "advisor_id": od.advisor_id,
            "advisor_name": adv_name,
            "event_title": od.event_title,
            "start_date": str(od.start_date),
            "end_date": str(od.end_date),
            "reason": od.reason,
            "description": od.description,
            "supporting_document": od.supporting_document,
            "status": od.status,
            "faculty_comment": od.faculty_comment,
            "faculty_reviewer_name": fac_rev_name,
            "faculty_reviewed_at": str(od.faculty_reviewed_at) if od.faculty_reviewed_at else None,
            "hod_comment": od.hod_comment,
            "hod_reviewer_name": hod_rev_name,
            "hod_reviewed_at": str(od.hod_reviewed_at) if od.hod_reviewed_at else None,
            "created_at": str(od.created_at) if od.created_at else None
        })

    return output


@router.put("/ods/{od_id}/review")
async def review_student_od(
    od_id: int,
    req: ReviewRequest,
    current_user: dict = Depends(require_role("faculty")),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(StudentOD).where(StudentOD.id == od_id))
    od = res.scalar_one_or_none()
    if not od:
        raise HTTPException(status_code=404, detail="On-Duty request not found")

    if od.advisor_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="You are not the assigned advisor for this request")

    if req.status not in ["Pending HOD Approval", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'Pending HOD Approval' or 'Rejected'")

    od.status = req.status
    od.faculty_comment = req.comment
    od.faculty_reviewer_id = current_user["id"]
    od.faculty_reviewed_at = datetime.now()

    await db.flush()
    await db.commit()

    std_res = await db.execute(select(User).where(User.id == od.student_id))
    student = std_res.scalar_one()

    await send_workflow_notification(
        db,
        title="On-Duty Request Reviewed",
        message=f"Faculty {current_user['name']} has reviewed your OD request. Current status: {req.status}.",
        role="student",
        dept=student.department,
        user_id=od.student_id,
        creator_id=current_user["id"]
    )

    if req.status == "Pending HOD Approval":
        hod_res = await db.execute(select(User).where(User.role == "hod", User.department == student.department).limit(1))
        hod = hod_res.scalar_one_or_none()
        if hod:
            await send_workflow_notification(
                db,
                title="Pending Student OD Approval",
                message=f"Student {student.name} has an OD request forwarded by Faculty Advisor and is waiting for your final approval.",
                role="hod",
                dept=student.department,
                user_id=hod.id,
                creator_id=current_user["id"]
            )

    return {"message": f"On-Duty request reviewed and status updated to '{req.status}'"}


@router.put("/ods/{od_id}/approve")
async def approve_student_od(
    od_id: int,
    req: ApproveRequest,
    current_user: dict = Depends(require_role("hod")),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(StudentOD).where(StudentOD.id == od_id))
    od = res.scalar_one_or_none()
    if not od:
        raise HTTPException(status_code=404, detail="On-Duty request not found")

    std_res = await db.execute(select(User).where(User.id == od.student_id))
    student = std_res.scalar_one()

    if student.department != current_user["department"]:
        raise HTTPException(status_code=403, detail="HOD can only approve requests within their department")

    if req.status not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid approval status. Must be 'Approved' or 'Rejected'")

    od.status = req.status
    od.hod_comment = req.comment
    od.hod_reviewer_id = current_user["id"]
    od.hod_reviewed_at = datetime.now()

    if req.status == "Approved":
        # Regularize attendance records within the OD date range
        att_query = select(Attendance).where(
            Attendance.student_id == od.student_id,
            Attendance.date >= od.start_date,
            Attendance.date <= od.end_date
        )
        att_records = (await db.execute(att_query)).scalars().all()
        for att in att_records:
            if att.status in ["absent", "Absent"]:
                att.status = "present"
                att.status_type = "od"
                att.remarks = f"Regularized by OD #{od.id}: {od.event_title}"

    await db.flush()
    await db.commit()

    await send_workflow_notification(
        db,
        title=f"On-Duty Request {req.status}",
        message=f"HOD {current_user['name']} has {req.status.lower()} your On-Duty application. Comment: {req.comment or 'None'}.",
        role="student",
        dept=student.department,
        user_id=od.student_id,
        creator_id=current_user["id"]
    )

    return {"message": f"On-Duty request final status set to '{req.status}'"}
