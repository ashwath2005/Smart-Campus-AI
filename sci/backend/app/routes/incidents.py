"""
Security Incidents Routes
Endpoints for reporting, viewing, and resolving campus security incidents.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import SecurityIncident
from app.models.communication import Notification

router = APIRouter(prefix="/security/incidents", tags=["Security Incidents"])


class CreateIncidentRequest(BaseModel):
    title: str
    severity: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    location: str
    description: str


class ResolveIncidentRequest(BaseModel):
    resolution_notes: str


@router.post("")
@router.post("/")
async def report_incident(
    payload: CreateIncidentRequest,
    current_user: Dict[str, Any] = Depends(require_role("security", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Log a new security or curfew incident."""
    incident = SecurityIncident(
        title=payload.title,
        severity=payload.severity.upper(),
        location=payload.location,
        description=payload.description,
        reported_by=current_user["id"],
        status="OPEN",
        created_at=datetime.utcnow(),
    )
    db.add(incident)

    # If HIGH or CRITICAL, dispatch broadcast to admin
    if payload.severity.upper() in ("HIGH", "CRITICAL"):
        notif = Notification(
            title=f"🚨 Critical Security Incident: {payload.title}",
            message=f"Location: {payload.location}. {payload.description}",
            category="emergency",
            priority="high",
            target_role="admin",
            created_by=current_user["id"],
        )
        db.add(notif)

    await db.commit()
    await db.refresh(incident)
    return incident


@router.get("")
@router.get("/")
async def list_incidents(
    status_filter: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(require_role("security", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve campus security incidents."""
    query = select(SecurityIncident).order_by(desc(SecurityIncident.created_at))
    if status_filter:
        query = query.where(SecurityIncident.status == status_filter.upper())
    
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/{incident_id}/resolve")
async def resolve_incident(
    incident_id: int,
    payload: ResolveIncidentRequest,
    current_user: Dict[str, Any] = Depends(require_role("security", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Mark a security incident as resolved."""
    result = await db.execute(select(SecurityIncident).where(SecurityIncident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = "RESOLVED"
    incident.resolution_notes = payload.resolution_notes
    incident.resolved_at = datetime.utcnow()
    await db.commit()
    await db.refresh(incident)
    return incident
