from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.services.placement_matchmaker import PlacementMatchmakerService

router = APIRouter(prefix="/placements-ai", tags=["AI Career Matchmaker"])


@router.get("/{placement_id}/match-score")
async def get_placement_match_score(
    placement_id: int = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get RAG skill match score (%) against company job description.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    return await PlacementMatchmakerService.get_match_score(
        db=db, placement_id=placement_id, student_id=user_id
    )


@router.post("/{placement_id}/generate-mock-interview")
async def generate_placement_mock_interview(
    placement_id: int = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate company-tailored AI technical mock interview quiz questions.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    return await PlacementMatchmakerService.generate_mock_interview(
        db=db, placement_id=placement_id, student_id=user_id
    )
