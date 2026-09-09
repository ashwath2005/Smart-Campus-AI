from typing import Callable, Dict, Any, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_token

security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_bearer),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    FastAPI dependency that extracts and validates the Bearer JWT token,
    verifies user existence in database, and returns user dict with roles.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(credentials.credentials)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("user_id") or payload.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token: missing user identity",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from app.models.user import User
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department": user.department,
        "roll_number": user.roll_number,
        "semester": user.semester,
        "section": user.section,
        "phone_number": user.phone_number,
        "advisor_id": getattr(user, "advisor_id", None),
        "guardian_id": getattr(user, "guardian_id", None),
    }


def require_role(*allowed_roles: str) -> Callable:
    """
    RBAC dependency factory that checks if the authenticated user has one of the allowed roles.
    """
    normalized_roles = [r.lower() for r in allowed_roles]

    async def role_checker(
        current_user: Dict[str, Any] = Depends(get_current_user),
    ) -> Dict[str, Any]:
        user_role = (current_user.get("role") or "").lower()
        if user_role not in normalized_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_roles}, but current role is '{user_role}'",
            )
        return current_user

    return role_checker


def require_permission(permission: str) -> Callable:
    """
    Fine-grained permission dependency factory that verifies if the user's role has the given permission.
    """
    from app.core.security import has_permission

    async def permission_checker(
        current_user: Dict[str, Any] = Depends(get_current_user),
    ) -> Dict[str, Any]:
        user_role = (current_user.get("role") or "").lower()
        if user_role != "admin" and not has_permission(user_role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: permission '{permission}' is required.",
            )
        return current_user

    return permission_checker

