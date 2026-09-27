from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case
from datetime import datetime, date
from typing import Optional, List, Dict, Any

from app.database import get_db
from app.models.user import User, Timetable, TimetableEntry, Announcement
from app.models.attendance import Attendance
from app.models.assignment import Assignment, Submission
from app.models.communication import Notification
from app.models.academic import Classroom
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/faculty", tags=["Faculty"])


@router.get("/peers")
async def get_faculty_peers(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns real faculty & HOD directory members from the database."""
    result = await db.execute(
        select(User)
        .where(User.role.in_(["faculty", "hod"]))
        .order_by(User.name)
    )
    peers = result.scalars().all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "email": p.email,
            "role": p.role.upper(),
            "department": p.department or "CSE",
            "custom_status": p.custom_status or "Available",
        }
        for p in peers
    ]


@router.get("/dashboard-analytics")
async def get_faculty_dashboard_analytics(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Computes live, strictly database-driven dashboard analytics for the authenticated faculty member.
    """
    user_id = current_user["id"]
    dept = current_user.get("department")

    # 1. Real Average Attendance Rate
    # Query attendance records logged by this faculty (or department if faculty hasn't logged any yet)
    att_query = select(
        func.count(Attendance.id).label("total"),
        func.sum(case((Attendance.status == "present", 1), else_=0)).label("present"),
    ).where(Attendance.faculty_id == user_id)
    att_res = await db.execute(att_query)
    att_row = att_res.first()

    total_att = (att_row.total or 0) if att_row else 0
    present_att = (att_row.present or 0) if att_row else 0

    # If no records under this faculty specifically, calculate across department
    if total_att == 0 and dept:
        dept_att_query = (
            select(
                func.count(Attendance.id).label("total"),
                func.sum(case((Attendance.status == "present", 1), else_=0)).label("present"),
            )
            .join(User, User.id == Attendance.student_id)
            .where(User.department == dept)
        )
        dept_att_res = await db.execute(dept_att_query)
        dept_att_row = dept_att_res.first()
        total_att = (dept_att_row.total or 0) if dept_att_row else 0
        present_att = (dept_att_row.present or 0) if dept_att_row else 0

    average_attendance = round((present_att / total_att * 100), 1) if total_att > 0 else 0.0

    # 2. Total Enrolled Students (real count from User table)
    students_query = select(func.count(User.id)).where(User.role == "student")
    if dept:
        students_query = students_query.where(User.department == dept)
    total_students = (await db.execute(students_query)).scalar() or 0

    # 3. Scheduled Sessions Today from TimetableEntry
    today_name = datetime.now().strftime("%A")
    classes_query = (
        select(func.count(TimetableEntry.id))
        .join(Timetable, Timetable.id == TimetableEntry.timetable_id)
        .where(
            TimetableEntry.day == today_name,
            Timetable.is_active == True,
        )
    )
    if dept:
        classes_query = classes_query.where(Timetable.department == dept)
    classes_today = (await db.execute(classes_query)).scalar() or 0

    # 4. Pending / Active Assignments Published by this Faculty
    assign_query = select(func.count(Assignment.id)).where(Assignment.faculty_id == user_id)
    total_assignments = (await db.execute(assign_query)).scalar() or 0

    # 5. Real Dispatches / Announcements from Database
    notifs_query = (
        select(Notification)
        .where(
            or_(
                Notification.target_role.in_(["faculty", "all"]),
                Notification.target_role.is_(None),
            )
        )
        .order_by(Notification.created_at.desc())
        .limit(3)
    )
    notifs_res = await db.execute(notifs_query)
    notifs = notifs_res.scalars().all()

    dispatches = [
        {
            "id": f"disp-{n.id}",
            "author": getattr(n, "category", None) or "Academic Office",
            "context": f"on {n.title}",
            "time": n.created_at.strftime("%I:%M %p") if n.created_at else "Today",
            "message": n.message,
        }
        for n in notifs
    ]

    # 6. Real Peer Faculty & HOD Directory
    peers_query = (
        select(User)
        .where(User.role.in_(["faculty", "hod"]))
        .order_by(User.name)
        .limit(6)
    )
    peers_res = await db.execute(peers_query)
    peers = [
        {
            "id": p.id,
            "name": p.name,
            "role": p.role.upper(),
            "department": p.department or "CSE",
            "custom_status": p.custom_status or "Available",
        }
        for p in peers_res.scalars().all()
    ]

    # 7. Real Venues / Classrooms from Database
    rooms_query = select(Classroom).order_by(Classroom.room_number).limit(5)
    rooms_res = await db.execute(rooms_query)
    rooms = rooms_res.scalars().all()
    venues = [
        {
            "id": f"room-{r.id}",
            "name": f"{r.building} - {r.room_number}",
            "category": "Lab Facility" if r.is_lab else "Lecture Hall",
            "capacity": r.capacity,
            "status": "Active",
        }
        for r in rooms
    ]

    return {
        "averageAttendance": average_attendance,
        "classesToday": classes_today,
        "totalStudents": total_students,
        "totalAssignments": total_assignments,
        "dispatches": dispatches,
        "peers": peers,
        "venues": venues,
    }
