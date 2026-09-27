/**
 * Centralized API Endpoint Definitions
 */
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    CHANGE_PASSWORD: '/auth/change-password',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  STUDENTS: {
    BASE: '/students',
    PROFILE: (id) => `/students/${id}`,
    WORKFLOWS: '/student/workflows',
    RESULTS: '/students/results',
    INTERNAL_MARKS: '/internal-marks',
  },
  FACULTY: {
    BASE: '/faculty',
    LOCATOR: '/faculty-locator',
    STATUS: '/faculty-locator/status',
  },
  ATTENDANCE: {
    BASE: '/attendance',
    SUMMARY: '/attendance/summary',
    STUDENT: (id) => `/attendance/student/${id}`,
  },
  TIMETABLE: {
    BASE: '/timetable',
    TODAY: '/timetable/today',
    SECTION: (sec) => `/timetable/section/${sec}`,
    GENERATE: '/timetable/generate',
  },
  ASSIGNMENTS: {
    BASE: '/assignments',
    SUBMIT: (id) => `/assignments/${id}/submit`,
  },
  STUDY_MATERIALS: {
    BASE: '/study-materials',
    SEARCH: '/study-materials/search',
  },
  GATE_PASS: {
    BASE: '/gate-pass',
    STUDENT: '/gate-pass/student',
    REQUEST: '/gate-pass/request',
    APPROVE: (id) => `/gate-pass/${id}/approve`,
    SECURITY_VERIFY: '/gate-pass/verify',
    GUARDIAN: '/guardian/gate-pass',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id) => `/notifications/${id}/read`,
  },
  ACADEMIC: {
    CALENDAR: '/events/calendar',
    PREDICTOR: '/academic-predictor/predict',
  },
  EVENTS: {
    BASE: '/events',
    UPCOMING: '/events/upcoming',
  },
  FORUM: {
    POSTS: '/forum/posts',
    POST: (id) => `/forum/posts/${id}`,
    COMMENTS: (id) => `/forum/posts/${id}/comments`,
  },
  PLACEMENTS: {
    DRIVES: '/placements/drives',
    COMPANIES: '/placements/companies',
    APPLY: (id) => `/placements/drives/${id}/apply`,
    MATCHMAKER: '/placement-matchmaker',
  },
  CAMPUS_PULSE: {
    BASE: '/campus-pulse',
    METRICS: '/campus-pulse/metrics',
    BUILDINGS: '/campus-pulse/buildings',
    ALERTS: '/campus-pulse/alerts',
  },
  AI: {
    ASSISTANT: '/ai/chat',
    COPILOT: '/ai-copilot/query',
    PREDICTIONS: '/ai/predictions',
  },
  ADMIN: {
    DASHBOARD: '/admin/stats',
    DATA_IMPORT: '/admin/data-import',
    CORE_HUB: '/admin/core-hub',
  },
};

export default ENDPOINTS;
