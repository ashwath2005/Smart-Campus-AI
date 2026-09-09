from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from datetime import date
from typing import Optional, List
from app.database import get_db
from app.models.assignment import Assignment, Submission
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/assignments", tags=["Assignments"])


class CreateAssignmentRequest(BaseModel):
    title: str
    description: Optional[str] = None
    subject: str
    due_date: date
    department: Optional[str] = None
    year: Optional[str] = None
    class_name: Optional[str] = None
    section: Optional[str] = None
    attachments: Optional[str] = None


@router.get("")
@router.get("/")
async def get_assignments(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user["role"] in ("faculty", "admin", "hod"):
        # Faculty: get assignments they created
        result = await db.execute(
            select(Assignment)
            .where(Assignment.faculty_id == current_user["id"])
            .order_by(Assignment.due_date.desc())
        )
        assignments = result.scalars().all()
        return [
            {
                "id": a.id,
                "title": a.title,
                "description": a.description,
                "subject": a.subject,
                "due_date": str(a.due_date),
                "department": a.department,
                "year": a.year,
                "class_name": a.class_name,
                "section": a.section,
                "attachments": a.attachments,
                "created_at": str(a.created_at) if a.created_at else None,
            }
            for a in assignments
        ]
    else:
        # Student: get assignments assigned to their class/section
        sem = current_user.get("semester", 1)
        if sem in (1, 2):
            student_year = "I"
        elif sem in (3, 4):
            student_year = "II"
        elif sem in (5, 6):
            student_year = "III"
        elif sem in (7, 8):
            student_year = "IV"
        else:
            student_year = "I"
            
        dept = current_user.get("department")
        sect = current_user.get("section", "A")

        result = await db.execute(
            select(Assignment)
            .where(
                Assignment.department == dept,
                Assignment.year == student_year,
                Assignment.section == sect
            )
            .order_by(Assignment.due_date.desc())
        )
        assignments = result.scalars().all()

        assignment_list = []
        for a in assignments:
            # Check if student has submitted
            sub_result = await db.execute(
                select(Submission).where(
                    Submission.assignment_id == a.id,
                    Submission.student_id == current_user["id"],
                )
            )
            submission = sub_result.scalar_one_or_none()

            assignment_list.append(
                {
                    "id": a.id,
                    "title": a.title,
                    "description": a.description,
                    "subject": a.subject,
                    "due_date": str(a.due_date),
                    "department": a.department,
                    "year": a.year,
                    "class_name": a.class_name,
                    "section": a.section,
                    "attachments": a.attachments,
                    "created_at": str(a.created_at) if a.created_at else None,
                    "submitted": submission is not None,
                    "submission_status": submission.status if submission else None,
                    "status": submission.status if submission else "pending",
                    "grade": submission.grade if submission else None,
                    "score": getattr(submission, "grade", None) if submission else None,
                    "remarks": submission.remarks if submission else None,
                }
            )

        return assignment_list


@router.post("")
@router.post("/")
async def create_assignment(
    req: CreateAssignmentRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user["role"] not in ("faculty", "admin", "hod"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty can create assignments",
        )

    dept = req.department or current_user.get("department") or "CSE"
    year = req.year or "II"
    section = req.section or "A"
    class_name = req.class_name or f"{dept}-{year}-{section}"

    new_assignment = Assignment(
        title=req.title,
        description=req.description,
        subject=req.subject,
        faculty_id=current_user["id"],
        due_date=req.due_date,
        department=dept,
        year=year,
        class_name=class_name,
        section=section,
        attachments=req.attachments,
    )
    db.add(new_assignment)
    await db.flush()
    await db.commit()

    return {
        "id": new_assignment.id,
        "title": new_assignment.title,
        "description": new_assignment.description,
        "subject": new_assignment.subject,
        "due_date": str(new_assignment.due_date),
        "message": "Assignment created successfully",
    }


class SubmitAssignmentRequest(BaseModel):
    file_url: Optional[str] = None
    github_link: Optional[str] = None
    drive_link: Optional[str] = None


@router.post("/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: int,
    req: SubmitAssignmentRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check if assignment exists
    result = await db.execute(
        select(Assignment).where(Assignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    # Check if already submitted
    result = await db.execute(
        select(Submission).where(
            Submission.assignment_id == assignment_id,
            Submission.student_id == current_user["id"],
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.file_url = req.file_url or existing.file_url
        existing.github_link = req.github_link or existing.github_link
        existing.drive_link = req.drive_link or existing.drive_link
        existing.status = "submitted"
        await db.commit()
        return {"message": "Assignment submission updated successfully"}

    new_submission = Submission(
        assignment_id=assignment_id,
        student_id=current_user["id"],
        status="submitted",
        file_url=req.file_url,
        github_link=req.github_link,
        drive_link=req.drive_link,
    )
    db.add(new_submission)
    await db.commit()

    return {"message": "Assignment submitted successfully"}


from app.models.user import User

class GradeSubmissionRequest(BaseModel):
    grade: str
    remarks: Optional[str] = None


@router.get("/{assignment_id}/submissions")
async def list_assignment_submissions(
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user["role"] not in ("faculty", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty can view submissions",
        )
    
    # Query all submissions for this assignment joined with Student info
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
            "submitted_at": str(sub.submitted_at) if sub.submitted_at else None,
            "status": sub.status,
            "grade": sub.grade,
            "remarks": sub.remarks,
            "student": {
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "roll_number": student.roll_number or "N/A",
            }
        }
        for sub, student in rows
    ]


@router.put("/submissions/{submission_id}/grade")
async def grade_submission(
    submission_id: int,
    req: GradeSubmissionRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user["role"] not in ("faculty", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty can grade submissions",
        )
    
    # Find submission
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )

    submission.grade = req.grade
    submission.remarks = req.remarks
    submission.status = "graded"
    
    await db.flush()
    return {"message": "Submission graded successfully"}


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


@router.post("/generate-ai")
async def generate_assignment_ai(
    req: GenerateAssignmentAIRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user["role"] not in ("faculty", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty or admin can generate assignments",
        )

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
