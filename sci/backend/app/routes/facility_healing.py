from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.services.facility_healing_service import FacilityHealingService

router = APIRouter(prefix="/facility-healing", tags=["Self-Healing DCRA+ Facilities"])


@router.post("/report-complaint")
async def report_facility_complaint(
    classroom_id: int = Body(...),
    equipment_type: str = Body("projector"),
    issue_description: str = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Report classroom hardware issue.
    DCRA+ Engine automatically evaluates equipment health and reallocates upcoming sessions.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    return await FacilityHealingService.report_complaint(
        db=db,
        classroom_id=classroom_id,
        equipment_type=equipment_type,
        issue_description=issue_description,
        reported_by_user_id=user_id
    )
