"""
Central API Router for Smart Campus AI
Aggregates all domain routes into a single router.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.middleware.auth_middleware import get_current_user
from app.routes import (
    auth,
    students,
    attendance,
    assignments,
    ai,
    events,
    admin,
    core_hub,
    notifications,
    placements,
    announcements,
    study_materials,
    timetable,
    student_import,
    faculty_locator,
    forum,
    faculty_import,
    leaves_od,
    learning_intelligence,
    quiz,
    campus_pulse,
    gate_pass,
    academic_predictor,
    facility_healing,
    placement_matchmaker,
    ai_copilot,
    guardian,
    incidents,
    search,
    internal_marks,
    warden,
    faculty,
)

api_router = APIRouter()

# Register all domain routes
api_router.include_router(auth.router)
api_router.include_router(students.router)
api_router.include_router(attendance.router)
api_router.include_router(assignments.router)
api_router.include_router(ai.router)
api_router.include_router(events.router)
api_router.include_router(admin.router)
api_router.include_router(core_hub.router)
api_router.include_router(notifications.router)
api_router.include_router(placements.router)
api_router.include_router(announcements.router)
api_router.include_router(study_materials.router)
api_router.include_router(timetable.router)
api_router.include_router(student_import.router)
api_router.include_router(faculty_locator.router)
api_router.include_router(forum.router)
api_router.include_router(faculty_import.router)
api_router.include_router(leaves_od.router)
api_router.include_router(learning_intelligence.router)
api_router.include_router(quiz.router)
api_router.include_router(campus_pulse.router)
api_router.include_router(gate_pass.router)
api_router.include_router(academic_predictor.router)
api_router.include_router(facility_healing.router)
api_router.include_router(placement_matchmaker.router)
api_router.include_router(ai_copilot.router)
api_router.include_router(guardian.router)
api_router.include_router(incidents.router)
api_router.include_router(search.router)
api_router.include_router(internal_marks.router)
api_router.include_router(warden.router)
api_router.include_router(faculty.router)
 
 
@api_router.get("/faculty")
async def list_faculty_members(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.role.in_(["faculty", "hod"])).order_by(User.name)
    )
    faculty_list = result.scalars().all()
    return [
        {
            "id": f.id,
            "name": f.name,
            "email": f.email,
            "role": f.role,
            "department": f.department,
            "employee_id": f.employee_id or f"FAC{f.id:03d}",
        }
        for f in faculty_list
    ]

