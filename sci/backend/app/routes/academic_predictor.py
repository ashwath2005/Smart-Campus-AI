from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.services.sgpa_predictor import SGPAPredictorService

router = APIRouter(prefix="/academic-risk", tags=["Predictive SGPA Early-Warning System"])


@router.get("/predict")
async def predict_my_sgpa(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get 3-week pre-exam SGPA prediction, risk status, and 14-day AI study plan.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    return await SGPAPredictorService.predict_academic_risk(db=db, student_id=user_id)


@router.get("/student/{student_id}")
async def predict_student_sgpa(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Faculty/HOD endpoint to inspect student predicted academic risk.
    """
    role = current_user.get("role")
    if role not in ["faculty", "hod", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied to student risk prediction")

    return await SGPAPredictorService.predict_academic_risk(db=db, student_id=student_id)
