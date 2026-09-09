"""
Central API Router for Smart Campus AI
Aggregates all domain routes into a single router.
"""

from fastapi import APIRouter
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

