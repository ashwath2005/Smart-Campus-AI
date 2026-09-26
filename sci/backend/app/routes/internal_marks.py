"""
Internal Marks Management Router
Supports faculty & admin gradebook workflows for continuous assessment (CAT-1, CAT-2, CAT-3, Model, Assignment).
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.models.academic import InternalMark
from app.models.communication import Notification


router = APIRouter(prefix="/internal-marks", tags=["Internal Marks"])


class MarkEntry(BaseModel):
    student_id: int
    marks_obtained: float = Field(..., ge=0.0)


class BatchSaveMarksRequest(BaseModel):
    subject_name: str
    exam_type: str  # cat1, cat2, cat3, model, assignment
    semester: int = Field(..., ge=1, le=8)
    max_marks: float = Field(default=50.0, gt=0.0)
    entries: List[MarkEntry]


@router.get("/roster")
async def get_marks_roster(
    subject_name: str = Query(...),
    exam_type: str = Query("cat1"),
    semester: int = Query(4),
    department: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns student roster along with currently recorded internal marks for the specified
    subject, exam type, and semester.
    """
    user_role = current_user.get("role", "").lower()
    if user_role not in ("faculty", "admin", "hod"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty, HODs, or administrators can manage internal marks roster.",
        )

    # 1. Fetch all students (filter by department if provided)
    query = select(User).where(User.role == "student")
    if department:
        query = query.where(User.department == department)
    query = query.order_by(User.roll_number.is_(None), User.roll_number, User.name)
    res = await db.execute(query)
    students = res.scalars().all()

    # 2. Fetch existing marks for this subject + exam_type + semester
    normalized_exam = exam_type.lower()
    valid_exams = ["cat1", "cat2", "cat3", "model", "assignment"]
    if normalized_exam not in valid_exams:
        normalized_exam = "cat1"

    marks_query = select(InternalMark).where(
        and_(
            InternalMark.subject_name == subject_name,
            InternalMark.exam_type == normalized_exam,
            InternalMark.semester == semester,
        )
    )
    marks_res = await db.execute(marks_query)
    existing_marks = {m.student_id: m for m in marks_res.scalars().all()}

    # 3. Combine roster
    roster = []
    for s in students:
        mark_record = existing_marks.get(s.id)
        roster.append({
            "student_id": s.id,
            "name": s.name,
            "email": s.email,
            "department": s.department or "General",
            "roll_number": s.roll_number or f"STU-{s.id:04d}",
            "marks_obtained": mark_record.marks_obtained if mark_record else None,
            "max_marks": mark_record.max_marks if mark_record else 50.0,
            "recorded": mark_record is not None,
            "updated_at": mark_record.created_at.isoformat() if mark_record else None,
        })

    return {
        "subject_name": subject_name,
        "exam_type": normalized_exam,
        "semester": semester,
        "total_students": len(roster),
        "graded_count": sum(1 for r in roster if r["marks_obtained"] is not None),
        "students": roster,
    }


@router.post("/batch-save")
async def batch_save_internal_marks(
    payload: BatchSaveMarksRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Saves or updates internal marks in bulk for the given subject, exam type, and semester.
    """
    user_role = current_user.get("role", "").lower()
    if user_role not in ("faculty", "admin", "hod"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty, HODs, or administrators can submit internal marks.",
        )

    normalized_exam = payload.exam_type.lower()
    valid_exams = ["cat1", "cat2", "cat3", "model", "assignment"]
    if normalized_exam not in valid_exams:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid exam_type '{payload.exam_type}'. Expected one of {valid_exams}",
        )

    # Validate marks against max_marks
    for entry in payload.entries:
        if entry.marks_obtained > payload.max_marks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Marks obtained ({entry.marks_obtained}) cannot exceed maximum marks ({payload.max_marks})",
            )

    saved_count = 0
    updated_count = 0

    for entry in payload.entries:
        # Check existing
        q = select(InternalMark).where(
            and_(
                InternalMark.student_id == entry.student_id,
                InternalMark.subject_name == payload.subject_name,
                InternalMark.exam_type == normalized_exam,
                InternalMark.semester == payload.semester,
            )
        )
        res = await db.execute(q)
        record = res.scalar_one_or_none()

        if record:
            record.marks_obtained = entry.marks_obtained
            record.max_marks = payload.max_marks
            updated_count += 1
        else:
            new_record = InternalMark(
                student_id=entry.student_id,
                subject_name=payload.subject_name,
                exam_type=normalized_exam,
                marks_obtained=entry.marks_obtained,
                max_marks=payload.max_marks,
                semester=payload.semester,
            )
            db.add(new_record)
            saved_count += 1

        # Dispatch student notification
        notif = Notification(
            user_id=entry.student_id,
            created_by=current_user.get("id", 1),
            title=f"New Marks Published: {payload.subject_name}",
            message=f"Your {payload.exam_type.upper()} marks for {payload.subject_name} have been updated: {entry.marks_obtained}/{payload.max_marks}",
            category="academic",
            priority="normal",
        )
        db.add(notif)

    await db.commit()

    return {
        "success": True,
        "message": f"Successfully recorded internal marks for {saved_count + updated_count} students.",
        "subject_name": payload.subject_name,
        "exam_type": normalized_exam,
        "semester": payload.semester,
        "new_entries": saved_count,
        "updated_entries": updated_count,
    }
