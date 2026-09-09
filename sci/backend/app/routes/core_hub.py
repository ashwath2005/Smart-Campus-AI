from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update, func, or_
from app.database import get_db
from app.middleware.role_checker import require_role
from app.models.department import Department, Course, Subject
from app.models.academic import Classroom, Section, Building, AcademicYear, Semester
from app.models.user import User
from app.services.auth_service import hash_password
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

router = APIRouter(prefix="/core-hub", tags=["Core Hub"])

# Pydantic Schemas for validation

class StudentSchema(BaseModel):
    name: str
    email: str
    roll_number: str
    department: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    phone_number: Optional[str] = None

class StaffSchema(BaseModel):
    name: str
    email: str
    employee_id: str
    department: Optional[str] = None
    staff_room: Optional[str] = None
    phone_number: Optional[str] = None

class DepartmentSchema(BaseModel):
    name: str
    code: str
    hod_name: Optional[str] = None
    description: Optional[str] = None
    department_block: Optional[str] = None
    total_semesters: Optional[int] = 8
    active: Optional[int] = 1

class BuildingSchema(BaseModel):
    name: str
    code: str
    floors: int
    description: Optional[str] = None
    status: Optional[str] = "Active"

class ClassroomSchema(BaseModel):
    room_number: str
    building: str
    floor: int
    capacity: int
    room_type: Optional[str] = "THEORY"
    smart_classroom: Optional[bool] = False
    projector_available: Optional[bool] = True
    smart_board: Optional[bool] = False
    air_conditioning: Optional[bool] = False
    current_status: Optional[str] = "active"

class LabSchema(BaseModel):
    name: str
    code: str
    department_id: Optional[int] = None
    capacity: int
    room_type: Optional[str] = "LAB"
    status: Optional[str] = "Active"

class SectionSchema(BaseModel):
    department_id: int
    semester: int
    section_name: str
    student_strength: int
    permanent_room_id: Optional[int] = None

class SubjectSchema(BaseModel):
    code: str
    name: str
    credits: int
    department_id: int
    semester: int
    faculty_id: Optional[int] = None

class AcademicYearSchema(BaseModel):
    name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = False
    status: Optional[str] = "Active"

class SemesterSchema(BaseModel):
    name: str
    academic_year_id: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = "Active"

class BulkDeleteSchema(BaseModel):
    ids: List[int]

class BulkUpdateStatusSchema(BaseModel):
    ids: List[int]
    status: str

# ----------------- STATS & GLOBAL SEARCH -----------------

@router.get("/stats")
async def get_core_hub_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    dept_cnt = await db.scalar(select(func.count(Department.id)))
    bld_cnt = await db.scalar(select(func.count(Building.id)))
    room_cnt = await db.scalar(select(func.count(Classroom.id)).where(Classroom.is_lab == False))
    lab_cnt = await db.scalar(select(func.count(Classroom.id)).where(Classroom.is_lab == True))
    sec_cnt = await db.scalar(select(func.count(Section.id)))
    subj_cnt = await db.scalar(select(func.count(Subject.id)))
    ay_cnt = await db.scalar(select(func.count(AcademicYear.id)))
    sem_cnt = await db.scalar(select(func.count(Semester.id)))
    student_cnt = await db.scalar(select(func.count(User.id)).where(User.role == "student"))
    faculty_cnt = await db.scalar(select(func.count(User.id)).where(User.role.in_(["faculty", "hod"])))
    
    return {
        "departments": dept_cnt or 0,
        "buildings": bld_cnt or 0,
        "classrooms": room_cnt or 0,
        "laboratories": lab_cnt or 0,
        "sections": sec_cnt or 0,
        "subjects": subj_cnt or 0,
        "academic_years": ay_cnt or 0,
        "semesters": sem_cnt or 0,
        "students": student_cnt or 0,
        "staff": faculty_cnt or 0
    }

@router.get("/global-search")
async def global_search(
    query: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    q = f"%{query}%"
    
    depts = (await db.execute(select(Department).where(or_(Department.name.like(q), Department.code.like(q))))).scalars().all()
    buildings = (await db.execute(select(Building).where(or_(Building.name.like(q), Building.code.like(q))))).scalars().all()
    classrooms = (await db.execute(select(Classroom).where(or_(Classroom.room_number.like(q), Classroom.building.like(q))).where(Classroom.is_lab == False))).scalars().all()
    labs = (await db.execute(select(Classroom).where(or_(Classroom.room_number.like(q), Classroom.building.like(q))).where(Classroom.is_lab == True))).scalars().all()
    sections = (await db.execute(select(Section).join(Department).where(or_(Section.section_name.like(q), Department.name.like(q))))).scalars().all()
    subjects = (await db.execute(select(Subject).where(or_(Subject.name.like(q), Subject.code.like(q))))).scalars().all()
    
    results = []
    
    for d in depts:
        results.append({"type": "Department", "name": f"{d.name} ({d.code})", "link": f"/admin/core-hub?tab=departments&search={d.code}"})
    for b in buildings:
        results.append({"type": "Building", "name": f"{b.name} ({b.code})", "link": f"/admin/core-hub?tab=buildings&search={b.code}"})
    for c in classrooms:
        results.append({"type": "Classroom", "name": f"Room {c.room_number} - {c.building}", "link": f"/admin/core-hub?tab=classrooms&search={c.room_number}"})
    for l in labs:
        results.append({"type": "Laboratory", "name": f"Lab {l.room_number} - {l.building}", "link": f"/admin/core-hub?tab=laboratories&search={l.room_number}"})
    for s in sections:
        results.append({"type": "Section", "name": f"Section {s.section_name} - Sem {s.semester}", "link": f"/admin/core-hub?tab=sections&search={s.section_name}"})
    for sb in subjects:
        results.append({"type": "Subject", "name": f"{sb.name} ({sb.code})", "link": f"/admin/core-hub?tab=subjects&search={sb.code}"})
        
    return results

# ----------------- DEPARTMENTS -----------------

@router.get("/departments")
async def get_departments(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Department))
    depts = res.scalars().all()
    
    user_counts = await db.execute(
        select(
            User.department,
            User.role,
            func.count(User.id)
        ).where(
            User.department.isnot(None),
            User.role.in_(["student", "faculty", "hod"])
        ).group_by(
            User.department,
            User.role
        )
    )
    
    # Build a lookup map: dept_code_upper -> {role: count}
    counts_map = {}
    for dept_val, role, count in user_counts.all():
        if dept_val:
            key = dept_val.strip().upper()
            if key not in counts_map:
                counts_map[key] = {}
            counts_map[key][role] = count

    results = []
    for d in depts:
        code_key = d.code.strip().upper() if d.code else ""
        stats = counts_map.get(code_key, {})
        results.append({
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "hod_name": d.hod_name,
            "description": d.description,
            "department_block": d.department_block,
            "total_semesters": d.total_semesters,
            "active": d.active,
            "total_students": stats.get("student", 0),
            "total_faculty": stats.get("faculty", 0) + stats.get("hod", 0)
        })
        
    return results

@router.post("/departments")
async def create_department(
    data: DepartmentSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    # Check duplicate
    dup = await db.execute(select(Department).where(Department.code == data.code.upper()))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Department code already exists.")
    
    dept = Department(
        name=data.name,
        code=data.code.upper(),
        hod_name=data.hod_name,
        description=data.description,
        department_block=data.department_block,
        total_semesters=data.total_semesters,
        active=data.active
    )
    db.add(dept)
    await db.commit()
    return dept

@router.put("/departments/{id}")
async def update_department(
    id: int,
    data: DepartmentSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    dept = await db.get(Department, id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
    
    dept.name = data.name
    dept.code = data.code.upper()
    dept.hod_name = data.hod_name
    dept.description = data.description
    dept.department_block = data.department_block
    dept.total_semesters = data.total_semesters
    dept.active = data.active
    
    await db.commit()
    return dept

@router.delete("/departments/{id}")
async def delete_department(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    dept = await db.get(Department, id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
    await db.delete(dept)
    await db.commit()
    return {"message": "Deleted successfully."}

@router.post("/departments/bulk-delete")
async def bulk_delete_departments(
    data: BulkDeleteSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    await db.execute(delete(Department).where(Department.id.in_(data.ids)))
    await db.commit()
    return {"message": "Bulk deleted successfully."}

@router.post("/departments/bulk-update")
async def bulk_update_departments(
    data: BulkUpdateStatusSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    active_val = 1 if data.status.lower() == "active" else 0
    await db.execute(update(Department).where(Department.id.in_(data.ids)).values(active=active_val))
    await db.commit()
    return {"message": "Bulk updated successfully."}

# ----------------- BUILDINGS -----------------

@router.get("/buildings")
async def get_buildings(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Building))
    return res.scalars().all()

@router.post("/buildings")
async def create_building(
    data: BuildingSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    dup = await db.execute(select(Building).where(Building.code == data.code.upper()))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Building code already exists.")
    
    bld = Building(
        name=data.name,
        code=data.code.upper(),
        floors=data.floors,
        description=data.description,
        status=data.status
    )
    db.add(bld)
    await db.commit()
    return bld

@router.put("/buildings/{id}")
async def update_building(
    id: int,
    data: BuildingSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    bld = await db.get(Building, id)
    if not bld:
        raise HTTPException(status_code=404, detail="Building not found.")
    
    bld.name = data.name
    bld.code = data.code.upper()
    bld.floors = data.floors
    bld.description = data.description
    bld.status = data.status
    
    await db.commit()
    return bld

@router.delete("/buildings/{id}")
async def delete_building(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    bld = await db.get(Building, id)
    if not bld:
        raise HTTPException(status_code=404, detail="Building not found.")
    await db.delete(bld)
    await db.commit()
    return {"message": "Deleted successfully."}

@router.post("/buildings/bulk-delete")
async def bulk_delete_buildings(
    data: BulkDeleteSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    await db.execute(delete(Building).where(Building.id.in_(data.ids)))
    await db.commit()
    return {"message": "Bulk deleted successfully."}

@router.post("/buildings/bulk-update")
async def bulk_update_buildings(
    data: BulkUpdateStatusSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    await db.execute(update(Building).where(Building.id.in_(data.ids)).values(status=data.status))
    await db.commit()
    return {"message": "Bulk updated successfully."}

# ----------------- CLASSROOMS -----------------

@router.get("/classrooms")
async def get_classrooms(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Classroom).where(Classroom.is_lab == False))
    return res.scalars().all()

@router.post("/classrooms")
async def create_classroom(
    data: ClassroomSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    dup = await db.execute(select(Classroom).where(Classroom.room_number == data.room_number))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Room number already exists.")
    
    c = Classroom(
        room_number=data.room_number,
        building=data.building,
        floor=data.floor,
        capacity=data.capacity,
        is_lab=False,
        room_type="THEORY",
        smart_classroom=data.smart_classroom,
        has_projector=data.projector_available,
        has_smartboard=data.smart_board,
        has_ac=data.air_conditioning,
        maintenance_status=data.current_status,
        active=True if data.current_status == "active" else False
    )
    db.add(c)
    await db.commit()
    return c

@router.put("/classrooms/{id}")
async def update_classroom(
    id: int,
    data: ClassroomSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    c = await db.get(Classroom, id)
    if not c:
        raise HTTPException(status_code=404, detail="Classroom not found.")
    
    c.room_number = data.room_number
    c.building = data.building
    c.floor = data.floor
    c.capacity = data.capacity
    c.smart_classroom = data.smart_classroom
    c.has_projector = data.projector_available
    c.has_smartboard = data.smart_board
    c.has_ac = data.air_conditioning
    c.maintenance_status = data.current_status
    c.active = True if data.current_status == "active" else False
    
    await db.commit()
    return c

@router.delete("/classrooms/{id}")
async def delete_classroom(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    c = await db.get(Classroom, id)
    if not c:
        raise HTTPException(status_code=404, detail="Classroom not found.")
    await db.delete(c)
    await db.commit()
    return {"message": "Deleted successfully."}

@router.post("/classrooms/bulk-delete")
async def bulk_delete_classrooms(
    data: BulkDeleteSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    await db.execute(delete(Classroom).where(Classroom.id.in_(data.ids)))
    await db.commit()
    return {"message": "Bulk deleted successfully."}

@router.post("/classrooms/bulk-update")
async def bulk_update_classrooms(
    data: BulkUpdateStatusSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    act_val = True if data.status.lower() == "active" else False
    await db.execute(update(Classroom).where(Classroom.id.in_(data.ids)).values(maintenance_status=data.status, active=act_val))
    await db.commit()
    return {"message": "Bulk updated successfully."}

# ----------------- LABORATORIES -----------------

@router.get("/laboratories")
async def get_laboratories(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Classroom).where(Classroom.is_lab == True))
    return res.scalars().all()

@router.post("/laboratories")
async def create_laboratory(
    data: LabSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    dup = await db.execute(select(Classroom).where(Classroom.room_number == data.code))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Laboratory/Room code already exists.")
    
    dept_obj = None
    if data.department_id:
        dept_obj = await db.get(Department, data.department_id)
        
    c = Classroom(
        room_number=data.code,
        building="Campus Block",
        floor=1,
        capacity=data.capacity,
        is_lab=True,
        room_type="LAB",
        department_block=dept_obj.code if dept_obj else None,
        maintenance_status="active" if data.status.lower() == "active" else "inactive",
        active=True if data.status.lower() == "active" else False
    )
    db.add(c)
    await db.commit()
    return c

@router.put("/laboratories/{id}")
async def update_laboratory(
    id: int,
    data: LabSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    c = await db.get(Classroom, id)
    if not c or not c.is_lab:
        raise HTTPException(status_code=404, detail="Laboratory not found.")
    
    dept_obj = None
    if data.department_id:
        dept_obj = await db.get(Department, data.department_id)
        
    c.room_number = data.code
    c.capacity = data.capacity
    c.department_block = dept_obj.code if dept_obj else c.department_block
    c.maintenance_status = "active" if data.status.lower() == "active" else "inactive"
    c.active = True if data.status.lower() == "active" else False
    
    await db.commit()
    return c

@router.delete("/laboratories/{id}")
async def delete_laboratory(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    c = await db.get(Classroom, id)
    if not c or not c.is_lab:
        raise HTTPException(status_code=404, detail="Laboratory not found.")
    await db.delete(c)
    await db.commit()
    return {"message": "Deleted successfully."}

@router.post("/laboratories/bulk-delete")
async def bulk_delete_laboratories(
    data: BulkDeleteSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    await db.execute(delete(Classroom).where(Classroom.id.in_(data.ids)).where(Classroom.is_lab == True))
    await db.commit()
    return {"message": "Bulk deleted successfully."}

@router.post("/laboratories/bulk-update")
async def bulk_update_laboratories(
    data: BulkUpdateStatusSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    act_val = True if data.status.lower() == "active" else False
    await db.execute(update(Classroom).where(Classroom.id.in_(data.ids)).where(Classroom.is_lab == True).values(
        maintenance_status="active" if act_val else "inactive",
        active=act_val
    ))
    await db.commit()
    return {"message": "Bulk updated successfully."}

# ----------------- SECTIONS -----------------

@router.get("/sections")
async def get_sections(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Section))
    return res.scalars().all()

@router.post("/sections")
async def create_section(
    data: SectionSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    dup = await db.execute(select(Section).where(
        Section.department_id == data.department_id,
        Section.semester == data.semester,
        Section.section_name == data.section_name.upper()
    ))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Section already exists in this department/semester.")
    
    sec = Section(
        department_id=data.department_id,
        semester=data.semester,
        section_name=data.section_name.upper(),
        student_strength=data.student_strength,
        permanent_room_id=data.permanent_room_id
    )
    db.add(sec)
    await db.commit()
    return sec

@router.put("/sections/{id}")
async def update_section(
    id: int,
    data: SectionSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    sec = await db.get(Section, id)
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found.")
    
    sec.department_id = data.department_id
    sec.semester = data.semester
    sec.section_name = data.section_name.upper()
    sec.student_strength = data.student_strength
    sec.permanent_room_id = data.permanent_room_id
    
    await db.commit()
    return sec

@router.delete("/sections/{id}")
async def delete_section(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    sec = await db.get(Section, id)
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found.")
    await db.delete(sec)
    await db.commit()
    return {"message": "Deleted successfully."}

@router.post("/sections/bulk-delete")
async def bulk_delete_sections(
    data: BulkDeleteSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    await db.execute(delete(Section).where(Section.id.in_(data.ids)))
    await db.commit()
    return {"message": "Bulk deleted successfully."}

@router.post("/sections/bulk-update")
async def bulk_update_sections(
    data: BulkUpdateStatusSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    # Standard status column doesn't exist, we can treat this as a no-op or info log
    return {"message": "Status bulk-update is a placeholder for sections."}

# ----------------- SUBJECTS -----------------

@router.get("/subjects")
async def get_subjects(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Subject))
    return res.scalars().all()

@router.post("/subjects")
async def create_subject(
    data: SubjectSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    dup = await db.execute(select(Subject).where(Subject.code == data.code.upper()))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Subject code already exists.")
    
    # We must first resolve or create Course mapping
    course_obj = Course(
        code=data.code.upper(),
        name=data.name,
        department_id=data.department_id,
        semester=data.semester,
        credits=data.credits
    )
    db.add(course_obj)
    await db.flush()

    subj = Subject(
        name=data.name,
        code=data.code.upper(),
        course_id=course_obj.id,
        faculty_id=data.faculty_id,
        semester=data.semester
    )
    db.add(subj)
    await db.commit()
    return subj

@router.put("/subjects/{id}")
async def update_subject(
    id: int,
    data: SubjectSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    subj = await db.get(Subject, id)
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found.")
    
    subj.name = data.name
    subj.code = data.code.upper()
    subj.faculty_id = data.faculty_id
    subj.semester = data.semester

    course_obj = await db.get(Course, subj.course_id)
    if course_obj:
        course_obj.name = data.name
        course_obj.code = data.code.upper()
        course_obj.department_id = data.department_id
        course_obj.semester = data.semester
        course_obj.credits = data.credits
        db.add(course_obj)
        
    await db.commit()
    return subj

@router.delete("/subjects/{id}")
async def delete_subject(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    subj = await db.get(Subject, id)
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found.")
    
    course_obj = await db.get(Course, subj.course_id)
    if course_obj:
        await db.delete(course_obj)
        
    await db.delete(subj)
    await db.commit()
    return {"message": "Deleted successfully."}

@router.post("/subjects/bulk-delete")
async def bulk_delete_subjects(
    data: BulkDeleteSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    subjs_res = await db.execute(select(Subject).where(Subject.id.in_(data.ids)))
    subjs = subjs_res.scalars().all()
    course_ids = [s.course_id for s in subjs if s.course_id]
    
    if course_ids:
        await db.execute(delete(Course).where(Course.id.in_(course_ids)))
    await db.execute(delete(Subject).where(Subject.id.in_(data.ids)))
    await db.commit()
    return {"message": "Bulk deleted successfully."}

@router.post("/subjects/bulk-update")
async def bulk_update_subjects(
    data: BulkUpdateStatusSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    return {"message": "Status bulk-update is a placeholder for subjects."}

# ----------------- ACADEMIC YEARS -----------------

@router.get("/academic-years")
async def get_academic_years(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AcademicYear))
    return res.scalars().all()

@router.post("/academic-years")
async def create_academic_year(
    data: AcademicYearSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    dup = await db.execute(select(AcademicYear).where(AcademicYear.name == data.name))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Academic year name already exists.")
    
    ay = AcademicYear(
        name=data.name,
        start_date=data.start_date,
        end_date=data.end_date,
        is_current=data.is_current,
        status=data.status
    )
    db.add(ay)
    await db.commit()
    return ay

@router.put("/academic-years/{id}")
async def update_academic_year(
    id: int,
    data: AcademicYearSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    ay = await db.get(AcademicYear, id)
    if not ay:
        raise HTTPException(status_code=404, detail="Academic Year not found.")
    
    ay.name = data.name
    ay.start_date = data.start_date
    ay.end_date = data.end_date
    ay.is_current = data.is_current
    ay.status = data.status
    
    await db.commit()
    return ay

@router.delete("/academic-years/{id}")
async def delete_academic_year(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    ay = await db.get(AcademicYear, id)
    if not ay:
        raise HTTPException(status_code=404, detail="Academic Year not found.")
    await db.delete(ay)
    await db.commit()
    return {"message": "Deleted successfully."}

@router.post("/academic-years/bulk-delete")
async def bulk_delete_academic_years(
    data: BulkDeleteSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    await db.execute(delete(AcademicYear).where(AcademicYear.id.in_(data.ids)))
    await db.commit()
    return {"message": "Bulk deleted successfully."}

@router.post("/academic-years/bulk-update")
async def bulk_update_academic_years(
    data: BulkUpdateStatusSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    await db.execute(update(AcademicYear).where(AcademicYear.id.in_(data.ids)).values(status=data.status))
    await db.commit()
    return {"message": "Bulk updated successfully."}

# ----------------- SEMESTERS -----------------

@router.get("/semesters")
async def get_semesters(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Semester))
    return res.scalars().all()

@router.post("/semesters")
async def create_semester(
    data: SemesterSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    ay = await db.get(AcademicYear, data.academic_year_id)
    if not ay:
        raise HTTPException(status_code=404, detail="Linked Academic Year not found.")
        
    sem = Semester(
        name=data.name,
        academic_year_id=data.academic_year_id,
        start_date=data.start_date,
        end_date=data.end_date,
        status=data.status
    )
    db.add(sem)
    await db.commit()
    return sem

@router.put("/semesters/{id}")
async def update_semester(
    id: int,
    data: SemesterSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    sem = await db.get(Semester, id)
    if not sem:
        raise HTTPException(status_code=404, detail="Semester not found.")
        
    ay = await db.get(AcademicYear, data.academic_year_id)
    if not ay:
        raise HTTPException(status_code=404, detail="Linked Academic Year not found.")
        
    sem.name = data.name
    sem.academic_year_id = data.academic_year_id
    sem.start_date = data.start_date
    sem.end_date = data.end_date
    sem.status = data.status
    
    await db.commit()
    return sem

@router.delete("/semesters/{id}")
async def delete_semester(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    sem = await db.get(Semester, id)
    if not sem:
        raise HTTPException(status_code=404, detail="Semester not found.")
    await db.delete(sem)
    await db.commit()
    return {"message": "Deleted successfully."}

@router.post("/semesters/bulk-delete")
async def bulk_delete_semesters(
    data: BulkDeleteSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    await db.execute(delete(Semester).where(Semester.id.in_(data.ids)))
    await db.commit()
    return {"message": "Bulk deleted successfully."}

@router.post("/semesters/bulk-update")
async def bulk_update_semesters(
    data: BulkUpdateStatusSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    await db.execute(update(Semester).where(Semester.id.in_(data.ids)).values(status=data.status))
    await db.commit()
    return {"message": "Bulk updated successfully."}


# ----------------- STUDENTS -----------------

@router.get("/students")
async def get_students(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.role == "student"))
    return res.scalars().all()

@router.post("/students")
async def create_student(
    data: StudentSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    # Check duplicate email or roll number
    dup = await db.execute(
        select(User).where(
            or_(User.email == data.email.lower(), User.roll_number == data.roll_number.upper())
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Student with this email or roll number already exists.")
        
    student = User(
        name=data.name,
        email=data.email.lower(),
        roll_number=data.roll_number.upper(),
        password=hash_password("password123"), # Default password
        role="student",
        department=data.department,
        semester=data.semester,
        section=data.section,
        phone_number=data.phone_number,
        is_first_login=True
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student

@router.put("/students/{id}")
async def update_student(
    id: int,
    data: StudentSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    student = await db.get(User, id)
    if not student or student.role != "student":
        raise HTTPException(status_code=404, detail="Student not found.")
        
    # Check duplicates ignoring current id
    dup = await db.execute(
        select(User).where(
            (User.id != id) &
            (or_(User.email == data.email.lower(), User.roll_number == data.roll_number.upper()))
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Another student with this email or roll number already exists.")
        
    student.name = data.name
    student.email = data.email.lower()
    student.roll_number = data.roll_number.upper()
    student.department = data.department
    student.semester = data.semester
    student.section = data.section
    student.phone_number = data.phone_number
    
    await db.commit()
    return student

@router.delete("/students/{id}")
async def delete_student(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    student = await db.get(User, id)
    if not student or student.role != "student":
        raise HTTPException(status_code=404, detail="Student not found.")
    await db.delete(student)
    await db.commit()
    return {"message": "Deleted successfully."}

@router.post("/students/bulk-delete")
async def bulk_delete_students(
    data: BulkDeleteSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    await db.execute(delete(User).where((User.id.in_(data.ids)) & (User.role == "student")))
    await db.commit()
    return {"message": "Bulk deleted successfully."}


# ----------------- STAFF -----------------

@router.get("/staff")
async def get_staff(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.role.in_(["faculty", "hod"])))
    return res.scalars().all()

@router.post("/staff")
async def create_staff(
    data: StaffSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    # Check duplicate email or employee id
    dup = await db.execute(
        select(User).where(
            or_(User.email == data.email.lower(), User.employee_id == data.employee_id.upper())
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Staff with this email or employee ID already exists.")
        
    staff = User(
        name=data.name,
        email=data.email.lower(),
        employee_id=data.employee_id.upper(),
        password=hash_password("password123"), # Default password
        role="faculty",
        department=data.department,
        staff_room=data.staff_room,
        phone_number=data.phone_number,
        is_first_login=True
    )
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    return staff

@router.put("/staff/{id}")
async def update_staff(
    id: int,
    data: StaffSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    staff = await db.get(User, id)
    if not staff or staff.role not in ["faculty", "hod"]:
        raise HTTPException(status_code=404, detail="Staff not found.")
        
    # Check duplicates ignoring current id
    dup = await db.execute(
        select(User).where(
            (User.id != id) &
            (or_(User.email == data.email.lower(), User.employee_id == data.employee_id.upper()))
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Another staff with this email or employee ID already exists.")
        
    staff.name = data.name
    staff.email = data.email.lower()
    staff.employee_id = data.employee_id.upper()
    staff.department = data.department
    staff.staff_room = data.staff_room
    staff.phone_number = data.phone_number
    
    await db.commit()
    return staff

@router.delete("/staff/{id}")
async def delete_staff(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    staff = await db.get(User, id)
    if not staff or staff.role not in ["faculty", "hod"]:
        raise HTTPException(status_code=404, detail="Staff not found.")
    await db.delete(staff)
    await db.commit()
    return {"message": "Deleted successfully."}

@router.post("/staff/bulk-delete")
async def bulk_delete_staff(
    data: BulkDeleteSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    await db.execute(delete(User).where((User.id.in_(data.ids)) & (User.role.in_(["faculty", "hod"]))))
    await db.commit()
    return {"message": "Bulk deleted successfully."}
