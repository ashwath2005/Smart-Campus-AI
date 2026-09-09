from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Set
from jose import jwt, JWTError
import bcrypt
from app.core.config import settings

# ─── Password Hashing ─────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


# ─── JWT Tokens ───────────────────────────────────────────────────────────────

def create_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a signed JWT token."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")


# ─── Role & Permissions ───────────────────────────────────────────────────────

class Role:
    STUDENT = "student"
    FACULTY = "faculty"
    HOD = "hod"
    ADMIN = "admin"
    SECURITY = "security"
    GUARDIAN = "guardian"


class Permission:
    # Study Materials
    MATERIAL_VIEW = "material:view"
    MATERIAL_UPLOAD = "material:upload"
    MATERIAL_EDIT = "material:edit"
    MATERIAL_DELETE = "material:delete"

    # Assignments
    ASSIGNMENT_VIEW = "assignment:view"
    ASSIGNMENT_CREATE = "assignment:create"
    ASSIGNMENT_SUBMIT = "assignment:submit"
    ASSIGNMENT_GRADE = "assignment:grade"

    # Attendance
    ATTENDANCE_VIEW_SELF = "attendance:view_self"
    ATTENDANCE_VIEW_SECTION = "attendance:view_section"
    ATTENDANCE_MARK = "attendance:mark"
    ATTENDANCE_VIEW_CHILD = "attendance:view_child"

    # Timetable
    TIMETABLE_VIEW_SELF = "timetable:view_self"
    TIMETABLE_VIEW_DEPT = "timetable:view_dept"
    TIMETABLE_GENERATE = "timetable:generate"

    # Gate Pass
    GATEPASS_REQUEST = "gatepass:request"
    GATEPASS_APPROVE = "gatepass:approve"
    GATEPASS_SCAN = "gatepass:scan"
    GATEPASS_POLICY_EDIT = "gatepass:policy_edit"
    GATEPASS_VIEW_CHILD = "gatepass:view_child"
    GATEPASS_APPROVE_CHILD = "gatepass:approve_child"

    # Security & Incident Management
    SECURITY_INCIDENT_CREATE = "security:incident_create"
    SECURITY_INCIDENT_VIEW = "security:incident_view"
    SECURITY_INCIDENT_RESOLVE = "security:incident_resolve"
    SECURITY_PERIMETER_VIEW = "security:perimeter_view"

    # Faculty & Campus Operations
    FACULTY_LOCATION_UPDATE = "faculty:location_update"
    CAMPUS_PULSE_VIEW = "campus_pulse:view"
    PLACEMENT_APPLY = "placement:apply"
    PLACEMENT_MANAGE = "placement:manage"
    FORUM_CREATE = "forum:create"
    FORUM_MODERATE = "forum:moderate"

    # Admin & System
    USER_MANAGE = "user:manage"
    DATA_IMPORT = "data:import"
    SYSTEM_SETTINGS = "system:settings"
    AUDIT_LOG_VIEW = "audit:view"


ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    Role.STUDENT: {
        Permission.MATERIAL_VIEW,
        Permission.ASSIGNMENT_VIEW,
        Permission.ASSIGNMENT_SUBMIT,
        Permission.ATTENDANCE_VIEW_SELF,
        Permission.TIMETABLE_VIEW_SELF,
        Permission.GATEPASS_REQUEST,
        Permission.PLACEMENT_APPLY,
        Permission.FORUM_CREATE,
        Permission.CAMPUS_PULSE_VIEW,
    },
    Role.FACULTY: {
        Permission.MATERIAL_VIEW,
        Permission.MATERIAL_UPLOAD,
        Permission.MATERIAL_EDIT,
        Permission.MATERIAL_DELETE,
        Permission.ASSIGNMENT_VIEW,
        Permission.ASSIGNMENT_CREATE,
        Permission.ASSIGNMENT_GRADE,
        Permission.ATTENDANCE_VIEW_SELF,
        Permission.ATTENDANCE_VIEW_SECTION,
        Permission.ATTENDANCE_MARK,
        Permission.TIMETABLE_VIEW_SELF,
        Permission.GATEPASS_APPROVE,
        Permission.FACULTY_LOCATION_UPDATE,
        Permission.CAMPUS_PULSE_VIEW,
        Permission.FORUM_CREATE,
    },
    Role.HOD: {
        Permission.MATERIAL_VIEW,
        Permission.MATERIAL_UPLOAD,
        Permission.MATERIAL_EDIT,
        Permission.MATERIAL_DELETE,
        Permission.ASSIGNMENT_VIEW,
        Permission.ASSIGNMENT_CREATE,
        Permission.ASSIGNMENT_GRADE,
        Permission.ATTENDANCE_VIEW_SELF,
        Permission.ATTENDANCE_VIEW_SECTION,
        Permission.ATTENDANCE_MARK,
        Permission.TIMETABLE_VIEW_SELF,
        Permission.TIMETABLE_VIEW_DEPT,
        Permission.TIMETABLE_GENERATE,
        Permission.GATEPASS_APPROVE,
        Permission.FACULTY_LOCATION_UPDATE,
        Permission.CAMPUS_PULSE_VIEW,
        Permission.FORUM_MODERATE,
        Permission.AUDIT_LOG_VIEW,
    },
    Role.ADMIN: {
        Permission.MATERIAL_VIEW,
        Permission.MATERIAL_UPLOAD,
        Permission.MATERIAL_EDIT,
        Permission.MATERIAL_DELETE,
        Permission.ASSIGNMENT_VIEW,
        Permission.ASSIGNMENT_CREATE,
        Permission.ASSIGNMENT_GRADE,
        Permission.ATTENDANCE_VIEW_SELF,
        Permission.ATTENDANCE_VIEW_SECTION,
        Permission.ATTENDANCE_MARK,
        Permission.ATTENDANCE_VIEW_CHILD,
        Permission.TIMETABLE_VIEW_SELF,
        Permission.TIMETABLE_VIEW_DEPT,
        Permission.TIMETABLE_GENERATE,
        Permission.GATEPASS_REQUEST,
        Permission.GATEPASS_APPROVE,
        Permission.GATEPASS_SCAN,
        Permission.GATEPASS_POLICY_EDIT,
        Permission.GATEPASS_VIEW_CHILD,
        Permission.GATEPASS_APPROVE_CHILD,
        Permission.SECURITY_INCIDENT_CREATE,
        Permission.SECURITY_INCIDENT_VIEW,
        Permission.SECURITY_INCIDENT_RESOLVE,
        Permission.SECURITY_PERIMETER_VIEW,
        Permission.FACULTY_LOCATION_UPDATE,
        Permission.CAMPUS_PULSE_VIEW,
        Permission.PLACEMENT_APPLY,
        Permission.PLACEMENT_MANAGE,
        Permission.FORUM_CREATE,
        Permission.FORUM_MODERATE,
        Permission.USER_MANAGE,
        Permission.DATA_IMPORT,
        Permission.SYSTEM_SETTINGS,
        Permission.AUDIT_LOG_VIEW,
    },
    Role.SECURITY: {
        Permission.GATEPASS_SCAN,
        Permission.SECURITY_INCIDENT_CREATE,
        Permission.SECURITY_INCIDENT_VIEW,
        Permission.SECURITY_INCIDENT_RESOLVE,
        Permission.SECURITY_PERIMETER_VIEW,
        Permission.CAMPUS_PULSE_VIEW,
    },
    Role.GUARDIAN: {
        Permission.ATTENDANCE_VIEW_SELF,
        Permission.ATTENDANCE_VIEW_CHILD,
        Permission.GATEPASS_APPROVE,
        Permission.GATEPASS_VIEW_CHILD,
        Permission.GATEPASS_APPROVE_CHILD,
        Permission.CAMPUS_PULSE_VIEW,
    },
}


def has_permission(user_role: str, permission: str) -> bool:
    """Check if a given user role possesses a specific permission."""
    role_perms = ROLE_PERMISSIONS.get(user_role.lower(), set())
    return permission in role_perms


def authorize(
    user: Dict[str, Any],
    permission: str,
    resource_owner_id: Optional[int] = None,
    target_dept: Optional[str] = None,
) -> bool:
    """
    Centralized authorization checker answering:
    'Can this user perform this action on this resource?'
    Enforces RBAC + Object-level data ownership.
    """
    role = (user.get("role") or "").lower()
    if role == Role.ADMIN:
        return True

    if not has_permission(role, permission):
        return False

    user_id = user.get("id")

    # Student object ownership
    if role == Role.STUDENT and resource_owner_id is not None:
        if user_id != resource_owner_id:
            return False

    # HOD department scope check
    if role == Role.HOD and target_dept:
        user_dept = (user.get("department") or "").lower()
        if user_dept and target_dept.lower() != user_dept:
            return False

    return True

