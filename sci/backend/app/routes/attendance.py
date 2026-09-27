from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import date
from app.database import get_db
from app.models.attendance import Attendance
from app.models.communication import Notification
from app.models.user import User
from app.middleware.auth_middleware import get_current_user
from app.utils.websocket_manager import manager as ws_manager

router = APIRouter(prefix="/attendance", tags=["Attendance"])


from pydantic import Field
from typing import List, Dict, Union, Any
from datetime import datetime


def normalize_attendance_date(val: Any) -> date:
    if isinstance(val, date):
        return val
    if not val:
        return date.today()
    val_str = str(val).strip()
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(val_str, fmt).date()
        except ValueError:
            pass
    return date.today()


def normalize_attendance_status(status_str: str) -> tuple[str, str]:
    cleaned = (status_str or "").strip().lower()
    if cleaned in ("present", "p", "true", "1"):
        return ("present", "present")
    elif cleaned in ("late", "tardy"):
        return ("present", "late")
    elif cleaned in ("od", "on-duty", "duty"):
        return ("present", "od")
    else:
        return ("absent", "absent")


class MarkAttendanceRequest(BaseModel):
    student_id: int
    subject: str
    date: Union[date, str]
    status: str
    status_type: Optional[str] = "present"
    remarks: Optional[str] = None


class BulkMarkAttendanceItem(BaseModel):
    student_id: int
    status: str
    status_type: Optional[str] = None
    subject: Optional[str] = None
    date: Optional[Union[date, str]] = None
    remarks: Optional[str] = None


class BulkMarkAttendanceRequest(BaseModel):
    subject: Optional[str] = None
    date: Optional[Union[date, str]] = None
    records: List[BulkMarkAttendanceItem]


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


@router.get("/history")
@router.get("/my-records")
async def get_my_attendance_history(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns actual individual attendance logs from the database for the authenticated student."""
    result = await db.execute(
        select(Attendance)
        .where(Attendance.student_id == current_user["id"])
        .order_by(Attendance.date.desc())
    )
    records = result.scalars().all()
    return [
        {
            "id": r.id,
            "subject": r.subject,
            "date": r.date.isoformat() if hasattr(r.date, "isoformat") else str(r.date),
            "status": r.status,
            "remarks": r.remarks,
        }
        for r in records
    ]


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
    await db.commit()

    # Trigger alert if attendance in this subject falls below 75%
    if req.status.lower() in ["absent", "late"]:
        try:
            att_res = await db.execute(
                select(Attendance).where(
                    Attendance.student_id == req.student_id,
                    Attendance.subject == req.subject
                )
            )
            all_recs = att_res.scalars().all()
            tot = len(all_recs)
            pres = len([r for r in all_recs if r.status.lower() in ("present", "late", "od")])
            pct = round((pres / tot * 100), 1) if tot > 0 else 100.0
            if pct < 75.0:
                std_q = await db.execute(select(User).where(User.id == req.student_id))
                std_user = std_q.scalar_one_or_none()
                guardian_id = getattr(std_user, "guardian_id", None) if std_user else None
                notif = Notification(
                    title=f"⚠️ Attendance Alert: {req.subject}",
                    message=f"Attendance in {req.subject} is currently {pct}% (below mandatory 75% threshold).",
                    category="academic",
                    priority="high",
                    user_id=req.student_id,
                    created_by=current_user["id"]
                )
                db.add(notif)
                if guardian_id:
                    g_notif = Notification(
                        title=f"⚠️ Ward Attendance Alert: {req.subject}",
                        message=f"Your ward's attendance in {req.subject} has fallen to {pct}% (below 75%).",
                        category="academic",
                        priority="high",
                        user_id=guardian_id,
                        created_by=current_user["id"]
                    )
                    db.add(g_notif)
                await db.commit()
                await ws_manager.send_personal_message(req.student_id, {
                    "type": "WORKFLOW_UPDATE",
                    "event": "ATTENDANCE_RISK_ALERT",
                    "subject": req.subject,
                    "percentage": pct
                })
        except Exception:
            pass

    return {"message": "Attendance marked successfully"}


@router.post("/bulk")
@router.post("/mark-bulk")
@router.post("")
@router.post("/")
async def mark_attendance_bulk(
    req: BulkMarkAttendanceRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") not in ("faculty", "admin", "hod"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty, admin, or department heads can record class attendance",
        )

    if not req.records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No student attendance records provided in submission",
        )

    # Master subject and date resolution
    default_sub = req.subject or (req.records[0].subject if req.records and req.records[0].subject else "Data Structures")
    default_date = normalize_attendance_date(req.date or (req.records[0].date if req.records and req.records[0].date else None))

    saved_count = 0
    faculty_id = current_user["id"]

    for rec in req.records:
        rec_subject = rec.subject or default_sub
        rec_date = normalize_attendance_date(rec.date) if rec.date else default_date
        db_status, status_type = normalize_attendance_status(rec.status)

        exist_res = await db.execute(
            select(Attendance).where(
                Attendance.student_id == rec.student_id,
                Attendance.subject == rec_subject,
                Attendance.date == rec_date,
            )
        )
        record = exist_res.scalar_one_or_none()
        if record:
            record.status = db_status
            record.status_type = rec.status_type or status_type
            record.remarks = rec.remarks
            record.faculty_id = faculty_id
            record.edited_by = faculty_id
        else:
            record = Attendance(
                student_id=rec.student_id,
                faculty_id=faculty_id,
                subject=rec_subject,
                date=rec_date,
                status=db_status,
                status_type=rec.status_type or status_type,
                remarks=rec.remarks,
            )
            db.add(record)
        saved_count += 1

    await db.flush()
    await db.commit()

    return {
        "success": True,
        "message": f"Successfully marked/updated attendance for {saved_count} students in {default_sub}",
        "count": saved_count,
        "subject": default_sub,
        "date": str(default_date),
    }


@router.get("/class-status")
async def get_class_attendance_status(
    subject: str = Query(...),
    date: str = Query(...),
    department: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    parsed_date = normalize_attendance_date(date)
    query = select(Attendance).where(
        Attendance.subject == subject,
        Attendance.date == parsed_date,
    )
    result = await db.execute(query)
    records = result.scalars().all()

    status_map = {r.student_id: r.status for r in records}
    present_cnt = sum(1 for r in records if r.status == "present")
    absent_cnt = sum(1 for r in records if r.status == "absent")

    return {
        "subject": subject,
        "date": str(parsed_date),
        "total_recorded": len(records),
        "present_count": present_cnt,
        "absent_count": absent_cnt,
        "records": status_map,
    }


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
