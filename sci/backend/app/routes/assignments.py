from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, or_, and_, case
from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List
from app.database import get_db
from app.models.assignment import Assignment, Submission
from app.models.user import User
from app.models.department import Subject, Department
from app.middleware.auth_middleware import get_current_user
from app.middleware.role_checker import require_role

router = APIRouter(prefix="/assignments", tags=["Assignments"])


# ─── Pydantic Request Models ──────────────────────────────────────────────────


class CreateAssignmentRequest(BaseModel):
    title: str
    description: Optional[str] = None
    subject: str
    due_date: date
    due_time: Optional[str] = "23:59"
    max_marks: Optional[int] = 100
    status: Optional[str] = "PUBLISHED"  # "DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"
    department: Optional[str] = None
    year: Optional[str] = "II"  # "I", "II", "III", "IV"
    class_name: Optional[str] = None
    section: Optional[str] = "A"
    attachments: Optional[str] = None


class UpdateAssignmentRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    due_date: Optional[date] = None
    due_time: Optional[str] = None
    max_marks: Optional[int] = None
    status: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    class_name: Optional[str] = None
    section: Optional[str] = None
    attachments: Optional[str] = None


class SubmitAssignmentRequest(BaseModel):
    file_url: Optional[str] = None
    github_link: Optional[str] = None
    drive_link: Optional[str] = None


class GradeSubmissionRequest(BaseModel):
    grade: str
    remarks: Optional[str] = None


class GenerateAssignmentAIRequest(BaseModel):
    subject: str
    unit: str
    difficulty: Optional[str] = "Medium"
    num_questions: Optional[int] = 5


class AIQuestionItem(BaseModel):
    question_number: int
    question_text: str
    max_marks: int


class AICriteriaItem(BaseModel):
    criteria: str
    description: str
    points: int


class AIAssignmentResponse(BaseModel):
    title: str = Field(description="A descriptive title for the assignment")
    description: str = Field(description="A brief description of what this assignment evaluates")
    questions: List[AIQuestionItem]
    rubric: List[AICriteriaItem]


# ─── Helper Functions ─────────────────────────────────────────────────────────


def sem_to_year(sem: int) -> str:
    if sem in (1, 2):
        return "I"
    elif sem in (3, 4):
        return "II"
    elif sem in (5, 6):
        return "III"
    elif sem in (7, 8):
        return "IV"
    return "I"


# ─── Core List & Metadata Endpoints ──────────────────────────────────────────


@router.get("/faculty-meta")
async def get_faculty_assignment_meta(
    current_user: dict = Depends(require_role("faculty", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    faculty_id = current_user["id"]
    is_admin = current_user.get("role") in ("admin", "hod")

    # 1. Fetch authorized teaching subjects
    if is_admin:
        sub_res = await db.execute(select(Subject).order_by(Subject.name))
        subjects_list = sub_res.scalars().all()
    else:
        sub_res = await db.execute(
            select(Subject).where(Subject.faculty_id == faculty_id).order_by(Subject.name)
        )
        subjects_list = sub_res.scalars().all()
        # Fall back to department subjects if faculty has no specific link
        if not subjects_list and current_user.get("department"):
            dept_name = current_user.get("department")
            fallback_res = await db.execute(select(Subject).order_by(Subject.name))
            subjects_list = fallback_res.scalars().all()

    # 2. Target Classes & Sections
    dept_res = await db.execute(select(Department.code).order_by(Department.code))
    departments = [d[0] for d in dept_res.all()]
    if not departments:
        departments = ["CSE", "ECE", "MECH", "CIVIL", "IT"]

    years = ["I", "II", "III", "IV"]
    sections = ["A", "B", "C", "All"]

    # 3. Compute real Statistics for this Faculty
    if is_admin:
        assign_query = select(Assignment)
    else:
        assign_query = select(Assignment).where(Assignment.faculty_id == faculty_id)

    res_assignments = await db.execute(assign_query)
    faculty_assignments = res_assignments.scalars().all()
    total_assignments = len(faculty_assignments)
    active_assignments = sum(
        1 for a in faculty_assignments if a.status == "PUBLISHED" and a.due_date >= date.today()
    )
    draft_assignments = sum(1 for a in faculty_assignments if a.status == "DRAFT")

    # Submissions across faculty's assignments
    assignment_ids = [a.id for a in faculty_assignments]
    total_submissions = 0
    pending_reviews = 0
    graded_submissions = 0

    if assignment_ids:
        subm_res = await db.execute(
            select(Submission).where(Submission.assignment_id.in_(assignment_ids))
        )
        all_subs = subm_res.scalars().all()
        total_submissions = len(all_subs)
        graded_submissions = sum(1 for s in all_subs if s.status == "graded")
        pending_reviews = total_submissions - graded_submissions

    return {
        "subjects": [
            {
                "id": s.id,
                "name": s.name,
                "code": s.code,
                "semester": s.semester,
                "year": sem_to_year(s.semester),
            }
            for s in subjects_list
        ],
        "departments": departments,
        "years": years,
        "sections": sections,
        "stats": {
            "total_assignments": total_assignments,
            "active_assignments": active_assignments,
            "draft_assignments": draft_assignments,
            "total_submissions": total_submissions,
            "pending_reviews": pending_reviews,
            "graded_submissions": graded_submissions,
        },
    }


@router.get("")
@router.get("/")
async def get_assignments(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    role = current_user.get("role", "").lower()

    if role in ("faculty", "admin", "hod"):
        # Faculty / Admin view: assignments created by this faculty (or all for admin)
        if role == "admin":
            query = select(Assignment).order_by(Assignment.created_at.desc())
        else:
            query = (
                select(Assignment)
                .where(Assignment.faculty_id == current_user["id"])
                .order_by(Assignment.created_at.desc())
            )
        result = await db.execute(query)
        assignments = result.scalars().all()

        if not assignments:
            return []

        assign_ids = [a.id for a in assignments]

        # Aggregate submission metrics per assignment
        subs_res = await db.execute(
            select(
                Submission.assignment_id,
                func.count(Submission.id).label("total_subs"),
                func.sum(case((Submission.status == "graded", 1), else_=0)).label("graded_subs"),
            )
            .where(Submission.assignment_id.in_(assign_ids))
            .group_by(Submission.assignment_id)
        )
        subs_map = {row[0]: {"total": row[1], "graded": row[2] or 0} for row in subs_res.all()}

        # Student target counts per class
        student_counts_res = await db.execute(
            select(User.department, User.semester, User.section, func.count(User.id))
            .where(User.role == "student")
            .group_by(User.department, User.semester, User.section)
        )
        student_counts = {}
        for dept, sem, sec, count in student_counts_res.all():
            yr = sem_to_year(sem or 1)
            key = (dept, yr, sec)
            student_counts[key] = student_counts.get(key, 0) + count

        faculty_list = []
        for a in assignments:
            m = subs_map.get(a.id, {"total": 0, "graded": 0})
            total_subs = m["total"]
            graded_subs = m["graded"]
            pending_subs = total_subs - graded_subs

            # Target students estimate
            target_key = (a.department, a.year, a.section)
            target_count = student_counts.get(target_key, 0)
            if target_count == 0 and a.department and a.year:
                # Fallback to all sections for that department and year
                target_count = sum(
                    cnt for (d, y, s), cnt in student_counts.items()
                    if d == a.department and y == a.year
                )

            faculty_list.append({
                "id": a.id,
                "title": a.title,
                "description": a.description,
                "subject": a.subject,
                "due_date": str(a.due_date),
                "due_time": a.due_time or "23:59",
                "max_marks": a.max_marks or 100,
                "status": a.status or "PUBLISHED",
                "department": a.department,
                "year": a.year,
                "class_name": a.class_name,
                "section": a.section,
                "attachments": a.attachments,
                "created_at": str(a.created_at) if a.created_at else None,
                "submission_count": total_subs,
                "graded_count": graded_subs,
                "pending_count": pending_subs,
                "target_count": target_count or total_subs or 0,
            })

        return faculty_list

    else:
        # Student view: ONLY PUBLISHED assignments assigned to their class/section
        sem = current_user.get("semester", 1)
        student_year = sem_to_year(sem)
        dept = current_user.get("department")
        sect = current_user.get("section", "A")

        query = (
            select(Assignment)
            .where(
                Assignment.status == "PUBLISHED",
                or_(Assignment.department == dept, Assignment.department.is_(None)),
                or_(Assignment.year == student_year, Assignment.year.is_(None)),
                or_(Assignment.section == sect, Assignment.section == "All", Assignment.section.is_(None)),
            )
            .order_by(Assignment.due_date.asc())
        )
        result = await db.execute(query)
        assignments = result.scalars().all()

        assignment_list = []
        for a in assignments:
            # Check student's submission
            sub_result = await db.execute(
                select(Submission).where(
                    Submission.assignment_id == a.id,
                    Submission.student_id == current_user["id"],
                )
            )
            submission = sub_result.scalar_one_or_none()

            assignment_list.append({
                "id": a.id,
                "title": a.title,
                "description": a.description,
                "subject": a.subject,
                "due_date": str(a.due_date),
                "due_time": a.due_time or "23:59",
                "max_marks": a.max_marks or 100,
                "department": a.department,
                "year": a.year,
                "class_name": a.class_name,
                "section": a.section,
                "attachments": a.attachments,
                "created_at": str(a.created_at) if a.created_at else None,
                "submitted": submission is not None,
                "submission_id": submission.id if submission else None,
                "submission_status": submission.status if submission else None,
                "status": submission.status if submission else "pending",
                "grade": submission.grade if submission else None,
                "score": submission.grade if submission else None,
                "remarks": submission.remarks if submission else None,
                "file_url": submission.file_url if submission else None,
                "submitted_at": str(submission.submitted_at) if submission and submission.submitted_at else None,
            })

        return assignment_list


# ─── Assignment Creation & Publishing ─────────────────────────────────────────


@router.post("")
@router.post("/")
async def create_assignment(
    req: CreateAssignmentRequest,
    current_user: dict = Depends(require_role("faculty", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    if not req.title.strip() or not req.subject.strip():
        raise HTTPException(status_code=400, detail="Assignment title and subject are required")

    dept = req.department or current_user.get("department") or "CSE"
    year = req.year or "II"
    section = req.section or "A"
    class_name = req.class_name or f"{dept} Year-{year} Sec-{section}"
    assignment_status = (req.status or "PUBLISHED").upper()

    new_assignment = Assignment(
        title=req.title.strip(),
        description=req.description,
        subject=req.subject.strip(),
        faculty_id=current_user["id"],
        due_date=req.due_date,
        due_time=req.due_time or "23:59",
        max_marks=req.max_marks or 100,
        status=assignment_status,
        department=dept,
        year=year,
        class_name=class_name,
        section=section,
        attachments=req.attachments,
    )
    db.add(new_assignment)
    await db.flush()
    await db.refresh(new_assignment)

    from app.services.audit_service import log_audit_event
    await log_audit_event(
        db,
        user_id=current_user["id"],
        user_email=current_user["email"],
        role=current_user["role"],
        action="CREATE_ASSIGNMENT",
        resource=f"Assignment:{new_assignment.id}",
        details=f"Created '{new_assignment.title}' for {dept} Year {year} Sec {section} ({assignment_status})"
    )

    return {
        "id": new_assignment.id,
        "title": new_assignment.title,
        "description": new_assignment.description,
        "subject": new_assignment.subject,
        "due_date": str(new_assignment.due_date),
        "due_time": new_assignment.due_time,
        "max_marks": new_assignment.max_marks,
        "status": new_assignment.status,
        "department": new_assignment.department,
        "year": new_assignment.year,
        "section": new_assignment.section,
        "message": f"Assignment '{new_assignment.title}' {'published' if assignment_status == 'PUBLISHED' else 'saved as draft'} successfully",
    }


# ─── Submission Review & Grading Endpoints (Must be before /{assignment_id}) ─


@router.put("/submissions/{submission_id}/grade")
@router.patch("/submissions/{submission_id}/grade")
async def grade_submission(
    submission_id: int,
    req: GradeSubmissionRequest,
    current_user: dict = Depends(require_role("faculty", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Submission, Assignment)
        .join(Assignment, Submission.assignment_id == Assignment.id)
        .where(Submission.id == submission_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission record not found",
        )

    sub, assign = row

    # Authorization: only the faculty who created the assignment or admin/hod can grade
    if current_user.get("role") == "faculty" and assign.faculty_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to grade submissions for another faculty's assignment",
        )

    sub.grade = req.grade.strip()
    sub.remarks = req.remarks.strip() if req.remarks else None
    sub.status = "graded"

    await db.flush()

    from app.services.audit_service import log_audit_event
    await log_audit_event(
        db,
        user_id=current_user["id"],
        user_email=current_user["email"],
        role=current_user["role"],
        action="GRADE_ASSIGNMENT_SUBMISSION",
        resource=f"Submission:{submission_id}",
        details=f"Graded submission #{submission_id} with '{req.grade}' on assignment '{assign.title}'"
    )

    return {"message": "Submission evaluated and marks recorded successfully", "grade": sub.grade}


# ─── Dynamic Assignment Operations ───────────────────────────────────────────


@router.get("/{assignment_id}")
async def get_assignment_details(
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # If student, ensure it is published
    if current_user.get("role") == "student" and assignment.status != "PUBLISHED":
        raise HTTPException(status_code=403, detail="Assignment is not published")

    return {
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "subject": assignment.subject,
        "due_date": str(assignment.due_date),
        "due_time": assignment.due_time or "23:59",
        "max_marks": assignment.max_marks or 100,
        "status": assignment.status or "PUBLISHED",
        "department": assignment.department,
        "year": assignment.year,
        "class_name": assignment.class_name,
        "section": assignment.section,
        "attachments": assignment.attachments,
        "created_at": str(assignment.created_at) if assignment.created_at else None,
    }


@router.put("/{assignment_id}")
async def update_assignment(
    assignment_id: int,
    req: UpdateAssignmentRequest,
    current_user: dict = Depends(require_role("faculty", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if current_user.get("role") == "faculty" and assignment.faculty_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only modify your own assignments")

    if req.title is not None:
        assignment.title = req.title.strip()
    if req.description is not None:
        assignment.description = req.description
    if req.subject is not None:
        assignment.subject = req.subject.strip()
    if req.due_date is not None:
        assignment.due_date = req.due_date
    if req.due_time is not None:
        assignment.due_time = req.due_time
    if req.max_marks is not None:
        assignment.max_marks = req.max_marks
    if req.status is not None:
        assignment.status = req.status.upper()
    if req.department is not None:
        assignment.department = req.department
    if req.year is not None:
        assignment.year = req.year
    if req.class_name is not None:
        assignment.class_name = req.class_name
    if req.section is not None:
        assignment.section = req.section
    if req.attachments is not None:
        assignment.attachments = req.attachments

    await db.flush()

    return {"message": "Assignment updated successfully", "id": assignment.id}


@router.post("/{assignment_id}/publish")
async def publish_assignment(
    assignment_id: int,
    current_user: dict = Depends(require_role("faculty", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if current_user.get("role") == "faculty" and assignment.faculty_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only publish your own assignments")

    assignment.status = "PUBLISHED"
    await db.flush()

    from app.services.audit_service import log_audit_event
    await log_audit_event(
        db,
        user_id=current_user["id"],
        user_email=current_user["email"],
        role=current_user["role"],
        action="PUBLISH_ASSIGNMENT",
        resource=f"Assignment:{assignment_id}",
        details=f"Published assignment '{assignment.title}' to {assignment.department} {assignment.year} {assignment.section}"
    )

    return {"message": "Assignment published to students successfully"}


@router.post("/{assignment_id}/close")
async def close_assignment(
    assignment_id: int,
    current_user: dict = Depends(require_role("faculty", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if current_user.get("role") == "faculty" and assignment.faculty_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only close your own assignments")

    assignment.status = "CLOSED"
    await db.flush()

    return {"message": "Assignment marked as closed"}


@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: int,
    current_user: dict = Depends(require_role("faculty", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if current_user.get("role") == "faculty" and assignment.faculty_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own assignments")

    # Cascade delete associated submissions
    await db.execute(delete(Submission).where(Submission.assignment_id == assignment_id))
    await db.delete(assignment)
    await db.flush()

    from app.services.audit_service import log_audit_event
    await log_audit_event(
        db,
        user_id=current_user["id"],
        user_email=current_user["email"],
        role=current_user["role"],
        action="DELETE_ASSIGNMENT",
        resource=f"Assignment:{assignment_id}",
        details=f"Deleted assignment '{assignment.title}'"
    )

    return {"message": f"Assignment '{assignment.title}' and associated submissions deleted successfully"}


@router.get("/{assignment_id}/submissions")
async def list_assignment_submissions(
    assignment_id: int,
    current_user: dict = Depends(require_role("faculty", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    # Verify assignment exists
    a_res = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = a_res.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if current_user.get("role") == "faculty" and assignment.faculty_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only view submissions for your own assignments")

    query = (
        select(Submission, User)
        .join(User, Submission.student_id == User.id)
        .where(Submission.assignment_id == assignment_id)
        .order_by(Submission.submitted_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "id": sub.id,
            "assignment_id": sub.assignment_id,
            "submitted_at": str(sub.submitted_at) if sub.submitted_at else None,
            "status": sub.status,
            "grade": sub.grade,
            "remarks": sub.remarks,
            "file_url": sub.file_url,
            "github_link": sub.github_link,
            "drive_link": sub.drive_link,
            "student": {
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "roll_number": student.roll_number or f"STU-{student.id}",
                "department": student.department or "General",
                "section": student.section or "A",
            }
        }
        for sub, student in rows
    ]


@router.post("/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: int,
    req: SubmitAssignmentRequest,
    current_user: dict = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    # Check if assignment exists
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if assignment.status != "PUBLISHED":
        raise HTTPException(status_code=400, detail="Assignment is closed or not open for submissions")

    # Determine if late
    is_late = assignment.due_date and date.today() > assignment.due_date

    # Check if existing submission
    sub_res = await db.execute(
        select(Submission).where(
            Submission.assignment_id == assignment_id,
            Submission.student_id == current_user["id"],
        )
    )
    existing = sub_res.scalar_one_or_none()
    if existing:
        existing.file_url = req.file_url or existing.file_url
        existing.github_link = req.github_link or existing.github_link
        existing.drive_link = req.drive_link or existing.drive_link
        existing.submitted_at = datetime.now()
        existing.status = "late" if is_late else "submitted"
        await db.flush()
        return {"message": "Assignment submission updated successfully", "status": existing.status}

    new_submission = Submission(
        assignment_id=assignment_id,
        student_id=current_user["id"],
        status="late" if is_late else "submitted",
        file_url=req.file_url,
        github_link=req.github_link,
        drive_link=req.drive_link,
    )
    db.add(new_submission)
    await db.flush()

    return {"message": "Assignment submitted successfully", "status": new_submission.status}


@router.post("/generate-ai")
async def generate_assignment_ai(
    req: GenerateAssignmentAIRequest,
    current_user: dict = Depends(require_role("faculty", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    from app.services.gemini_service import generate_structured_content_async
    import json

    prompt = f"""Generate a high-quality academic assignment for the subject '{req.subject}', specifically focusing on '{req.unit}'.
    Difficulty level: {req.difficulty}
    Number of questions: {req.num_questions}
    
    Also, generate a clear grading rubric listing the criteria, descriptions, and points allocation.
    
    Return a structured JSON output matching the AIAssignmentResponse schema.
    """
    try:
        res_text = await generate_structured_content_async(prompt, AIAssignmentResponse)
        parsed_data = json.loads(res_text)
        return parsed_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating assignment via AI: {str(e)}"
        )
