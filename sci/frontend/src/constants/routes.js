/**
 * Application Route Paths
 */
export const ROUTES = {
  // Public
  ROOT: '/',
  LANDING: '/landing',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  CHANGE_PASSWORD: '/change-password',

  // Student
  STUDENT_DASHBOARD: '/dashboard',
  ATTENDANCE: '/attendance',
  TIMETABLE: '/timetable',
  ASSIGNMENTS: '/assignments',
  STUDY_MATERIALS: '/study-materials',
  INTERNAL_MARKS: '/internal-marks',
  RESULTS: '/results',
  GATE_PASS: '/gate-pass',
  WORKFLOWS: '/workflows',
  STUDENT_WORKFLOWS: '/student/workflows',
  LEAVE: '/leave',
  LEAVES: '/leaves',
  MY_STATUS: '/my-status',
  ACADEMIC_PREDICTOR: '/academic-predictor',

  // Faculty
  FACULTY_DASHBOARD: '/faculty',
  FACULTY_LOCATOR: '/faculty-locator',

  // Administration
  ADMIN_DASHBOARD: '/admin',
  ADMIN_DATA_IMPORT: '/admin/data-import',
  ADMIN_CORE_HUB: '/admin/core-hub',
  ADMIN_TIMETABLE_GENERATOR: '/admin/timetable-generator',
  GATE_PASS_ADMIN: '/gate-pass-admin',
  HOD_DASHBOARD: '/hod',

  // Warden
  WARDEN_DASHBOARD: '/warden/dashboard',
  WARDEN_ALIAS: '/warden',
  WARDEN_LEAVES: '/warden/leaves',
  WARDEN_PROFILE: '/warden/profile',

  // Security & Guardian
  GATE_SECURITY: '/gate-security',
  SECURITY_GATE_ALIAS: '/security/gate',
  GUARDIAN_GATE_PASS: '/guardian-gate-pass',
  GUARDIAN_DASHBOARD: '/guardian/dashboard',
  GUARDIAN_GATE_ALIAS: '/guardian/gate-pass',

  // Shared Features
  ACADEMIC_CALENDAR: '/calendar',
  EVENTS: '/events',
  PLACEMENTS: '/placements',
  COMPANY_PROFILES: '/company-profiles',
  NOTIFICATIONS: '/notifications',
  AI_ASSISTANT: '/ai-assistant',
  ANNOUNCEMENTS: '/announcements',
  FORUM: '/forum',
  FORUM_POST: '/forum/:postId',
  PROFILE: '/profile',
  CAMPUS_PULSE: '/campus-pulse',

  // Wildcard
  NOT_FOUND: '*',
};

export default ROUTES;
