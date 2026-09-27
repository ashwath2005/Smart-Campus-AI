import { ROLES } from './roles';

export const PERMISSIONS = {
  // Study Materials
  MATERIAL_VIEW: 'material:view',
  MATERIAL_UPLOAD: 'material:upload',
  MATERIAL_EDIT: 'material:edit',
  MATERIAL_DELETE: 'material:delete',

  // Assignments
  ASSIGNMENT_VIEW: 'assignment:view',
  ASSIGNMENT_CREATE: 'assignment:create',
  ASSIGNMENT_SUBMIT: 'assignment:submit',
  ASSIGNMENT_GRADE: 'assignment:grade',

  // Attendance
  ATTENDANCE_VIEW_SELF: 'attendance:view_self',
  ATTENDANCE_VIEW_SECTION: 'attendance:view_section',
  ATTENDANCE_MARK: 'attendance:mark',

  // Timetable
  TIMETABLE_VIEW_SELF: 'timetable:view_self',
  TIMETABLE_VIEW_DEPT: 'timetable:view_dept',
  TIMETABLE_GENERATE: 'timetable:generate',

  // System & Admin
  USER_MANAGE: 'user:manage',
  DATA_IMPORT: 'data:import',
  SYSTEM_SETTINGS: 'system:settings',
  AUDIT_LOG_VIEW: 'audit:view',
};

export const ROLE_PERMISSIONS = {
  [ROLES.STUDENT]: [
    PERMISSIONS.MATERIAL_VIEW,
    PERMISSIONS.ASSIGNMENT_VIEW,
    PERMISSIONS.ASSIGNMENT_SUBMIT,
    PERMISSIONS.ATTENDANCE_VIEW_SELF,
    PERMISSIONS.TIMETABLE_VIEW_SELF,
  ],
  [ROLES.FACULTY]: [
    PERMISSIONS.MATERIAL_VIEW,
    PERMISSIONS.MATERIAL_UPLOAD,
    PERMISSIONS.MATERIAL_EDIT,
    PERMISSIONS.MATERIAL_DELETE,
    PERMISSIONS.ASSIGNMENT_VIEW,
    PERMISSIONS.ASSIGNMENT_CREATE,
    PERMISSIONS.ASSIGNMENT_GRADE,
    PERMISSIONS.ATTENDANCE_VIEW_SELF,
    PERMISSIONS.ATTENDANCE_VIEW_SECTION,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.TIMETABLE_VIEW_SELF,
  ],
  [ROLES.HOD]: [
    PERMISSIONS.MATERIAL_VIEW,
    PERMISSIONS.ASSIGNMENT_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW_SELF,
    PERMISSIONS.ATTENDANCE_VIEW_SECTION,
    PERMISSIONS.TIMETABLE_VIEW_SELF,
    PERMISSIONS.TIMETABLE_VIEW_DEPT,
  ],
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.SECURITY]: [],
  [ROLES.GUARDIAN]: [],
  [ROLES.WARDEN]: [
    PERMISSIONS.ATTENDANCE_VIEW_SELF,
    PERMISSIONS.ATTENDANCE_VIEW_SECTION,
  ],
};

export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function hasAnyPermission(role, permissionsList = []) {
  if (!role || !permissionsList.length) return false;
  return permissionsList.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role, permissionsList = []) {
  if (!role || !permissionsList.length) return false;
  return permissionsList.every((p) => hasPermission(role, p));
}

export default {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
};
