from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User, Timetable, TimetableEntry
from app.models.attendance import Attendance
from app.models.assignment import Assignment, Submission
from app.models.event import Event
from app.models.communication import Notification, NotificationRead
from app.models.academic import InternalMark, SemesterResult, AcademicCalendarEvent
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/me")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "department": current_user["department"],
        "roll_number": current_user["roll_number"],
    }


@router.get("/timetable/today")
async def get_today_timetable(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sem = current_user.get("semester", 1)
    if sem in (1, 2):
        year = "I"
    elif sem in (3, 4):
        year = "II"
    elif sem in (5, 6):
        year = "III"
    elif sem in (7, 8):
        year = "IV"
    else:
        year = "I"

    dept = current_user.get("department")
    section = current_user.get("section", "A")
    today = datetime.now().strftime("%A")

    # Find active timetable metadata
    timetable_res = await db.execute(
        select(Timetable)
        .where(
            Timetable.department == dept,
            Timetable.year == year,
            Timetable.section == section,
            Timetable.is_active == True,
        )
    )
    timetable = timetable_res.scalar_one_or_none()

    classes = []
    if timetable:
        entries_res = await db.execute(
            select(TimetableEntry)
            .where(
                TimetableEntry.timetable_id == timetable.id,
                TimetableEntry.day == today,
            )
            .order_by(TimetableEntry.start_time)
        )
        timetable_entries = entries_res.scalars().all()
        for entry in timetable_entries:
            classes.append(
                {
                    "subject": entry.subject,
                    "start_time": entry.start_time.strftime("%H:%M") if entry.start_time else "",
                    "end_time": entry.end_time.strftime("%H:%M") if entry.end_time else "",
                    "room": entry.room,
                }
            )

    return {"day": today, "classes": classes}


@router.get("/dashboard")
async def get_dashboard_data(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user["id"]
    user_role = current_user["role"]

    # 1. Calculate overall attendance percentage
    # Total classes marked for this student
    total_att_result = await db.execute(
        select(func.count(Attendance.id)).where(Attendance.student_id == user_id)
    )
    total_att = total_att_result.scalar() or 0

    present_att_result = await db.execute(
        select(func.count(Attendance.id)).where(
            Attendance.student_id == user_id, Attendance.status == "present"
        )
    )
    present_att = present_att_result.scalar() or 0

    attendance_percentage = (present_att / total_att * 100) if total_att > 0 else 100.0

    # 2. Pending assignments count
    # Get all assignments
    assignments_res = await db.execute(select(Assignment.id))
    all_assignment_ids = [a[0] for a in assignments_res.all()]

    # Get submitted assignments for this student
    submissions_res = await db.execute(
        select(Submission.assignment_id).where(Submission.student_id == user_id)
    )
    submitted_ids = [s[0] for s in submissions_res.all()]

    pending_assignments = len(set(all_assignment_ids) - set(submitted_ids))

    # 3. Upcoming events count
    events_res = await db.execute(
        select(func.count(Event.id)).where(Event.event_date >= date.today())
    )
    upcoming_events = events_res.scalar() or 0

    # 4. Unread notifications count using reads join
    user_sem = current_user.get("semester")
    user_year = None
    if user_role == "student" and user_sem:
        user_year = (int(user_sem) + 1) // 2

    now = datetime.now()
    conditions = []
    conditions.append(or_(Notification.target_role.is_(None), Notification.target_role == user_role))
    conditions.append(or_(Notification.department.is_(None), Notification.department == current_user.get("department")))
    
    if user_role == "student" and user_year is not None:
        conditions.append(or_(Notification.target_year.is_(None), Notification.target_year == user_year))
    else:
        conditions.append(Notification.target_year.is_(None))
        
    conditions.append(or_(Notification.user_id.is_(None), Notification.user_id == user_id))

    unread_count_query = (
        select(func.count(Notification.id))
        .outerjoin(
            NotificationRead,
            and_(
                NotificationRead.notification_id == Notification.id,
                NotificationRead.user_id == user_id
            )
        )
        .where(and_(*conditions))
        .where(Notification.created_at <= now)
        .where(or_(Notification.expires_at.is_(None), Notification.expires_at >= now))
        .where(or_(NotificationRead.is_read.is_(None), NotificationRead.is_read == False))
        .where(or_(NotificationRead.is_deleted.is_(None), NotificationRead.is_deleted == False))
    )
    unread_notifications = (await db.execute(unread_count_query)).scalar() or 0

    # 5. Fetch today's schedule
    sem = current_user.get("semester", 1)
    if sem in (1, 2):
        year_code = "I"
    elif sem in (3, 4):
        year_code = "II"
    elif sem in (5, 6):
        year_code = "III"
    elif sem in (7, 8):
        year_code = "IV"
    else:
        year_code = "I"

    dept = current_user.get("department")
    section = current_user.get("section", "A")
    today = datetime.now().strftime("%A")

    # Find active timetable metadata
    t_res = await db.execute(
        select(Timetable)
        .where(
            Timetable.department == dept,
            Timetable.year == year_code,
            Timetable.section == section,
            Timetable.is_active == True,
        )
    )
    timetable = t_res.scalar_one_or_none()

    today_classes = []
    if timetable:
        entries_res = await db.execute(
            select(TimetableEntry)
            .where(
                TimetableEntry.timetable_id == timetable.id,
                TimetableEntry.day == today,
            )
            .order_by(TimetableEntry.start_time)
        )
        timetable_entries = entries_res.scalars().all()
        today_classes = [
            {
                "id": entry.id,
                "day": entry.day,
                "startTime": entry.start_time.strftime("%H:%M") if entry.start_time else "",
                "endTime": entry.end_time.strftime("%H:%M") if entry.end_time else "",
                "subject": entry.subject,
                "subjectName": entry.subject,
                "room": entry.room,
            }
            for entry in timetable_entries
        ]

    return {
        "attendancePercentage": round(attendance_percentage, 1),
        "pendingAssignments": pending_assignments,
        "upcomingEvents": upcoming_events,
        "unreadNotifications": unread_notifications,
        "todayClasses": today_classes,
    }


@router.get("/internal-marks")
async def get_internal_marks(
    semester: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(InternalMark).where(InternalMark.student_id == current_user["id"])
    if semester:
        query = query.where(InternalMark.semester == semester)
    
    result = await db.execute(query)
    marks = result.scalars().all()

    # Format response: group by subject_name
    grouped = {}
    for m in marks:
        sub = m.subject_name
        if sub not in grouped:
            grouped[sub] = {
                "subject": sub,
                "subjectName": sub,
                "semester": m.semester,
                "cat1": None,
                "cat2": None,
                "cat3": None,
                "assignment": None,
                "total": 0.0,
                "maxTotal": 100.0,
            }
        
        exam_field = m.exam_type  # cat1, cat2, cat3, model, assignment
        if exam_field in ["cat1", "cat2", "cat3", "assignment"]:
            grouped[sub][exam_field] = m.marks_obtained
            grouped[sub]["total"] += m.marks_obtained

    return list(grouped.values())


@router.get("/semester-results")
@router.get("/results")
async def get_semester_results(
    semester: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(SemesterResult).where(SemesterResult.student_id == current_user["id"])
    if semester:
        query = query.where(SemesterResult.semester == semester)
    
    result = await db.execute(query)
    results = result.scalars().all()

    # Group by semester
    sem_grouped = {}
    for r in results:
        sem = r.semester
        if sem not in sem_grouped:
            sem_grouped[sem] = {
                "semester": sem,
                "subjects": [],
                "sgpa": r.sgpa or 0.0,
                "cgpa": r.cgpa or 0.0,
                "totalCredits": 0,
                "earnedCredits": 0,
            }
        sem_grouped[sem]["subjects"].append({
            "name": r.subject_name,
            "code": r.subject_name[:4].upper(),
            "grade": r.grade,
            "gradePoints": r.grade_points,
            "credits": r.credits,
        })
        sem_grouped[sem]["totalCredits"] += r.credits
        if r.grade != "F":
            sem_grouped[sem]["earnedCredits"] += r.credits

    return list(sem_grouped.values())


@router.get("/academic-calendar")
async def get_academic_calendar(
    month: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(AcademicCalendarEvent)
    result = await db.execute(query)
    events = result.scalars().all()

    response = []
    for e in events:
        # filter by month if specified
        if month and e.event_date.month != month:
            continue
        response.append({
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "date": str(e.event_date),
            "type": e.event_type,
            "semester": e.semester,
        })
    return response


class CreateCalendarEventRequest(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: date
    event_type: str = "academic"  # "exam" | "holiday" | "deadline" | "academic" | "cultural"
    semester: Optional[int] = None


@router.post("/academic-calendar")
async def create_academic_calendar_event(
    req: CreateCalendarEventRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user["role"] not in ("faculty", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty or admin can schedule academic calendar events",
        )
    
    new_event = AcademicCalendarEvent(
        title=req.title,
        description=req.description,
        event_date=req.event_date,
        event_type=req.event_type,
        semester=req.semester,
    )
    db.add(new_event)
    await db.flush()
    await db.refresh(new_event)
    return {
        "id": new_event.id,
        "title": new_event.title,
        "message": "Academic calendar event created successfully",
    }

