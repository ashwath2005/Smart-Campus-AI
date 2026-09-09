"""
Compatibility bridge for app.permissions -> app.core.security
"""
from app.core.security import Role, Permission, ROLE_PERMISSIONS, has_permission
