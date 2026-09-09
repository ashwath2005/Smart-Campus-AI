from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models.user import Announcement, User
from app.middleware.auth_middleware import get_current_user
from app.middleware.role_checker import require_role

router = APIRouter(prefix="/announcements", tags=["Announcements"])


# ─── Pydantic Request Models ──────────────────────────────────────────────────


class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target_role: Optional[str] = "all"  # "all", "student", "faculty"
    target_dept: Optional[str] = "all"  # "all", "CSE", "ECE", "ME", "CE"
    is_emergency: Optional[bool] = False


# ─── Endpoints ───────────────────────────────────────────────────────────────


@router.get("")
@router.get("/")
async def list_announcements(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Announcement, User).join(User, Announcement.created_by == User.id)
    
    # Filter based on target audience for non-admin users
    if current_user["role"] != "admin":
        user_role = current_user["role"]
        user_dept = current_user.get("department") or "all"
        
        query = query.where(
            and_(
                or_(Announcement.target_role == "all", Announcement.target_role == user_role),
                or_(Announcement.target_dept == "all", Announcement.target_dept == user_dept)
            )
        )
        
    query = query.order_by(Announcement.created_at.desc())
    result = await db.execute(query)
    rows = result.all()

    announcements = []
    for announcement, user in rows:
        announcements.append({
            "id": announcement.id,
            "title": announcement.title,
            "content": announcement.content,
            "postedBy": user.name,
            "authorName": user.name,
            "targetRole": announcement.target_role,
            "targetDept": announcement.target_dept,
            "isEmergency": announcement.is_emergency,
            "type": "emergency" if announcement.is_emergency else "general",
            "priority": "high" if announcement.is_emergency or "emergency" in announcement.title.lower() else "medium",
            "createdAt": str(announcement.created_at) if announcement.created_at else None,
        })

    return announcements


@router.post("")
@router.post("/")
async def create_announcement(
    req: AnnouncementCreate,
    current_user: dict = Depends(require_role("admin", "faculty")),
    db: AsyncSession = Depends(get_db),
):
    announcement = Announcement(
        title=req.title,
        content=req.content,
        created_by=current_user["id"],
        target_role=req.target_role,
        target_dept=req.target_dept,
        is_emergency=req.is_emergency,
    )
    db.add(announcement)
    await db.flush()
    await db.refresh(announcement)

    # Auto-create corresponding notification for targeted real-time alerts
    try:
        from app.models.communication import Notification
        from app.utils.websocket_manager import manager
        
        notification = Notification(
            title=f"New Notice: {req.title}",
            message=req.content[:200] + ("..." if len(req.content) > 200 else ""),
            category="announcement",
            priority="high" if req.is_emergency else "normal",
            target_role=req.target_role if req.target_role != "all" else None,
            department=req.target_dept if req.target_dept != "all" else None,
            created_by=current_user["id"]
        )
        db.add(notification)
        await db.flush()
        
        # Broadcast real-time websocket alert
        await manager.broadcast({
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "category": notification.category,
            "priority": notification.priority,
            "target_role": req.target_role,
            "department": req.target_dept,
            "createdAt": str(notification.created_at) if notification.created_at else None,
            "postedBy": current_user["name"]
        })
    except Exception as e:
        print(f"Announcement notification auto-creation/broadcast failed: {e}")

    return {
        "id": announcement.id,
        "title": announcement.title,
        "message": "Announcement created successfully",
    }


@router.get("/emergency")
async def get_emergency_alerts(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Filter announcements by emergency status or keyword triggers
    query = select(Announcement, User).join(User, Announcement.created_by == User.id).where(
        or_(
            Announcement.is_emergency == True,
            Announcement.title.ilike("%emergency%"),
            Announcement.title.ilike("%urgent%"),
            Announcement.content.ilike("%emergency%")
        )
    )
    
    # Filter based on target audience for non-admin users
    if current_user["role"] != "admin":
        user_role = current_user["role"]
        user_dept = current_user.get("department") or "all"
        
        query = query.where(
            and_(
                or_(Announcement.target_role == "all", Announcement.target_role == user_role),
                or_(Announcement.target_dept == "all", Announcement.target_dept == user_dept)
            )
        )
        
    query = query.order_by(Announcement.created_at.desc())
    result = await db.execute(query)
    rows = result.all()

    alerts = []
    for announcement, user in rows:
        alerts.append({
            "id": announcement.id,
            "title": announcement.title,
            "content": announcement.content,
            "postedBy": user.name,
            "authorName": user.name,
            "targetRole": announcement.target_role,
            "targetDept": announcement.target_dept,
            "isEmergency": announcement.is_emergency,
            "type": "emergency",
            "priority": "urgent",
            "createdAt": str(announcement.created_at) if announcement.created_at else None,
        })
    return alerts
