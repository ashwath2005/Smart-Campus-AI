"""
Global Search Route
Role-filtered semantic search across users, courses, subjects, classrooms, events, placements, and gate passes.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User, Announcement
from app.models.academic import Classroom
from app.models.department import Subject, Department
from app.models.event import Event
from app.models.placement import Placement, Company
from app.models.gate_pass import GatePass

router = APIRouter(prefix="/search", tags=["Global Search"])


@router.get("")
@router.get("/")
async def global_campus_search(
    q: str = Query(..., min_length=1, description="Search query string"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query_term = q.strip().lower()
    role = current_user.get("role", "student")
    user_id = current_user.get("id")
    dept = current_user.get("department")

    results: List[Dict[str, Any]] = []

    # 1. Classrooms / Campus Facilities (All authenticated roles)
    room_q = select(Classroom).where(
        or_(
            func.lower(Classroom.room_number).like(f"%{query_term}%"),
            func.lower(Classroom.building).like(f"%{query_term}%"),
        )
    ).limit(5)
    room_res = await db.execute(room_q)
    for r in room_res.scalars().all():
        results.append({
            "category": "Classroom",
            "title": f"Room {r.room_number} ({r.building})",
            "subtitle": f"Capacity: {r.capacity} | Type: {r.room_type or 'Lecture'}",
            "path": "/campus-pulse",
            "badge": "Facility"
        })

    # 2. Subjects / Courses
    subj_q = select(Subject).where(
        or_(
            func.lower(Subject.name).like(f"%{query_term}%"),
            func.lower(Subject.code).like(f"%{query_term}%"),
        )
    ).limit(5)
    subj_res = await db.execute(subj_q)
    for s in subj_res.scalars().all():
        results.append({
            "category": "Subject",
            "title": f"{s.code} - {s.name}",
            "subtitle": f"Weekly Hours: {s.weekly_hours} | Sem {s.semester}{' (Lab)' if s.is_lab else ''}",
            "path": "/study-materials" if role == "student" else "/faculty",
            "badge": "Curriculum"
        })

    # 3. Events (All roles)
    evt_q = select(Event).where(
        or_(
            func.lower(Event.title).like(f"%{query_term}%"),
            func.lower(Event.description).like(f"%{query_term}%"),
        )
    ).limit(5)
    evt_res = await db.execute(evt_q)
    for e in evt_res.scalars().all():
        results.append({
            "category": "Event",
            "title": e.title,
            "subtitle": f"Venue: {e.venue or 'Campus'} | Date: {e.event_date.strftime('%Y-%m-%d') if e.event_date else 'Upcoming'}",
            "path": "/events",
            "badge": "Campus Life"
        })

    # 4. Placements (Students & Admins)
    if role in ("student", "admin"):
        pl_q = (
            select(Placement, Company)
            .join(Company, Placement.company_id == Company.id)
            .where(
                or_(
                    func.lower(Placement.title).like(f"%{query_term}%"),
                    func.lower(Company.name).like(f"%{query_term}%"),
                )
            )
            .limit(5)
        )
        pl_res = await db.execute(pl_q)
        for pl, comp in pl_res.all():
            results.append({
                "category": "Placement",
                "title": f"{comp.name} - {pl.title}",
                "subtitle": f"Package: {f'{pl.package_lpa} LPA' if pl.package_lpa else 'Disclosed'} | Type: {pl.placement_type or 'Full-time'}",
                "path": "/placements",
                "badge": "Career"
            })

    # 5. Faculty / Staff Directory (Role-aware)
    if role in ("student", "faculty", "hod", "admin"):
        fac_q = select(User).where(
            User.role == "faculty",
            or_(
                func.lower(User.name).like(f"%{query_term}%"),
                func.lower(User.email).like(f"%{query_term}%"),
                func.lower(User.department).like(f"%{query_term}%"),
            )
        ).limit(5)
        fac_res = await db.execute(fac_q)
        for f in fac_res.scalars().all():
            results.append({
                "category": "Faculty",
                "title": f.name,
                "subtitle": f"{f.department or 'Academic'} • Staff Room: {f.staff_room or 'Faculty Cabin'}",
                "path": "/faculty-locator",
                "badge": f.custom_status or "Available"
            })

    # 6. Gate Passes (Scattered by permission)
    if role == "student":
        gp_q = select(GatePass).where(
            GatePass.student_id == user_id,
            or_(
                func.lower(GatePass.destination).like(f"%{query_term}%"),
                func.lower(GatePass.reason).like(f"%{query_term}%"),
            )
        ).limit(3)
        gp_res = await db.execute(gp_q)
        for p in gp_res.scalars().all():
            results.append({
                "category": "Gate Pass",
                "title": f"Pass #{p.id} ({p.pass_type.upper()})",
                "subtitle": f"Dest: {p.destination} • Status: {p.status}",
                "path": "/gate-pass",
                "badge": p.status
            })
    elif role in ("security", "admin", "hod"):
        gp_q = select(GatePass).where(
            or_(
                func.lower(GatePass.destination).like(f"%{query_term}%"),
                func.lower(GatePass.reason).like(f"%{query_term}%"),
            )
        ).limit(5)
        gp_res = await db.execute(gp_q)
        for p in gp_res.scalars().all():
            results.append({
                "category": "Gate Pass",
                "title": f"Pass #{p.id} ({p.pass_type.upper()})",
                "subtitle": f"Dest: {p.destination} • Status: {p.status}",
                "path": "/gate-security" if role == "security" else "/hod",
                "badge": p.status
            })

    return {
        "query": query_term,
        "count": len(results),
        "results": results
    }
