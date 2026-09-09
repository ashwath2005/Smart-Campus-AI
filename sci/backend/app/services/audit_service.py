from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog

async def log_audit_event(
    db: AsyncSession,
    user_id: int,
    user_email: str,
    role: str,
    action: str,
    resource: str,
    details: str = None,
    status_code: int = 200
):
    """Records an audit log entry for sensitive system actions."""
    try:
        log_entry = AuditLog(
            user_id=user_id,
            user_email=user_email,
            role=role,
            action=action,
            resource=resource,
            details=details,
            status_code=status_code
        )
        db.add(log_entry)
        await db.commit()
    except Exception as e:
        print(f"[AuditLogger Error]: Failed to write audit log: {e}")
        await db.rollback()
