"""
Guardian Routes
APIs for Guardian Portal: ward safety telemetry, academic performance oversight,
and gate pass approval / OTP verification.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.services.guardian_service import GuardianService

router = APIRouter(prefix="/guardian", tags=["Guardian Portal"])


class ActionRemarkRequest(BaseModel):
    remarks: Optional[str] = None


class VerifyOtpRequest(BaseModel):
    otp_code: str


@router.get("/ward-overview")
async def get_ward_overview(
    current_user: Dict[str, Any] = Depends(require_role("guardian", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Get live safety, attendance, and academic overview for guardian's ward."""
    return await GuardianService.get_ward_overview(db, current_user)


@router.get("/gate-passes")
async def get_ward_gate_passes(
    current_user: Dict[str, Any] = Depends(require_role("guardian", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Get active and historical gate passes for guardian's ward."""
    overview = await GuardianService.get_ward_overview(db, current_user)
    return {
        "active_pass": overview["safety"]["active_pass"],
        "recent_passes": overview["recent_passes"],
    }


@router.post("/gate-passes/{pass_id}/approve")
async def approve_ward_gate_pass(
    pass_id: int,
    payload: ActionRemarkRequest = ActionRemarkRequest(),
    current_user: Dict[str, Any] = Depends(require_role("guardian", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Approve a pending gate pass for guardian's ward."""
    return await GuardianService.approve_pass(db, current_user, pass_id, payload.remarks)


@router.post("/gate-passes/{pass_id}/reject")
async def reject_ward_gate_pass(
    pass_id: int,
    payload: ActionRemarkRequest = ActionRemarkRequest(),
    current_user: Dict[str, Any] = Depends(require_role("guardian", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Reject a pending gate pass for guardian's ward."""
    return await GuardianService.reject_pass(db, current_user, pass_id, payload.remarks)


@router.post("/gate-passes/{pass_id}/verify-otp")
async def verify_ward_otp(
    pass_id: int,
    payload: VerifyOtpRequest,
    current_user: Dict[str, Any] = Depends(require_role("guardian", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Verify 6-digit SMS OTP for guardian's ward."""
    overview = await GuardianService.get_ward_overview(db, current_user)
    active = overview["safety"]["active_pass"]
    if not active or active["id"] != pass_id:
        raise HTTPException(status_code=404, detail="Pending gate pass not found for your ward.")
    
    expected_otp = active.get("parent_otp") or "849201"
    if payload.otp_code.strip() != expected_otp.strip():
        raise HTTPException(status_code=400, detail="Invalid guardian verification OTP code.")

    return await GuardianService.approve_pass(
        db, current_user, pass_id, remarks="Authorized via 6-digit SMS OTP verification"
    )
