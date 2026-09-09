"""
Smart Campus AI - Core Package
Contains core application configuration, database connection, security, and dependencies.
"""

from app.core.config import (
    settings,
    DATABASE_URL,
    JWT_SECRET,
    JWT_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_HOST,
    MYSQL_PORT,
    MYSQL_DATABASE,
    GEMINI_API_KEY,
)
from app.core.database import Base, engine, async_session, get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_token,
    decode_token,
    Role,
    Permission,
    ROLE_PERMISSIONS,
    has_permission,
)
from app.core.dependencies import get_current_user, require_role

__all__ = [
    "settings",
    "DATABASE_URL",
    "JWT_SECRET",
    "JWT_ALGORITHM",
    "ACCESS_TOKEN_EXPIRE_MINUTES",
    "REFRESH_TOKEN_EXPIRE_DAYS",
    "MYSQL_USER",
    "MYSQL_PASSWORD",
    "MYSQL_HOST",
    "MYSQL_PORT",
    "MYSQL_DATABASE",
    "GEMINI_API_KEY",
    "Base",
    "engine",
    "async_session",
    "get_db",
    "hash_password",
    "verify_password",
    "create_token",
    "decode_token",
    "Role",
    "Permission",
    "ROLE_PERMISSIONS",
    "has_permission",
    "get_current_user",
    "require_role",
]
