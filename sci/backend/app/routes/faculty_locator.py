from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, or_
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date, time, timedelta

from app.database import get_db
from app.models.user import User, Timetable, TimetableEntry, FacultyLeave
from app.models.department import Subject
from app.models.academic import FacultyWorkload
from app.models.communication import Notification
from app.middleware.auth_middleware import get_current_user
from app.middleware.role_checker import require_role

router = APIRouter(prefix="/faculty-locator", tags=["Faculty Locator"])

# ─── Pydantic Request/Response Schemas ────────────────────────────────────────

class FacultyStatusUpdateSchema(BaseModel):
    custom_status: Optional[str] = None
    status: Optional[str] = None
    current_room: Optional[str] = None
    note: Optional[str] = None

class LeaveSubstitutionItem(BaseModel):
    timetable_entry_id: int
    replacement_faculty_id: int

class LeaveApplySchema(BaseModel):
    leave_type: str = Field(..., description="E.g. Casual Leave, Sick Leave, Duty Leave")
    start_date: str = Field(..., description="YYYY-MM-DD")
    end_date: str = Field(..., description="YYYY-MM-DD")
    reason: Optional[str] = None

class AdminProfileUpdateSchema(BaseModel):
    faculty_id: int
    employee_id: Optional[str] = None
    staff_room: Optional[str] = None
    department: Optional[str] = None

class LeaveStatusUpdateSchema(BaseModel):
    status: str = Field(..., description="Approved, Rejected, Pending")
    substitutions: Optional[List[LeaveSubstitutionItem]] = None

class AdminLeaveCreateSchema(BaseModel):
    faculty_id: int
    leave_type: str
    start_date: str
    end_date: str
    reason: Optional[str] = None
    status: str = "Approved"

# ─── Helper Functions ────────────────────────────────────────────────────────

async def get_faculty_status_details(faculty: User, now_dt: datetime, db: AsyncSession) -> dict:
    current_date = now_dt.date()
    current_day = now_dt.strftime("%A")
    current_time = now_dt.time()

    # 1. Check for approved leaves on the current date
    leave_query = select(FacultyLeave).where(
        FacultyLeave.faculty_id == faculty.id,
        FacultyLeave.status == "Approved",
        FacultyLeave.start_date <= current_date,
        FacultyLeave.end_date >= current_date
    )
    leave_res = await db.execute(leave_query)
    leave = leave_res.scalar_one_or_none()

    if leave:
        return {
            "status": "On Leave",
            "details": {
                "leave_status": "On Leave",
                "leave_type": leave.leave_type,
                "return_date": (leave.end_date + timedelta(days=1)).strftime("%Y-%m-%d"),
                "reason": leave.reason,
                "current_location": "Out of Campus",
                "current_class": "N/A",
                "room_number": "N/A",
                "expected_free_time": (leave.end_date + timedelta(days=1)).strftime("%Y-%m-%d"),
            }
        }

    # 2. Check if currently teaching in an active timetable
    timetable_query = (
        select(TimetableEntry, Timetable)
        .join(Timetable)
        .where(
            Timetable.is_active == True,
            func.lower(TimetableEntry.faculty) == faculty.name.lower(),
            TimetableEntry.day == current_day,
            TimetableEntry.start_time <= current_time,
            TimetableEntry.end_time >= current_time
        )
    )
    timetable_res = await db.execute(timetable_query)
    class_now = timetable_res.first()

    if class_now:
        entry, timetable = class_now
        return {
            "status": "Teaching",
            "details": {
                "department": timetable.department,
                "year": timetable.year,
                "section": timetable.section,
                "classroom": entry.room or "N/A",
                "subject": entry.subject,
                "class_end_time": entry.end_time.strftime("%H:%M"),
                "current_location": entry.room or "N/A",
                "current_class": entry.subject,
                "room_number": entry.room or "N/A",
                "expected_free_time": entry.end_time.strftime("%H:%M"),
            }
        }

    # 3. Default to custom_status or "Available"
    status_label = faculty.custom_status or "Available"

    # Query next scheduled class today
    next_class_query = (
        select(TimetableEntry, Timetable)
        .join(Timetable)
        .where(
            Timetable.is_active == True,
            func.lower(TimetableEntry.faculty) == faculty.name.lower(),
            TimetableEntry.day == current_day,
            TimetableEntry.start_time > current_time
        )
        .order_by(TimetableEntry.start_time.asc())
        .limit(1)
    )
    next_class_res = await db.execute(next_class_query)
    next_class_row = next_class_res.first()

    next_class_details = None
    if next_class_row:
        entry, timetable = next_class_row
        next_class_details = {
            "subject": entry.subject,
            "start_time": entry.start_time.strftime("%H:%M"),
            "end_time": entry.end_time.strftime("%H:%M"),
            "room": entry.room or "N/A",
            "class_details": f"{timetable.department} {timetable.year}-{timetable.section}"
        }

    free_until = "End of Day"
    if next_class_details:
        free_until = next_class_details["start_time"]

    return {
        "status": status_label,
        "details": {
            "status": status_label,
            "staff_room": faculty.staff_room or "N/A",
            "next_class": next_class_details,
            "current_location": faculty.staff_room or "N/A",
            "current_class": "Free",
            "room_number": faculty.staff_room or "N/A",
            "expected_free_time": free_until,
        }
    }

# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/search")
async def search_faculty(
    query: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch all users with role 'faculty'
    faculty_select = select(User).where(User.role == "faculty")
    if department:
        faculty_select = faculty_select.where(User.department == department)
    
    faculty_res = await db.execute(faculty_select)
    all_faculties = faculty_res.scalars().all()

    now_dt = datetime.now()
    results = []

    for faculty in all_faculties:
        # Resolve subjects taught
        # 1. From Subjects Table
        subj_q = select(Subject.name).where(Subject.faculty_id == faculty.id)
        subj_res = await db.execute(subj_q)
        subjects = list(subj_res.scalars().all())

        # 2. From TimetableEntries (fallback/comprehensive)
        tt_subj_q = select(TimetableEntry.subject).where(func.lower(TimetableEntry.faculty) == faculty.name.lower())
        tt_subj_res = await db.execute(tt_subj_q)
        subjects = list(set(subjects + list(tt_subj_res.scalars().all())))

        # Get dynamic status
        status_info = await get_faculty_status_details(faculty, now_dt, db)

        # Apply search query filter
        # Search by: name, employee_id, department, or subject
        match = True
        if query:
            q = query.lower()
            name_match = q in faculty.name.lower()
            emp_match = q in (faculty.employee_id or "").lower()
            dept_match = q in (faculty.department or "").lower()
            subj_match = any(q in s.lower() for s in subjects)
            match = name_match or emp_match or dept_match or subj_match

        # Apply status filter
        if status:
            status_match = status_info["status"].lower() == status.lower()
            match = match and status_match

        if match:
            original_status = status_info["status"]
            details = status_info["details"]
            
            if current_user.get("role") == "student":
                if original_status == "Teaching":
                    mapped_status = "In Class"
                    student_details = {
                        "current_class": details.get("current_class", "Teaching"),
                        "classroom": details.get("classroom", "Classroom")
                    }
                elif original_status in ("On Leave", "Meeting", "Offline", "Busy"):
                    mapped_status = "Busy"
                    student_details = {
                        "current_class": "N/A",
                        "classroom": "N/A",
                        "current_location": "Out of Campus"
                    }
                else:
                    mapped_status = "Available"
                    student_details = {
                        "current_class": "N/A",
                        "classroom": "N/A",
                        "current_location": faculty.staff_room or "Staff Room"
                    }
                results.append({
                    "id": faculty.id,
                    "name": faculty.name,
                    "email": faculty.email,
                    "department": faculty.department or "N/A",
                    "employee_id": faculty.employee_id or "N/A",
                    "staff_room": faculty.staff_room or "N/A",
                    "subjects": subjects,
                    "status": mapped_status,
                    "status_details": student_details
                })
            else:
                results.append({
                    "id": faculty.id,
                    "name": faculty.name,
                    "email": faculty.email,
                    "department": faculty.department or "N/A",
                    "employee_id": faculty.employee_id or "N/A",
                    "staff_room": faculty.staff_room or "N/A",
                    "subjects": subjects,
                    "status": original_status,
                    "status_details": details
                })

    return results


@router.get("/my-status")
async def get_my_status(
    current_user: dict = Depends(require_role("faculty")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == current_user["id"]))
    faculty = result.scalar_one()

    now_dt = datetime.now()
    status_info = await get_faculty_status_details(faculty, now_dt, db)

    # Get today's teaching schedule
    today_day = now_dt.strftime("%A")
    timetable_query = (
        select(TimetableEntry, Timetable)
        .join(Timetable)
        .where(
            TimetableEntry.faculty == faculty.name,
            TimetableEntry.day == today_day,
            Timetable.is_active == True
        )
        .order_by(TimetableEntry.start_time)
    )
    timetable_res = await db.execute(timetable_query)
    classes = timetable_res.all()
    schedule = [
        {
            "id": c.id,
            "subject": c.subject,
            "start_time": c.start_time.strftime("%H:%M"),
            "end_time": c.end_time.strftime("%H:%M"),
            "room": c.room or "N/A",
            "class_details": f"{t.department} {t.year}-{t.section}"
        }
        for c, t in classes
    ]

    return {
        "faculty_id": faculty.id,
        "name": faculty.name,
        "custom_status": faculty.custom_status or "Available",
        "current_status": status_info["status"],
        "status_details": status_info["details"],
        "schedule_today": schedule
    }


@router.post("/update-status")
async def update_my_status(
    payload: FacultyStatusUpdateSchema,
    current_user: dict = Depends(require_role("faculty")),
    db: AsyncSession = Depends(get_db)
):
    val = payload.custom_status or payload.status or "Available"
    await db.execute(
        update(User)
        .where(User.id == current_user["id"])
        .values(custom_status=val)
    )
    await db.commit()
    return {"message": "Custom status updated successfully", "custom_status": val}


@router.get("/leaves")
async def get_my_leaves(
    current_user: dict = Depends(require_role("faculty")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FacultyLeave)
        .where(FacultyLeave.faculty_id == current_user["id"])
        .order_by(FacultyLeave.start_date.desc())
    )
    leaves = result.scalars().all()
    return [
        {
            "id": l.id,
            "leave_type": l.leave_type,
            "start_date": l.start_date.strftime("%Y-%m-%d"),
            "end_date": l.end_date.strftime("%Y-%m-%d"),
            "status": l.status,
            "reason": l.reason,
            "created_at": l.created_at.strftime("%Y-%m-%d %H:%M") if l.created_at else None
        }
        for l in leaves
    ]


@router.post("/apply-leave")
async def apply_leave(
    payload: LeaveApplySchema,
    current_user: dict = Depends(require_role("faculty")),
    db: AsyncSession = Depends(get_db)
):
    try:
        start = datetime.strptime(payload.start_date, "%Y-%m-%d").date()
        end = datetime.strptime(payload.end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    if start > end:
        raise HTTPException(status_code=400, detail="Start date must be before end date")

    new_leave = FacultyLeave(
        faculty_id=current_user["id"],
        leave_type=payload.leave_type,
        start_date=start,
        end_date=end,
        status="Pending",
        reason=payload.reason
    )
    db.add(new_leave)
    await db.commit()
    return {"message": "Leave application submitted successfully", "leave_id": new_leave.id}

# ─── Admin Endpoints ─────────────────────────────────────────────────────────

@router.get("/admin/faculties")
async def admin_get_faculties(
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(User).where(User.role == "faculty"))
    faculties = res.scalars().all()
    
    now_dt = datetime.now()
    output = []
    for f in faculties:
        status_info = await get_faculty_status_details(f, now_dt, db)
        output.append({
            "id": f.id,
            "name": f.name,
            "email": f.email,
            "employee_id": f.employee_id or "",
            "staff_room": f.staff_room or "",
            "department": f.department or "",
            "custom_status": f.custom_status or "Available",
            "current_status": status_info["status"]
        })
    return output


@router.post("/admin/update-profile")
async def admin_update_faculty_profile(
    payload: AdminProfileUpdateSchema,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    # Verify faculty user exists
    res = await db.execute(select(User).where(User.id == payload.faculty_id, User.role == "faculty"))
    faculty = res.scalar_one_or_none()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    update_vals = {}
    if payload.employee_id is not None:
        update_vals["employee_id"] = payload.employee_id
    if payload.staff_room is not None:
        update_vals["staff_room"] = payload.staff_room
    if payload.department is not None:
        update_vals["department"] = payload.department

    if update_vals:
        await db.execute(
            update(User)
            .where(User.id == payload.faculty_id)
            .values(**update_vals)
        )
        await db.commit()

    return {"message": "Faculty profile updated successfully"}


@router.get("/admin/leaves")
async def admin_get_all_leaves(
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(FacultyLeave, User)
        .join(User, FacultyLeave.faculty_id == User.id)
        .order_by(FacultyLeave.created_at.desc())
    )
    res = await db.execute(query)
    results = res.all()

    return [
        {
            "id": l.id,
            "faculty_id": l.faculty_id,
            "faculty_name": u.name,
            "faculty_email": u.email,
            "leave_type": l.leave_type,
            "start_date": l.start_date.strftime("%Y-%m-%d"),
            "end_date": l.end_date.strftime("%Y-%m-%d"),
            "status": l.status,
            "reason": l.reason,
            "created_at": l.created_at.strftime("%Y-%m-%d %H:%M") if l.created_at else None
        }
        for l, u in results
    ]


@router.post("/admin/leaves")
async def admin_create_leave(
    payload: AdminLeaveCreateSchema,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    # Verify faculty user exists
    res = await db.execute(select(User).where(User.id == payload.faculty_id, User.role == "faculty"))
    faculty = res.scalar_one_or_none()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    try:
        start = datetime.strptime(payload.start_date, "%Y-%m-%d").date()
        end = datetime.strptime(payload.end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    new_leave = FacultyLeave(
        faculty_id=payload.faculty_id,
        leave_type=payload.leave_type,
        start_date=start,
        end_date=end,
        status=payload.status,
        reason=payload.reason
    )
    db.add(new_leave)
    await db.commit()
    return {"message": "Leave record created successfully by Admin", "leave_id": new_leave.id}


@router.get("/admin/leaves/{leave_id}/substitutions")
async def get_leave_substitutions(
    leave_id: int,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(FacultyLeave).where(FacultyLeave.id == leave_id))
    leave = res.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave record not found")

    fac_res = await db.execute(select(User).where(User.id == leave.faculty_id))
    faculty = fac_res.scalar_one_or_none()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    from app.models.user import Timetable, TimetableEntry
    tt_res = await db.execute(
        select(TimetableEntry, Timetable)
        .join(Timetable)
        .where(
            Timetable.is_active == True,
            func.lower(TimetableEntry.faculty) == faculty.name.lower()
        )
    )
    conflict_slots = tt_res.all()

    suggestions = []
    dept_fac_res = await db.execute(
        select(User).where(User.role == "faculty", User.department == faculty.department, User.id != faculty.id)
    )
    other_faculties = dept_fac_res.scalars().all()

    for entry, timetable in conflict_slots:
        available_replacements = []
        for candidate in other_faculties:
            cand_leave = await db.execute(
                select(FacultyLeave).where(
                    FacultyLeave.faculty_id == candidate.id,
                    FacultyLeave.status == "Approved",
                    FacultyLeave.start_date <= leave.start_date,
                    FacultyLeave.end_date >= leave.end_date
                )
            )
            if cand_leave.scalar_one_or_none():
                continue
                
            busy_res = await db.execute(
                select(TimetableEntry)
                .join(Timetable)
                .where(
                    Timetable.is_active == True,
                    func.lower(TimetableEntry.faculty) == candidate.name.lower(),
                    TimetableEntry.day == entry.day,
                    TimetableEntry.start_time < entry.end_time,
                    TimetableEntry.end_time > entry.start_time
                )
            )
            if busy_res.first():
                continue
                
            available_replacements.append({
                "id": candidate.id,
                "name": candidate.name,
                "email": candidate.email
            })

        suggestions.append({
            "timetable_entry_id": entry.id,
            "day": entry.day,
            "subject": entry.subject,
            "start_time": entry.start_time.strftime("%H:%M"),
            "end_time": entry.end_time.strftime("%H:%M"),
            "room": entry.room or "N/A",
            "class_details": f"{timetable.department} Year {timetable.year}-{timetable.section}",
            "available_replacements": available_replacements
        })

    return {
        "leave_id": leave_id,
        "faculty_name": faculty.name,
        "department": faculty.department,
        "start_date": str(leave.start_date),
        "end_date": str(leave.end_date),
        "conflict_slots": suggestions
    }


@router.put("/admin/leaves/{leave_id}/status")
async def admin_update_leave_status(
    leave_id: int,
    payload: LeaveStatusUpdateSchema,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(FacultyLeave).where(FacultyLeave.id == leave_id))
    leave = res.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave record not found")

    if payload.status not in ["Approved", "Rejected", "Pending"]:
        raise HTTPException(status_code=400, detail="Invalid leave status")

    leave.status = payload.status

    if payload.status == "Approved" and payload.substitutions:
        from app.models.user import Timetable, TimetableEntry
        for sub in payload.substitutions:
            entry_res = await db.execute(select(TimetableEntry).where(TimetableEntry.id == sub.timetable_entry_id))
            entry = entry_res.scalar_one_or_none()
            if not entry:
                continue
            
            rep_res = await db.execute(select(User).where(User.id == sub.replacement_faculty_id))
            rep_fac = rep_res.scalar_one_or_none()
            if not rep_fac:
                continue
            
            old_fac_name = entry.faculty
            entry.faculty = rep_fac.name
            
            tt_res = await db.execute(select(Timetable).where(Timetable.id == entry.timetable_id))
            tt = tt_res.scalar_one_or_none()
            if tt:
                year_map = {"I": 1, "II": 2, "III": 3, "IV": 4}
                target_yr = year_map.get(tt.year, 1)
                
                notif = Notification(
                    title=f"Class Substitution: {entry.subject}",
                    message=f"Prof. {rep_fac.name} will teach '{entry.subject}' on {entry.day} ({entry.start_time.strftime('%H:%M')}) instead of Prof. {old_fac_name} due to leave.",
                    category="academic",
                    priority="high",
                    target_role="student",
                    department=tt.department,
                    target_year=target_yr,
                    created_by=current_user["id"]
                )
                db.add(notif)
                await db.flush()
                
                from app.utils.websocket_manager import manager as ws_manager
                await ws_manager.broadcast_notification({
                    "id": notif.id,
                    "title": notif.title,
                    "message": notif.message,
                    "target_role": notif.target_role,
                    "department": notif.department,
                    "target_year": notif.target_year,
                    "category": notif.category,
                    "priority": notif.priority,
                    "created_at": notif.created_at,
                })
            
            wl_res = await db.execute(
                select(FacultyWorkload).where(
                    FacultyWorkload.faculty_id == rep_fac.id,
                    FacultyWorkload.subject_name == entry.subject
                )
            )
            wl = wl_res.scalar_one_or_none()
            if wl:
                wl.hours_per_week += 1
            else:
                wl = FacultyWorkload(
                    faculty_id=rep_fac.id,
                    subject_name=entry.subject,
                    hours_per_week=1
                )
                db.add(wl)

    await db.commit()
    return {"message": f"Leave status updated to {payload.status}"}


@router.delete("/admin/leaves/{leave_id}")
async def admin_delete_leave(
    leave_id: int,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(FacultyLeave).where(FacultyLeave.id == leave_id))
    leave = res.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave record not found")

    await db.delete(leave)
    await db.commit()
    return {"message": "Leave record deleted successfully"}
