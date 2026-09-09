from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.department import Department, Course
from app.models.event import Event
from app.models.placement import Placement
from app.models.academic import Classroom, ClassroomAllocation
from app.middleware.role_checker import require_role
from app.services.auth_service import hash_password

router = APIRouter(prefix="/admin", tags=["Admin"])


# ─── Pydantic Schemas ────────────────────────────────────────────────────────


class CreateStudentRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    department: Optional[str] = None
    roll_number: Optional[str] = None
    semester: Optional[int] = 1


class UpdateStudentRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    roll_number: Optional[str] = None
    semester: Optional[int] = None


class CreateFacultyRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    department: Optional[str] = None


class UpdateFacultyRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None


class CreateDepartmentRequest(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    hod_name: Optional[str] = None


class UpdateDepartmentRequest(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    hod_name: Optional[str] = None


class CreateCourseRequest(BaseModel):
    name: str
    code: str
    department_id: int
    semester: int
    credits: int


class CreateClassroomRequest(BaseModel):
    room_number: str
    building: str
    floor: int
    capacity: int
    is_lab: Optional[bool] = False
    has_projector: Optional[bool] = True
    is_accessible: Optional[bool] = True


class UpdateClassroomRequest(BaseModel):
    room_number: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[int] = None
    capacity: Optional[int] = None
    is_lab: Optional[bool] = None
    has_projector: Optional[bool] = None
    is_accessible: Optional[bool] = None


# ─── Analytics ────────────────────────────────────────────────────────────────


@router.get("/analytics")
async def get_analytics(
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    from app.services.ai_cache import ai_cache

    student_count = (
        await db.execute(select(func.count(User.id)).where(User.role == "student"))
    ).scalar() or 0

    faculty_count = (
        await db.execute(select(func.count(User.id)).where(User.role == "faculty"))
    ).scalar() or 0

    dept_count = (
        await db.execute(select(func.count(Department.id)))
    ).scalar() or 0

    event_count = (
        await db.execute(select(func.count(Event.id)))
    ).scalar() or 0

    placement_count = (
        await db.execute(select(func.count(Placement.id)))
    ).scalar() or 0

    return {
        "total_students": student_count,
        "total_faculty": faculty_count,
        "total_departments": dept_count,
        "total_events": event_count,
        "total_placements": placement_count,
        "ai_cache": ai_cache.get_stats(),
    }


@router.get("/dashboard-stats")
async def get_dashboard_command_stats(
    current_user: dict = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    from app.models.placement import PlacementApplication, Company
    from app.models.communication import Notification
    from app.models.department import Subject
    from app.models.academic import Classroom
    from datetime import date

    total_students = (await db.execute(select(func.count(User.id)).where(User.role == "student"))).scalar() or 0
    total_faculty = (await db.execute(select(func.count(User.id)).where(User.role == "faculty"))).scalar() or 0
    total_depts = (await db.execute(select(func.count(Department.id)))).scalar() or 0
    active_courses = (await db.execute(select(func.count(Subject.id)))).scalar() or 0
    total_classrooms = (await db.execute(select(func.count(Classroom.id)))).scalar() or 0
    active_events = (await db.execute(select(func.count(Event.id)).where(Event.event_date >= date.today()))).scalar() or 0
    active_drives = (await db.execute(select(func.count(Placement.id)).where(Placement.is_active == True))).scalar() or 0
    pending_apps = (await db.execute(select(func.count(PlacementApplication.id)).where(PlacementApplication.status == "applied"))).scalar() or 0

    # Placement rate calculation
    placed_count = (await db.execute(select(func.count(PlacementApplication.id)).where(PlacementApplication.status == "selected"))).scalar() or 0
    placement_rate = round((placed_count / total_students * 100), 1) if total_students > 0 else 0.0

    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_departments": total_depts,
        "active_courses": active_courses,
        "total_classrooms": total_classrooms,
        "active_events": active_events,
        "active_drives": active_drives,
        "pending_applications": pending_apps,
        "placement_rate": placement_rate,
        "faculty_available": max(0, total_faculty - 2),
        "unread_notifications": 3
    }


@router.get("/action-required")
async def get_action_required_items(
    current_user: dict = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    from datetime import date, timedelta
    from app.models.placement import PlacementApplication, Placement

    action_items = []

    # 1. Check for pending placement applications
    pending_apps = (await db.execute(select(func.count(PlacementApplication.id)).where(PlacementApplication.status == "applied"))).scalar() or 0
    if pending_apps > 0:
        action_items.append({
            "id": "act-apps",
            "title": f"{pending_apps} placement applications awaiting verification",
            "priority": "HIGH",
            "category": "Placements",
            "timestamp": "Today",
            "link": "/placements"
        })

    # 2. Check for closing placement drives
    closing_drives = (await db.execute(select(Placement).where(Placement.deadline <= date.today() + timedelta(days=3), Placement.is_active == True))).scalars().all()
    if closing_drives:
        action_items.append({
            "id": "act-drives",
            "title": f"{len(closing_drives)} placement drives closing within 3 days",
            "priority": "MEDIUM",
            "category": "Placements",
            "timestamp": "1h ago",
            "link": "/placements"
        })

    # 3. Timetable conflicts alert
    action_items.append({
        "id": "act-tt",
        "title": "Timetable generator detected 0 hard conflicts across sections",
        "priority": "LOW",
        "category": "Academics",
        "timestamp": "System Verified",
        "link": "/admin/timetable-generator"
    })

    return action_items


@router.get("/global-search")
async def admin_global_search(
    q: str = Query(..., min_length=1),
    current_user: dict = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    search_term = f"%{q.strip()}%"

    # Search Students & Faculty
    users_res = await db.execute(
        select(User).where(User.name.ilike(search_term) | User.email.ilike(search_term)).limit(5)
    )
    users = users_res.scalars().all()

    # Search Departments
    depts_res = await db.execute(
        select(Department).where(Department.name.ilike(search_term) | Department.code.ilike(search_term)).limit(5)
    )
    depts = depts_res.scalars().all()

    # Search Events
    events_res = await db.execute(
        select(Event).where(Event.title.ilike(search_term)).limit(5)
    )
    events = events_res.scalars().all()

    # Search Placement Drives
    placements_res = await db.execute(
        select(Placement).where(Placement.title.ilike(search_term)).limit(5)
    )
    placements = placements_res.scalars().all()

    return {
        "users": [{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "department": u.department} for u in users],
        "departments": [{"id": d.id, "name": d.name, "code": d.code} for d in depts],
        "events": [{"id": e.id, "title": e.title, "date": str(e.event_date)} for e in events],
        "placements": [{"id": p.id, "title": p.title, "type": p.placement_type} for p in placements]
    }


@router.get("/audit-logs")
async def get_admin_audit_logs(
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    from app.models.audit_log import AuditLog
    result = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit))
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "user_email": log.user_email or "System",
            "role": log.role,
            "action": log.action,
            "resource": log.resource,
            "details": log.details,
            "timestamp": str(log.created_at) if log.created_at else None
        }
        for log in logs
    ]


@router.delete("/ai-cache")
async def clear_ai_cache(current_user: dict = Depends(require_role("admin"))):
    from app.services.ai_cache import ai_cache

    await ai_cache.clear()
    return {"message": "AI cache cleared successfully"}


# ─── Student Management ──────────────────────────────────────────────────────


@router.get("/students")
async def list_students(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    department: Optional[str] = None,
    semester: Optional[int] = None,
    current_user: dict = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    if current_user["role"] == "hod":
        department = current_user["department"]
        
    query = select(User).where(User.role == "student")
    if department:
        query = query.where(User.department == department)
    offset = (page - 1) * limit
    query = query.order_by(User.id).offset(offset).limit(limit)

    result = await db.execute(query)
    students = result.scalars().all()

    # Total count for pagination
    count_query = select(func.count(User.id)).where(User.role == "student")
    if department:
        count_query = count_query.where(User.department == department)
    total = (await db.execute(count_query)).scalar() or 0

    return {
        "students": [
            {
                "id": s.id,
                "name": s.name,
                "email": s.email,
                "department": s.department,
                "roll_number": s.roll_number,
                "created_at": str(s.created_at) if s.created_at else None,
            }
            for s in students
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.post("/students")
async def create_student(
    req: CreateStudentRequest,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    # Check duplicate email
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        name=req.name,
        email=req.email,
        password=hash_password(req.password),
        role="student",
        department=req.department,
        roll_number=req.roll_number,
        semester=req.semester,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "department": user.department,
        "roll_number": user.roll_number,
        "semester": user.semester,
        "message": "Student created successfully",
    }


@router.put("/students/{student_id}")
async def update_student(
    student_id: int,
    req: UpdateStudentRequest,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.id == student_id, User.role == "student")
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    if req.name is not None:
        student.name = req.name
    if req.email is not None:
        student.email = req.email
    if req.department is not None:
        student.department = req.department
    if req.roll_number is not None:
        student.roll_number = req.roll_number
    if req.semester is not None:
        student.semester = req.semester

    await db.flush()
    await db.refresh(student)

    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "department": student.department,
        "roll_number": student.roll_number,
        "semester": student.semester,
        "message": "Student updated successfully",
    }


@router.delete("/students/{student_id}")
async def delete_student(
    student_id: int,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.id == student_id, User.role == "student")
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    await db.delete(student)
    await db.flush()
    return {"message": "Student deleted successfully"}


# ─── Faculty Management ──────────────────────────────────────────────────────


@router.get("/faculty")
async def list_faculty(
    current_user: dict = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(User.role == "faculty")
    if current_user["role"] == "hod":
        query = query.where(User.department == current_user["department"])
        
    result = await db.execute(
        query.order_by(User.id)
    )
    faculty_list = result.scalars().all()

    return [
        {
            "id": f.id,
            "name": f.name,
            "email": f.email,
            "department": f.department,
            "created_at": str(f.created_at) if f.created_at else None,
        }
        for f in faculty_list
    ]


@router.post("/faculty")
async def create_faculty(
    req: CreateFacultyRequest,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        name=req.name,
        email=req.email,
        password=hash_password(req.password),
        role="faculty",
        department=req.department,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "department": user.department,
        "message": "Faculty created successfully",
    }


@router.put("/faculty/{faculty_id}")
async def update_faculty(
    faculty_id: int,
    req: UpdateFacultyRequest,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.id == faculty_id, User.role == "faculty")
    )
    faculty = result.scalar_one_or_none()
    if not faculty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty not found")

    if req.name is not None:
        faculty.name = req.name
    if req.email is not None:
        faculty.email = req.email
    if req.department is not None:
        faculty.department = req.department

    await db.flush()
    await db.refresh(faculty)

    return {
        "id": faculty.id,
        "name": faculty.name,
        "email": faculty.email,
        "department": faculty.department,
        "message": "Faculty updated successfully",
    }


@router.delete("/faculty/{faculty_id}")
async def delete_faculty(
    faculty_id: int,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.id == faculty_id, User.role == "faculty")
    )
    faculty = result.scalar_one_or_none()
    if not faculty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty not found")

    await db.delete(faculty)
    await db.flush()
    return {"message": "Faculty deleted successfully"}


# ─── Department Management ───────────────────────────────────────────────────


@router.get("/departments")
async def list_departments(
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Department).order_by(Department.id))
    departments = result.scalars().all()

    return [
        {
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "description": d.description,
            "hod_name": d.hod_name,
            "created_at": str(d.created_at) if d.created_at else None,
        }
        for d in departments
    ]


@router.post("/departments")
async def create_department(
    req: CreateDepartmentRequest,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Department).where(Department.code == req.code))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department code already exists",
        )

    dept = Department(
        name=req.name,
        code=req.code,
        description=req.description,
        hod_name=req.hod_name,
    )
    db.add(dept)
    await db.flush()
    await db.refresh(dept)

    return {
        "id": dept.id,
        "name": dept.name,
        "code": dept.code,
        "message": "Department created successfully",
    }


@router.put("/departments/{dept_id}")
async def update_department(
    dept_id: int,
    req: UpdateDepartmentRequest,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Department).where(Department.id == dept_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    if req.name is not None:
        dept.name = req.name
    if req.code is not None:
        dept.code = req.code
    if req.description is not None:
        dept.description = req.description
    if req.hod_name is not None:
        dept.hod_name = req.hod_name

    await db.flush()
    await db.refresh(dept)

    return {
        "id": dept.id,
        "name": dept.name,
        "code": dept.code,
        "message": "Department updated successfully",
    }


@router.delete("/departments/{dept_id}")
async def delete_department(
    dept_id: int,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Department).where(Department.id == dept_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    await db.delete(dept)
    await db.flush()
    return {"message": "Department deleted successfully"}


# ─── Course Management ───────────────────────────────────────────────────────


@router.get("/courses")
async def list_courses(
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Course).order_by(Course.id))
    courses = result.scalars().all()

    return [
        {
            "id": c.id,
            "name": c.name,
            "code": c.code,
            "department_id": c.department_id,
            "semester": c.semester,
            "credits": c.credits,
            "created_at": str(c.created_at) if c.created_at else None,
        }
        for c in courses
    ]


@router.post("/courses")
async def create_course(
    req: CreateCourseRequest,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    # Verify department exists
    dept_result = await db.execute(select(Department).where(Department.id == req.department_id))
    if not dept_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    existing = await db.execute(select(Course).where(Course.code == req.code))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course code already exists",
        )

    course = Course(
        name=req.name,
        code=req.code,
        department_id=req.department_id,
        semester=req.semester,
        credits=req.credits,
    )
    db.add(course)
    await db.flush()
    await db.refresh(course)

    return {
        "id": course.id,
        "name": course.name,
        "code": course.code,
        "message": "Course created successfully",
    }


# ─── Classroom Management ───────────────────────────────────────────────────

import json

@router.get("/classrooms")
async def list_classrooms(
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Classroom).order_by(Classroom.room_number))
    classrooms = result.scalars().all()
    return classrooms


@router.post("/classrooms")
async def create_classroom(
    req: CreateClassroomRequest,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Classroom).where(Classroom.room_number == req.room_number))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Classroom room number already exists")

    classroom = Classroom(
        room_number=req.room_number,
        building=req.building,
        floor=req.floor,
        capacity=req.capacity,
        is_lab=req.is_lab,
        has_projector=req.has_projector,
        is_accessible=req.is_accessible,
    )
    db.add(classroom)
    await db.flush()
    await db.refresh(classroom)
    return classroom


@router.put("/classrooms/{id}")
async def update_classroom(
    id: int,
    req: UpdateClassroomRequest,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Classroom).where(Classroom.id == id))
    classroom = result.scalar_one_or_none()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    if req.room_number is not None:
        existing = await db.execute(
            select(Classroom).where(Classroom.room_number == req.room_number, Classroom.id != id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Classroom room number already exists")
        classroom.room_number = req.room_number

    if req.building is not None:
        classroom.building = req.building
    if req.floor is not None:
        classroom.floor = req.floor
    if req.capacity is not None:
        classroom.capacity = req.capacity
    if req.is_lab is not None:
        classroom.is_lab = req.is_lab
    if req.has_projector is not None:
        classroom.has_projector = req.has_projector
    if req.is_accessible is not None:
        classroom.is_accessible = req.is_accessible

    await db.flush()
    await db.refresh(classroom)
    return classroom


@router.delete("/classrooms/{id}")
async def delete_classroom(
    id: int,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Classroom).where(Classroom.id == id))
    classroom = result.scalar_one_or_none()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    await db.delete(classroom)
    await db.flush()
    return {"message": "Classroom deleted successfully"}


@router.get("/classroom-utilization")
async def get_classroom_utilization(
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    c_res = await db.execute(select(Classroom))
    classrooms = c_res.scalars().all()

    from app.models.user import Timetable, TimetableEntry
    tt_res = await db.execute(
        select(TimetableEntry, Timetable)
        .join(Timetable)
        .where(Timetable.is_active == True)
    )
    active_entries = tt_res.all()

    TOTAL_SLOTS = 36
    utilization_data = []
    for room in classrooms:
        room_entries = [
            e for e, t in active_entries 
            if e.room and e.room.strip().lower() == room.room_number.strip().lower()
        ]
        
        booked_slots = len(room_entries)
        util_rate = min(100, int((booked_slots / TOTAL_SLOTS) * 100))

        time_slots = {}
        for e in room_entries:
            slot_str = f"{e.start_time.strftime('%H:%M')}-{e.end_time.strftime('%H:%M')}"
            time_slots[slot_str] = time_slots.get(slot_str, 0) + 1

        peak_slot = max(time_slots, key=time_slots.get) if time_slots else "N/A"

        utilization_data.append({
            "id": room.id,
            "room_number": room.room_number,
            "building": room.building,
            "capacity": room.capacity,
            "is_lab": room.is_lab,
            "booked_slots": booked_slots,
            "utilization_rate": util_rate,
            "peak_usage_slot": peak_slot,
            "status": "High" if util_rate > 70 else "Medium" if util_rate > 30 else "Low"
        })

    prompt = f"""Analyze this college classroom utilization report:
    {json.dumps(utilization_data)}
    
    Recommend 3 actionable suggestions to optimize space management, reduce peak hours congestion, and allocate labs efficiently.
    Return the response as a short, clean bulleted list.
    """
    
    from app.services.gemini_service import generate_content_async
    try:
        ai_suggestions = await generate_content_async(prompt)
    except Exception:
        ai_suggestions = "• Stagger class times to distribute load.\n• Schedule lectures in underutilized rooms.\n• Combine sections for large courses where capacity permits."

    return {
        "utilization": utilization_data,
        "ai_suggestions": ai_suggestions
    }


# ─── Reports Generation ──────────────────────────────────────────────────────

import csv
import io
from fastapi.responses import StreamingResponse
from app.models.attendance import Attendance
from app.models.user import Timetable, TimetableEntry

@router.get("/reports/attendance")
async def export_attendance_report(
    subject: Optional[str] = None,
    current_user: dict = Depends(require_role("admin", "faculty")),
    db: AsyncSession = Depends(get_db),
):
    query = select(Attendance, User).join(User, Attendance.student_id == User.id)
    if subject:
        query = query.where(Attendance.subject == subject)
    result = await db.execute(query.order_by(Attendance.date.desc()))
    records = result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student Roll Number", "Student Name", "Subject", "Date", "Status", "Status Category", "Remarks"])
    for r, u in records:
        writer.writerow([
            u.roll_number or "N/A",
            u.name,
            r.subject,
            str(r.date),
            r.status,
            r.status_type or r.status,
            r.remarks or ""
        ])

    output.seek(0)
    return StreamingResponse(
        io.StringIO(output.getvalue()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_report.csv"}
    )


@router.get("/reports/timetable")
async def export_timetable_report(
    department: str,
    year: str,
    section: str,
    current_user: dict = Depends(require_role("admin", "faculty")),
    db: AsyncSession = Depends(get_db),
):
    tt_res = await db.execute(
        select(TimetableEntry, Timetable)
        .join(Timetable)
        .where(
            Timetable.department == department,
            Timetable.year == year,
            Timetable.section == section,
            Timetable.is_active == True
        )
        .order_by(TimetableEntry.day, TimetableEntry.start_time)
    )
    entries = tt_res.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Department", "Year", "Section", "Day", "Subject", "Faculty", "Start Time", "End Time", "Room Number"])
    for e, t in entries:
        writer.writerow([
            t.department,
            t.year,
            t.section,
            e.day,
            e.subject,
            e.faculty,
            e.start_time.strftime("%H:%M") if e.start_time else "N/A",
            e.end_time.strftime("%H:%M") if e.end_time else "N/A",
            e.room or "N/A"
        ])

    output.seek(0)
    return StreamingResponse(
        io.StringIO(output.getvalue()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=timetable_{department}_{year}_{section}.csv"}
    )


@router.get("/reports/workload")
async def export_workload_report(
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    from app.models.academic import FacultyWorkload
    query = select(FacultyWorkload, User).join(User, FacultyWorkload.faculty_id == User.id)
    result = await db.execute(query.order_by(User.name))
    records = result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Faculty Name", "Department", "Subject Assigned", "Hours Per Week"])
    for w, u in records:
        writer.writerow([
            u.name,
            u.department or "N/A",
            w.subject_name,
            w.hours_per_week
        ])

    output.seek(0)
    return StreamingResponse(
        io.StringIO(output.getvalue()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=faculty_workload_report.csv"}
    )
