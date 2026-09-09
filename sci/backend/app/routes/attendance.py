from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import date
from app.database import get_db
from app.models.attendance import Attendance
from app.middleware.auth_middleware import get_current_user

from app.models.user import User

router = APIRouter(prefix="/attendance", tags=["Attendance"])


from pydantic import Field
from typing import List, Dict

class MarkAttendanceRequest(BaseModel):
    student_id: int
    subject: str
    date: date
    status: str
    status_type: Optional[str] = "present"
    remarks: Optional[str] = None


class BulkMarkAttendanceRecord(BaseModel):
    student_id: int
    status: str
    status_type: Optional[str] = "present"
    remarks: Optional[str] = None


class BulkMarkAttendanceRequest(BaseModel):
    subject: str
    date: date
    records: List[BulkMarkAttendanceRecord]


@router.get("/students")
async def list_students_for_attendance(
    department: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user["role"] not in ("faculty", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty or admin can view student lists for attendance",
        )
    query = select(User).where(User.role == "student")
    if department:
        query = query.where(User.department == department)
    query = query.order_by(User.name)
    result = await db.execute(query)
    students = result.scalars().all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "department": s.department or "N/A",
            "roll_number": s.roll_number or "N/A",
        }
        for s in students
    ]


@router.get("")
@router.get("/")
@router.get("/my")
async def get_my_attendance(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Attendance).where(Attendance.student_id == current_user["id"])
    )
    records = result.scalars().all()

    # Group by subject
    subject_data: dict[str, dict] = {}
    for record in records:
        if record.subject not in subject_data:
            subject_data[record.subject] = {"present": 0, "total": 0}
        subject_data[record.subject]["total"] += 1
        if record.status == "present":
            subject_data[record.subject]["present"] += 1

    attendance_list = []
    for subject, data in subject_data.items():
        percentage = round((data["present"] / data["total"]) * 100, 1) if data["total"] > 0 else 0
        attendance_list.append(
            {
                "subject": subject,
                "present": data["present"],
                "attended": data["present"],
                "total": data["total"],
                "totalClasses": data["total"],
                "percentage": percentage,
            }
        )

    return attendance_list


@router.get("/summary")
async def get_attendance_summary(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_my_attendance(current_user, db)


@router.post("/mark")
async def mark_attendance(
    req: MarkAttendanceRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user["role"] not in ("faculty", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty can mark attendance",
        )

    # Check if record already exists for this student, subject, and date
    exist_res = await db.execute(
        select(Attendance).where(
            Attendance.student_id == req.student_id,
            Attendance.subject == req.subject,
            Attendance.date == req.date
        )
    )
    record = exist_res.scalar_one_or_none()
    if record:
        record.status = req.status
        record.status_type = req.status_type
        record.remarks = req.remarks
        record.faculty_id = current_user["id"]
        record.edited_by = current_user["id"]
    else:
        record = Attendance(
            student_id=req.student_id,
            faculty_id=current_user["id"],
            subject=req.subject,
            date=req.date,
            status=req.status,
            status_type=req.status_type,
            remarks=req.remarks
        )
        db.add(record)
        
    await db.flush()
    return {"message": "Attendance marked successfully"}


@router.post("/mark-bulk")
async def mark_attendance_bulk(
    req: BulkMarkAttendanceRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user["role"] not in ("faculty", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty can mark attendance",
        )

    for rec in req.records:
        exist_res = await db.execute(
            select(Attendance).where(
                Attendance.student_id == rec.student_id,
                Attendance.subject == req.subject,
                Attendance.date == req.date
            )
        )
        record = exist_res.scalar_one_or_none()
        if record:
            record.status = rec.status
            record.status_type = rec.status_type
            record.remarks = rec.remarks
            record.faculty_id = current_user["id"]
            record.edited_by = current_user["id"]
        else:
            record = Attendance(
                student_id=rec.student_id,
                faculty_id=current_user["id"],
                subject=req.subject,
                date=req.date,
                status=rec.status,
                status_type=rec.status_type,
                remarks=rec.remarks
            )
            db.add(record)
            
    await db.flush()
    return {"message": f"Successfully marked/updated attendance for {len(req.records)} students"}


from datetime import timedelta
import json

@router.get("/student-logs")
async def get_student_attendance_logs(
    student_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user["role"] == "student":
        stud_id = current_user["id"]
    else:
        if not student_id:
            raise HTTPException(status_code=400, detail="student_id is required for faculty/admin view")
        stud_id = student_id

    result = await db.execute(
        select(Attendance).where(Attendance.student_id == stud_id).order_by(Attendance.date.desc())
    )
    records = result.scalars().all()

    daily_log = []
    subject_stats = {}
    
    for r in records:
        daily_log.append({
            "id": r.id,
            "subject": r.subject,
            "date": str(r.date),
            "status": r.status,
            "status_type": r.status_type or r.status,
            "remarks": r.remarks or ""
        })

        if r.subject not in subject_stats:
            subject_stats[r.subject] = {"present": 0, "total": 0, "history": []}
        
        subject_stats[r.subject]["total"] += 1
        if r.status == "present":
            subject_stats[r.subject]["present"] += 1
        subject_stats[r.subject]["history"].append(1 if r.status == "present" else 0)

    weekly_stats = {}
    monthly_stats = {}
    
    for r in records:
        week_start = r.date - timedelta(days=r.date.weekday())
        week_str = week_start.strftime("%Y-%m-%d")
        if week_str not in weekly_stats:
            weekly_stats[week_str] = {"present": 0, "total": 0}
        weekly_stats[week_str]["total"] += 1
        if r.status == "present":
            weekly_stats[week_str]["present"] += 1

        month_str = r.date.strftime("%Y-%B")
        if month_str not in monthly_stats:
            monthly_stats[month_str] = {"present": 0, "total": 0}
        monthly_stats[month_str]["total"] += 1
        if r.status == "present":
            monthly_stats[month_str]["present"] += 1

    weekly_log = [
        {"week": w, "percentage": round((data["present"] / data["total"]) * 100, 1)}
        for w, data in sorted(weekly_stats.items())
    ]
    monthly_log = [
        {"month": m.split("-")[1], "year": m.split("-")[0], "percentage": round((data["present"] / data["total"]) * 100, 1)}
        for m, data in sorted(monthly_stats.items())
    ]

    predictions = {}
    from app.services.gemini_service import generate_structured_content_async
    
    class AttendanceShortageResponse(BaseModel):
        risk_level: str = Field(description="High Risk, Medium Risk, Low Risk")
        explanation: str = Field(description="A short explanation of the prediction")
        action_plan: str = Field(description="A tip or plan to help the student improve")

    for subject, stats in subject_stats.items():
        total = stats["total"]
        present = stats["present"]
        recent = stats["history"][:10]
        recent_str = ", ".join(["P" if x == 1 else "A" for x in reversed(recent)])
        
        prompt = f"""Based on the student's attendance history:
        - Subject: {subject}
        - Total classes held: {total}
        - Classes attended: {present}
        - Recent trend (last 10 classes): {recent_str}
        
        Predict if the student is at risk of falling below the 75% attendance threshold.
        Provide a prediction: "High Risk", "Medium Risk", or "Low Risk", with a brief explanation and a helpful tip for the student.
        Return a JSON object matching the AttendanceShortageResponse schema.
        """
        try:
            res_text = await generate_structured_content_async(prompt, AttendanceShortageResponse)
            predictions[subject] = json.loads(res_text)
        except Exception:
            predictions[subject] = {
                "risk_level": "High Risk" if (present/total) < 0.75 else "Low Risk",
                "explanation": f"Current attendance is {round((present/total)*100, 1)}%. Ensure regular class presence.",
                "action_plan": "Attend all upcoming lectures to improve score."
            }

    return {
        "daily": daily_log,
        "weekly": weekly_log,
        "monthly": monthly_log,
        "subjects": [
            {
                "subject": sub,
                "present": stats["present"],
                "total": stats["total"],
                "percentage": round((stats["present"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0,
                "prediction": predictions.get(sub, {
                    "risk_level": "Low Risk",
                    "explanation": "No prediction available.",
                    "action_plan": "N/A"
                })
            }
            for sub, stats in subject_stats.items()
        ]
    }
