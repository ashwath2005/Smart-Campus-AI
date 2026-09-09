from fastapi import Depends, HTTPException, status
from app.middleware.auth_middleware import get_current_user
from app.permissions import has_permission

def require_role(*roles: str):
    """Dependency factory that checks if the current user has one of the required roles."""
    async def role_dependency(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role", "").lower()
        allowed_roles = [r.lower() for r in roles]
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action forbidden for role '{user_role}'. Required role(s): {', '.join(roles)}",
            )
        return current_user

    return role_dependency


def require_permission(permission: str):
    """Dependency factory that checks if the current user has the explicit permission."""
    async def permission_dependency(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role", "").lower()
        if not has_permission(user_role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Role '{user_role}' lacks permission '{permission}'",
            )
        return current_user

    return permission_dependency
