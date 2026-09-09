from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import date
from typing import Optional, List
from app.database import get_db
from app.models.event import Event, EventRegistration
from app.models.user import User
from app.middleware.auth_middleware import get_current_user
from app.middleware.role_checker import require_role

router = APIRouter(prefix="/events", tags=["Events"])


class CreateEventRequest(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: date
    venue: Optional[str] = "Campus Auditorium"
    type: Optional[str] = "technical"


class CheckInRequest(BaseModel):
    student_id: int


@router.get("")
@router.get("/")
async def get_events(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).order_by(Event.event_date.desc()))
    events = result.scalars().all()

    event_list = []
    for e in events:
        registered = False
        if current_user["role"] == "student":
            reg_result = await db.execute(
                select(EventRegistration).where(
                    EventRegistration.event_id == e.id,
                    EventRegistration.student_id == current_user["id"],
                )
            )
            reg = reg_result.scalar_one_or_none()
            registered = reg is not None

        # Fetch registrations count
        count_res = await db.execute(
            select(select(EventRegistration).where(EventRegistration.event_id == e.id).exists())
        )
        # Or count directly
        from sqlalchemy import func
        reg_count_res = await db.execute(
            select(func.count(EventRegistration.id)).where(EventRegistration.event_id == e.id)
        )
        reg_count = reg_count_res.scalar() or 0

        event_list.append(
            {
                "id": e.id,
                "title": e.title,
                "description": e.description,
                "event_date": str(e.event_date),
                "created_at": str(e.created_at) if e.created_at else None,
                "registered": registered,
                "venue": e.venue or "Campus Auditorium",
                "type": e.type or "technical",
                "maxParticipants": 100,
                "registeredCount": reg_count,
            }
        )

    return event_list


class UpdateEventRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    venue: Optional[str] = None
    type: Optional[str] = None


@router.post("")
@router.post("/")
async def create_event(
    req: CreateEventRequest,
    current_user: dict = Depends(require_role("admin", "hod", "faculty")),
    db: AsyncSession = Depends(get_db),
):
    event = Event(
        title=req.title,
        description=req.description,
        event_date=req.event_date,
        venue=req.venue,
        type=req.type,
    )
    db.add(event)
    await db.flush()
    await db.commit()

    return {"message": "Event created successfully", "eventId": event.id}


@router.put("/{event_id}")
async def update_event(
    event_id: int,
    req: UpdateEventRequest,
    current_user: dict = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if req.title is not None:
        event.title = req.title
    if req.description is not None:
        event.description = req.description
    if req.event_date is not None:
        event.event_date = req.event_date
    if req.venue is not None:
        event.venue = req.venue
    if req.type is not None:
        event.type = req.type

    await db.commit()
    return {"message": "Event updated successfully", "event": {"id": event.id, "title": event.title}}


@router.delete("/{event_id}")
async def delete_event(
    event_id: int,
    current_user: dict = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Delete registrations first
    from sqlalchemy import delete
    await db.execute(delete(EventRegistration).where(EventRegistration.event_id == event_id))
    await db.delete(event)
    await db.commit()
    return {"message": "Event deleted successfully"}


@router.post("/{event_id}/register")
async def register_for_event(
    event_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check if event exists
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # Check if already registered
    result = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.student_id == current_user["id"],
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already registered for this event",
        )

    new_reg = EventRegistration(
        event_id=event_id,
        student_id=current_user["id"],
    )
    db.add(new_reg)
    await db.flush()

    return {"message": "Successfully registered for the event"}


@router.get("/{event_id}/participants")
async def get_event_participants(
    event_id: int,
    current_user: dict = Depends(require_role("faculty", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EventRegistration, User)
        .join(User, EventRegistration.student_id == User.id)
        .where(EventRegistration.event_id == event_id)
        .order_by(EventRegistration.registered_at.desc())
    )
    rows = result.all()

    participants = []
    for reg, user in rows:
        participants.append({
            "registrationId": reg.id,
            "studentId": user.id,
            "name": user.name,
            "email": user.email,
            "department": user.department,
            "rollNumber": user.roll_number,
            "registeredAt": str(reg.registered_at),
        })
    return participants


@router.post("/{event_id}/check-in")
async def event_check_in(
    event_id: int,
    req: CheckInRequest,
    current_user: dict = Depends(require_role("faculty", "admin")),
    db: AsyncSession = Depends(get_db),
):
    # Verify registration exists
    result = await db.execute(
        select(EventRegistration)
        .where(EventRegistration.event_id == event_id, EventRegistration.student_id == req.student_id)
    )
    reg = result.scalar_one_or_none()
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student is not registered for this event",
        )

    # Return success check-in (attended is simulated to be True)
    return {"message": "Student checked in successfully"}

