/**
 * Canonical Application User Roles
 */
export const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  HOD: 'hod',
  WARDEN: 'warden',
  SECURITY: 'security',
  GUARDIAN: 'guardian',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.FACULTY]: 'Faculty Member',
  [ROLES.HOD]: 'Head of Department',
  [ROLES.WARDEN]: 'Hostel Warden',
  [ROLES.SECURITY]: 'Security Officer',
  [ROLES.GUARDIAN]: 'Parent / Guardian',
  [ROLES.ADMIN]: 'System Administrator',
};

export const ROLE_DEFAULT_REDIRECTS = {
  [ROLES.STUDENT]: '/dashboard',
  [ROLES.FACULTY]: '/faculty',
  [ROLES.HOD]: '/hod',
  [ROLES.WARDEN]: '/warden/dashboard',
  [ROLES.SECURITY]: '/gate-security',
  [ROLES.GUARDIAN]: '/guardian-gate-pass',
  [ROLES.ADMIN]: '/admin',
};

export default ROLES;
