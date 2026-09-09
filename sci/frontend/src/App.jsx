import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
import { Layout } from './components/Layout/Layout';
import { OfflineIndicator } from './components/OfflineIndicator/OfflineIndicator';

// Code-Split Dynamic Route Imports
const Login = lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/auth/Register').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ChangePassword = lazy(() => import('./pages/auth/ChangePassword').then(m => ({ default: m.ChangePassword })));

const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const Attendance = lazy(() => import('./pages/student/Attendance').then(m => ({ default: m.Attendance })));
const Timetable = lazy(() => import('./pages/student/Timetable').then(m => ({ default: m.Timetable })));
const Assignments = lazy(() => import('./pages/student/Assignments').then(m => ({ default: m.Assignments })));
const StudyMaterials = lazy(() => import('./pages/student/StudyMaterials').then(m => ({ default: m.StudyMaterials })));
const InternalMarks = lazy(() => import('./pages/student/InternalMarks').then(m => ({ default: m.InternalMarks })));
const SemesterResults = lazy(() => import('./pages/student/SemesterResults').then(m => ({ default: m.SemesterResults })));
const GatePass = lazy(() => import('./pages/student/GatePass').then(m => ({ default: m.GatePass })));
const StudentWorkflows = lazy(() => import('./pages/student/StudentWorkflows').then(m => ({ default: m.StudentWorkflows })));
const AcademicPredictor = lazy(() => import('./pages/student/AcademicPredictor').then(m => ({ default: m.AcademicPredictor })));
const GateSecurity = lazy(() => import('./pages/security/GateSecurity').then(m => ({ default: m.GateSecurity })));
const GuardianGatePass = lazy(() => import('./pages/guardian/GuardianGatePass').then(m => ({ default: m.GuardianGatePass })));
const GatePassAdmin = lazy(() => import('./pages/admin/GatePassAdmin').then(m => ({ default: m.GatePassAdmin })));

const FacultyDashboard = lazy(() => import('./pages/faculty/FacultyDashboard').then(m => ({ default: m.FacultyDashboard })));
const FacultyLocator = lazy(() => import('./pages/faculty/FacultyLocator').then(m => ({ default: m.FacultyLocator })));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminDataImport = lazy(() => import('./pages/admin/AdminDataImport').then(m => ({ default: m.AdminDataImport })));
const AdminCoreHub = lazy(() => import('./pages/admin/AdminCoreHub').then(m => ({ default: m.AdminCoreHub })));
const AdminTimetableGenerator = lazy(() => import('./pages/admin/AdminTimetableGenerator').then(m => ({ default: m.AdminTimetableGenerator })));
const HodDashboard = lazy(() => import('./pages/admin/HodDashboard').then(m => ({ default: m.HodDashboard })));

const AcademicCalendar = lazy(() => import('./pages/shared/AcademicCalendar').then(m => ({ default: m.AcademicCalendar })));
const Events = lazy(() => import('./pages/shared/Events').then(m => ({ default: m.Events })));
const Placements = lazy(() => import('./pages/shared/Placements').then(m => ({ default: m.Placements })));
const CompanyProfiles = lazy(() => import('./pages/shared/CompanyProfiles').then(m => ({ default: m.CompanyProfiles })));
const Notifications = lazy(() => import('./pages/shared/Notifications').then(m => ({ default: m.Notifications })));
const AIAssistant = lazy(() => import('./pages/shared/AIAssistant').then(m => ({ default: m.AIAssistant })));
const Profile = lazy(() => import('./pages/shared/Profile').then(m => ({ default: m.Profile })));
const NotFound = lazy(() => import('./pages/shared/NotFound').then(m => ({ default: m.NotFound })));
const Forum = lazy(() => import('./pages/shared/Forum').then(m => ({ default: m.Forum })));
const ForumPost = lazy(() => import('./pages/shared/ForumPost').then(m => ({ default: m.ForumPost })));
const LandingPage = lazy(() => import('./pages/shared/LandingPage').then(m => ({ default: m.LandingPage })));
const CampusPulse = lazy(() => import('./features/campusPulse/CampusPulse'));

const PageLoader = () => (
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
const RoleHomeRedirect = () => {
  const stored = localStorage.getItem('campus_user');
  if (!stored) return <Navigate to="/login" replace />;
  try {
    const parsed = JSON.parse(stored);
    const role = parsed.role;
    if (role === 'student') return <Navigate to="/dashboard" replace />;
    if (role === 'faculty') return <Navigate to="/faculty" replace />;
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'hod') return <Navigate to="/hod" replace />;
    if (role === 'security') return <Navigate to="/gate-security" replace />;
    if (role === 'guardian') return <Navigate to="/guardian-gate-pass" replace />;
  } catch {
    // ignore
  }
  return <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <OfflineIndicator />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Documentation Route Aliases */}
          <Route path="/security/gate" element={<Navigate to="/gate-security" replace />} />
          <Route path="/guardian/gate-pass" element={<Navigate to="/guardian-gate-pass" replace />} />

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Public Landing Page */}
          <Route
            path="/landing"
            element={<LandingPage />}
          />

          {/* Home Redirect based on user role */}
          <Route path="/" element={<RoleHomeRedirect />} />

          {/* Protected Student Routes */}
          <Route
            path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <StudentDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty']}>
              <Layout>
                <Attendance />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/timetable"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty']}>
              <Layout>
                <Timetable />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty']}>
              <Layout>
                <Assignments />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-materials"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty']}>
              <Layout>
                <StudyMaterials />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/internal-marks"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <InternalMarks />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/results"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <SemesterResults />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gate-pass"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <Layout>
                <GatePass />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workflows"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
              <Layout>
                <StudentWorkflows />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/workflows"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
              <Layout>
                <StudentWorkflows />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gate-security"
          element={
            <ProtectedRoute allowedRoles={['security', 'admin']}>
              <Layout>
                <GateSecurity />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/guardian-gate-pass"
          element={
            <ProtectedRoute allowedRoles={['guardian', 'admin']}>
              <Layout>
                <GuardianGatePass />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/guardian/dashboard"
          element={
            <ProtectedRoute allowedRoles={['guardian', 'admin']}>
              <Layout>
                <GuardianGatePass />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gate-pass-admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hod']}>
              <Layout>
                <GatePassAdmin />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sgpa-predictor"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
              <Layout>
                <AcademicPredictor />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic-calendar"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <AcademicCalendar />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
              <Layout>
                <Events />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/placements"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <Layout>
                <Placements />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <CompanyProfiles />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
              <Layout>
                <Notifications />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-assistant"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <AIAssistant />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
              <Layout>
                <Notifications />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty-locator"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
              <Layout>
                <FacultyLocator />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* Protected Faculty Routes */}
        <Route
          path="/faculty"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <Layout>
                <FacultyDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Protected HOD Routes */}
        <Route
          path="/hod"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <Layout>
                <HodDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/campus-pulse"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty', 'admin', 'hod', 'security']}>
              <Layout>
                <CampusPulse />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/data-import"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <AdminDataImport />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/core-hub"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <AdminCoreHub />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/timetable-generator"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <AdminTimetableGenerator />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Forum Routes */}
        <Route
          path="/forum"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
              <Layout>
                <Forum />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/forum/:postId"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
              <Layout>
                <ForumPost />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </>
  );
};

export default App;
