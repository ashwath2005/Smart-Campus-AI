import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { ROLES, ROLE_DEFAULT_REDIRECTS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';

// Code-Split Dynamic Route Imports
export const Login = lazy(() => import('../../pages/auth/Login').then(m => ({ default: m.Login })));
export const Register = lazy(() => import('../../pages/auth/Register').then(m => ({ default: m.Register })));
export const ForgotPassword = lazy(() => import('../../pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
export const ChangePassword = lazy(() => import('../../pages/auth/ChangePassword').then(m => ({ default: m.ChangePassword })));

export const StudentDashboard = lazy(() => import('../../pages/student/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
export const Attendance = lazy(() => import('../../pages/student/Attendance').then(m => ({ default: m.Attendance })));
export const Timetable = lazy(() => import('../../pages/student/Timetable').then(m => ({ default: m.Timetable })));
export const Assignments = lazy(() => import('../../pages/student/Assignments').then(m => ({ default: m.Assignments })));
export const StudyMaterials = lazy(() => import('../../pages/student/StudyMaterials').then(m => ({ default: m.StudyMaterials })));
export const InternalMarks = lazy(() => import('../../pages/student/InternalMarks').then(m => ({ default: m.InternalMarks })));
export const SemesterResults = lazy(() => import('../../pages/student/SemesterResults').then(m => ({ default: m.SemesterResults })));
export const GatePass = lazy(() => import('../../pages/student/GatePass').then(m => ({ default: m.GatePass })));
export const StudentWorkflows = lazy(() => import('../../pages/student/StudentWorkflows').then(m => ({ default: m.StudentWorkflows })));
export const AcademicPredictor = lazy(() => import('../../pages/student/AcademicPredictor').then(m => ({ default: m.AcademicPredictor })));
export const GateSecurity = lazy(() => import('../../pages/security/GateSecurity').then(m => ({ default: m.GateSecurity })));
export const GuardianGatePass = lazy(() => import('../../pages/guardian/GuardianGatePass').then(m => ({ default: m.GuardianGatePass })));
export const GatePassAdmin = lazy(() => import('../../pages/admin/GatePassAdmin').then(m => ({ default: m.GatePassAdmin })));
export const HodDashboard = lazy(() => import('../../pages/admin/HodDashboard').then(m => ({ default: m.HodDashboard })));

export const FacultyDashboard = lazy(() => import('../../pages/faculty/FacultyDashboard').then(m => ({ default: m.FacultyDashboard })));
export const FacultyLocator = lazy(() => import('../../pages/faculty/FacultyLocator').then(m => ({ default: m.FacultyLocator })));

export const AdminDashboard = lazy(() => import('../../pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
export const AdminDataImport = lazy(() => import('../../pages/admin/AdminDataImport').then(m => ({ default: m.AdminDataImport })));
export const AdminCoreHub = lazy(() => import('../../pages/admin/AdminCoreHub').then(m => ({ default: m.AdminCoreHub })));
export const AdminTimetableGenerator = lazy(() => import('../../pages/admin/AdminTimetableGenerator').then(m => ({ default: m.AdminTimetableGenerator })));

export const AcademicCalendar = lazy(() => import('../../pages/shared/AcademicCalendar').then(m => ({ default: m.AcademicCalendar })));
export const Events = lazy(() => import('../../pages/shared/Events').then(m => ({ default: m.Events })));
export const Placements = lazy(() => import('../../pages/shared/Placements').then(m => ({ default: m.Placements })));
export const CompanyProfiles = lazy(() => import('../../pages/shared/CompanyProfiles').then(m => ({ default: m.CompanyProfiles })));
export const Notifications = lazy(() => import('../../pages/shared/Notifications').then(m => ({ default: m.Notifications })));
export const AIAssistant = lazy(() => import('../../pages/shared/AIAssistant').then(m => ({ default: m.AIAssistant })));
export const Announcements = lazy(() => import('../../pages/shared/Announcements').then(m => ({ default: m.Announcements })));
export const Profile = lazy(() => import('../../pages/shared/Profile').then(m => ({ default: m.Profile })));
export const NotFound = lazy(() => import('../../pages/shared/NotFound').then(m => ({ default: m.NotFound })));
export const Forum = lazy(() => import('../../pages/shared/Forum').then(m => ({ default: m.Forum })));
export const ForumPost = lazy(() => import('../../pages/shared/ForumPost').then(m => ({ default: m.ForumPost })));
export const LandingPage = lazy(() => import('../../pages/shared/LandingPage').then(m => ({ default: m.LandingPage })));
export const CampusPulse = lazy(() => import('../../features/campusPulse/CampusPulse'));

export const PageLoader = () => (
  <div className="flex min-h-[60vh] w-full items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500" />
      <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
        Loading Campus Operations...
      </span>
    </div>
  </div>
);

// Role redirection helper
export const RoleHomeRedirect = () => {
  const stored = localStorage.getItem('campus_user');
  if (!stored) return <Navigate to={ROUTES.LOGIN} replace />;
  try {
    const parsed = JSON.parse(stored);
    const role = parsed.role;
    const dest = ROLE_DEFAULT_REDIRECTS[role] || ROUTES.LOGIN;
    return <Navigate to={dest} replace />;
  } catch {
    // fallback
  }
  return <Navigate to={ROUTES.LOGIN} replace />;
};
