from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, and_, or_, delete
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.database import get_db
from app.models.communication import Notification, NotificationRead
from app.middleware.auth_middleware import get_current_user
from app.middleware.role_checker import require_role
from app.utils.websocket_manager import manager as ws_manager

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ─── Pydantic Schemas ────────────────────────────────────────────────────────


class CreateNotificationRequest(BaseModel):
    title: str
    message: str
    category: str  # academic|assignment|attendance|event|placement|emergency|announcement
    priority: str = "normal"  # low|normal|high|emergency
    target_role: Optional[str] = None
    department: Optional[str] = None
    target_year: Optional[int] = None
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None  # for scheduling
    expires_at: Optional[datetime] = None
    auto_format: Optional[bool] = False


class EditNotificationRequest(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    target_role: Optional[str] = None
    department: Optional[str] = None
    target_year: Optional[int] = None
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


# ─── Endpoints ───────────────────────────────────────────────────────────────


@router.get("")
@router.get("/")
async def get_notifications(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    is_read: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get notifications matching target rules for the user.
    Admin gets all notifications in the system to enable search/filtering/edit/delete.
    """
    user_id = current_user["id"]
    user_role = current_user["role"]
    user_dept = current_user.get("department")
    user_sem = current_user.get("semester")

    # Calculate student year
    user_year = None
    if user_role == "student" and user_sem:
        user_year = (int(user_sem) + 1) // 2

    now = datetime.now()

    if user_role == "admin":
        # Admin view: see everything (including scheduled and expired)
        query = select(Notification)
        if category:
            query = query.where(Notification.category == category)
        if priority:
            query = query.where(Notification.priority == priority)
        if search:
            query = query.where(
                (Notification.title.ilike(f"%{search}%"))
                | (Notification.message.ilike(f"%{search}%"))
            )
        query = query.order_by(Notification.created_at.desc())
        result = await db.execute(query)
        notifications = result.scalars().all()

        return [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "category": n.category,
                "notification_type": n.category,  # Compatibility
                "priority": n.priority,
                "target_role": n.target_role,
                "department": n.department,
                "target_year": n.target_year,
                "user_id": n.user_id,
                "created_by": n.created_by,
                "created_at": str(n.created_at) if n.created_at else None,
                "expires_at": str(n.expires_at) if n.expires_at else None,
                "is_read": False,
            }
            for n in notifications
        ]

    # Faculty & Student view: filter based on target audience
    conditions = []
    conditions.append(or_(Notification.target_role.is_(None), Notification.target_role == user_role))
    conditions.append(or_(Notification.department.is_(None), Notification.department == user_dept))
    
    if user_role == "student" and user_year is not None:
        conditions.append(or_(Notification.target_year.is_(None), Notification.target_year == user_year))
    else:
        conditions.append(Notification.target_year.is_(None))
        
    conditions.append(or_(Notification.user_id.is_(None), Notification.user_id == user_id))

    # Join NotificationRead to fetch read status
    query = (
        select(Notification, NotificationRead.is_read)
        .outerjoin(
            NotificationRead,
            and_(
                NotificationRead.notification_id == Notification.id,
                NotificationRead.user_id == user_id
            )
        )
        .where(and_(*conditions))
        .where(Notification.created_at <= now)  # filter out scheduled notifications
        .where(or_(Notification.expires_at.is_(None), Notification.expires_at >= now))
        .where(or_(NotificationRead.is_deleted.is_(None), NotificationRead.is_deleted == False))
    )

    if category:
        query = query.where(Notification.category == category)
    if priority:
        query = query.where(Notification.priority == priority)
    if is_read is not None:
        if is_read:
            query = query.where(NotificationRead.is_read == True)
        else:
            query = query.where(or_(NotificationRead.is_read.is_(None), NotificationRead.is_read == False))
    if search:
        query = query.where(
            (Notification.title.ilike(f"%{search}%"))
            | (Notification.message.ilike(f"%{search}%"))
        )

    query = query.order_by(Notification.created_at.desc())
    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "id": row[0].id,
            "title": row[0].title,
            "message": row[0].message,
            "category": row[0].category,
            "notification_type": row[0].category,  # Compatibility
            "priority": row[0].priority,
            "target_role": row[0].target_role,
            "department": row[0].department,
            "target_year": row[0].target_year,
            "created_at": str(row[0].created_at) if row[0].created_at else None,
            "expires_at": str(row[0].expires_at) if row[0].expires_at else None,
            "is_read": row[1] if row[1] is not None else False,
        }
        for row in rows
    ]


@router.post("")
@router.post("/")
async def create_notification(
    req: CreateNotificationRequest,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    created_time = req.created_at or datetime.now()

    final_title = req.title
    final_message = req.message
    email_subject = req.title
    email_body = f"<p>{req.message}</p>"
    push_alert = req.message[:100]

    if req.auto_format:
        from app.services.gemini_service import format_smart_notification
        try:
            formats = await format_smart_notification(req.title, req.message, req.category)
            final_title = formats.get("title", req.title)
            final_message = formats.get("announcement", req.message)
            email_subject = formats.get("email_subject", req.title)
            email_body = formats.get("email_body", email_body)
            push_alert = formats.get("push_alert", push_alert)
        except Exception:
            pass

    notification = Notification(
        title=final_title,
        message=final_message,
        category=req.category,
        priority=req.priority,
        target_role=req.target_role,
        department=req.department,
        target_year=req.target_year,
        user_id=req.user_id,
        created_by=current_user["id"],
        created_at=created_time,
        expires_at=req.expires_at,
    )
    db.add(notification)
    await db.flush()
    await db.refresh(notification)

    # If scheduled for now/past, broadcast instantly
    if created_time <= datetime.now():
        ws_payload = {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "category": notification.category,
            "notification_type": notification.category,
            "priority": notification.priority,
            "target_role": notification.target_role,
            "department": notification.department,
            "target_year": notification.target_year,
            "user_id": notification.user_id,
            "created_at": notification.created_at,
            "expires_at": notification.expires_at,
            "email_subject": email_subject,
            "email_body": email_body,
            "push_alert": push_alert,
        }
        await ws_manager.broadcast_notification(ws_payload)

    return {
        "id": notification.id,
        "title": notification.title,
        "message": "Notification created and formatted successfully",
    }


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user["id"]
    
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    # Insert or update read entry
    result = await db.execute(
        select(NotificationRead).where(
            NotificationRead.notification_id == notification_id,
            NotificationRead.user_id == user_id
        )
    )
    read_entry = result.scalar_one_or_none()
    if not read_entry:
        read_entry = NotificationRead(
            notification_id=notification_id,
            user_id=user_id,
            is_read=True,
            read_at=datetime.now()
        )
        db.add(read_entry)
    else:
        read_entry.is_read = True
        read_entry.read_at = datetime.now()
        
    await db.flush()
    return {"message": "Notification marked as read"}


@router.put("/read-all")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user["id"]
    user_role = current_user["role"]
    user_dept = current_user.get("department")
    user_sem = current_user.get("semester")

    user_year = None
    if user_role == "student" and user_sem:
        user_year = (int(user_sem) + 1) // 2

    now = datetime.now()
    conditions = []
    conditions.append(or_(Notification.target_role.is_(None), Notification.target_role == user_role))
    conditions.append(or_(Notification.department.is_(None), Notification.department == user_dept))
    
    if user_role == "student" and user_year is not None:
        conditions.append(or_(Notification.target_year.is_(None), Notification.target_year == user_year))
    else:
        conditions.append(Notification.target_year.is_(None))
        
    conditions.append(or_(Notification.user_id.is_(None), Notification.user_id == user_id))

    # Fetch all currently unread notifications targeted at this user
    unread_query = (
        select(Notification.id)
        .outerjoin(
            NotificationRead,
            and_(
                NotificationRead.notification_id == Notification.id,
                NotificationRead.user_id == user_id
            )
        )
        .where(and_(*conditions))
        .where(Notification.created_at <= now)
        .where(or_(Notification.expires_at.is_(None), Notification.expires_at >= now))
        .where(or_(NotificationRead.is_read.is_(None), NotificationRead.is_read == False))
        .where(or_(NotificationRead.is_deleted.is_(None), NotificationRead.is_deleted == False))
    )
    
    res = await db.execute(unread_query)
    unread_ids = [row[0] for row in res.all()]

    for nid in unread_ids:
        read_res = await db.execute(
            select(NotificationRead).where(
                NotificationRead.notification_id == nid,
                NotificationRead.user_id == user_id
            )
        )
        entry = read_res.scalar_one_or_none()
        if not entry:
            entry = NotificationRead(
                notification_id=nid,
                user_id=user_id,
                is_read=True,
                read_at=datetime.now()
            )
            db.add(entry)
        else:
            entry.is_read = True
            entry.read_at = datetime.now()

    await db.flush()
    return {"message": "All notifications marked as read"}


@router.get("/unread-count")
async def get_unread_count(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user["id"]
    user_role = current_user["role"]
    user_dept = current_user.get("department")
    user_sem = current_user.get("semester")

    user_year = None
    if user_role == "student" and user_sem:
        user_year = (int(user_sem) + 1) // 2

    now = datetime.now()
    conditions = []
    conditions.append(or_(Notification.target_role.is_(None), Notification.target_role == user_role))
    conditions.append(or_(Notification.department.is_(None), Notification.department == user_dept))
    
    if user_role == "student" and user_year is not None:
        conditions.append(or_(Notification.target_year.is_(None), Notification.target_year == user_year))
    else:
        conditions.append(Notification.target_year.is_(None))
        
    conditions.append(or_(Notification.user_id.is_(None), Notification.user_id == user_id))

    unread_count_query = (
        select(func.count(Notification.id))
        .outerjoin(
            NotificationRead,
            and_(
                NotificationRead.notification_id == Notification.id,
                NotificationRead.user_id == user_id
            )
        )
        .where(and_(*conditions))
        .where(Notification.created_at <= now)
        .where(or_(Notification.expires_at.is_(None), Notification.expires_at >= now))
        .where(or_(NotificationRead.is_read.is_(None), NotificationRead.is_read == False))
        .where(or_(NotificationRead.is_deleted.is_(None), NotificationRead.is_deleted == False))
    )
    count = (await db.execute(unread_count_query)).scalar() or 0

    return {"unread_count": count}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user["id"]
    user_role = current_user["role"]

    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    # Admins delete globally
    if user_role == "admin":
        await db.execute(
            delete(Notification).where(Notification.id == notification_id)
        )
        await db.flush()
        return {"message": "Notification deleted globally"}
    
    # Students and Faculty delete locally for themselves (soft delete)
    else:
        result = await db.execute(
            select(NotificationRead).where(
                NotificationRead.notification_id == notification_id,
                NotificationRead.user_id == user_id
            )
        )
        read_entry = result.scalar_one_or_none()
        if not read_entry:
            read_entry = NotificationRead(
                notification_id=notification_id,
                user_id=user_id,
                is_read=True,
                read_at=datetime.now(),
                is_deleted=True
            )
            db.add(read_entry)
        else:
            read_entry.is_deleted = True
            
        await db.flush()
        return {"message": "Notification dismissed successfully"}


@router.put("/{notification_id}")
async def edit_notification(
    notification_id: int,
    req: EditNotificationRequest,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    if req.title is not None:
        notification.title = req.title
    if req.message is not None:
        notification.message = req.message
    if req.category is not None:
        notification.category = req.category
    if req.priority is not None:
        notification.priority = req.priority
    if req.target_role is not None:
        notification.target_role = req.target_role
    if req.department is not None:
        notification.department = req.department
    if req.target_year is not None:
        notification.target_year = req.target_year
    if req.user_id is not None:
        notification.user_id = req.user_id
    if req.created_at is not None:
        notification.created_at = req.created_at
    if req.expires_at is not None:
        notification.expires_at = req.expires_at

    await db.flush()
    return {"message": "Notification updated successfully"}
