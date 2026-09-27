import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Layout } from '../../components/Layout/Layout';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import {
  PageLoader,
  RoleHomeRedirect,
  Login,
  Register,
  ForgotPassword,
  ChangePassword,
  LandingPage,
  StudentDashboard,
  Attendance,
  Timetable,
  Assignments,
  StudyMaterials,
  InternalMarks,
  SemesterResults,
  GatePass,
  StudentWorkflows,
  AcademicPredictor,
  GateSecurity,
  GuardianGatePass,
  GatePassAdmin,
  HodDashboard,
  WardenDashboard,
  WardenLeaves,
  WardenProfile,
  FacultyDashboard,
  FacultyLocator,
  AdminDashboard,
  AdminDataImport,
  AdminCoreHub,
  AdminTimetableGenerator,
  AcademicCalendar,
  Events,
  Placements,
  CompanyProfiles,
  Notifications,
  AIAssistant,
  Announcements,
  Profile,
  CampusPulse,
  Forum,
  ForumPost,
  NotFound,
} from './routeConfig';

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Aliases for legacy & documentation links */}
        <Route path={ROUTES.SECURITY_GATE_ALIAS} element={<Navigate to={ROUTES.GATE_SECURITY} replace />} />
        <Route path={ROUTES.GUARDIAN_GATE_ALIAS} element={<Navigate to={ROUTES.GUARDIAN_GATE_PASS} replace />} />

        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route
          path={ROUTES.CHANGE_PASSWORD}
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route path={ROUTES.LANDING} element={<LandingPage />} />

        {/* Home Redirect based on user role */}
        <Route path={ROUTES.ROOT} element={<RoleHomeRedirect />} />

        {/* Student Routes */}
        <Route
          path={ROUTES.STUDENT_DASHBOARD}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <Layout>
                <StudentDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ATTENDANCE}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY]}>
              <Layout>
                <Attendance />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.TIMETABLE}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY]}>
              <Layout>
                <Timetable />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ASSIGNMENTS}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY]}>
              <Layout>
                <Assignments />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.STUDY_MATERIALS}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY]}>
              <Layout>
                <StudyMaterials />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.INTERNAL_MARKS}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <Layout>
                <InternalMarks />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.RESULTS}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <Layout>
                <SemesterResults />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.GATE_PASS}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.ADMIN]}>
              <Layout>
                <GatePass />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.WORKFLOWS}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN]}>
              <Layout>
                <StudentWorkflows />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.STUDENT_WORKFLOWS}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN]}>
              <Layout>
                <StudentWorkflows />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.LEAVE}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN]}>
              <Layout>
                <StudentWorkflows />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.LEAVES}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN]}>
              <Layout>
                <StudentWorkflows />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.MY_STATUS}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN]}>
              <Layout>
                <StudentWorkflows />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Security & Guardian Routes */}
        <Route
          path={ROUTES.GATE_SECURITY}
          element={
            <ProtectedRoute allowedRoles={[ROLES.SECURITY, ROLES.ADMIN]}>
              <Layout>
                <GateSecurity />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.GUARDIAN_GATE_PASS}
          element={
            <ProtectedRoute allowedRoles={[ROLES.GUARDIAN, ROLES.ADMIN]}>
              <Layout>
                <GuardianGatePass />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.GUARDIAN_DASHBOARD}
          element={
            <ProtectedRoute allowedRoles={[ROLES.GUARDIAN, ROLES.ADMIN]}>
              <Layout>
                <GuardianGatePass />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin & HOD Routes */}
        <Route
          path={ROUTES.GATE_PASS_ADMIN}
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HOD, ROLES.WARDEN]}>
              <Layout>
                <GatePassAdmin />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sgpa-predictor"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN]}>
              <Layout>
                <AcademicPredictor />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ACADEMIC_CALENDAR}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <Layout>
                <AcademicCalendar />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.EVENTS}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN]}>
              <Layout>
                <Events />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PLACEMENTS}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.ADMIN]}>
              <Layout>
                <Placements />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.COMPANY_PROFILES}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <Layout>
                <CompanyProfiles />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.NOTIFICATIONS}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN]}>
              <Layout>
                <Notifications />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.AI_ASSISTANT}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <Layout>
                <AIAssistant />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ANNOUNCEMENTS}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN]}>
              <Layout>
                <Announcements />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN, ROLES.WARDEN]}>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.FACULTY_LOCATOR}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN]}>
              <Layout>
                <FacultyLocator />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Faculty Routes */}
        <Route
          path={ROUTES.FACULTY_DASHBOARD}
          element={
            <ProtectedRoute allowedRoles={[ROLES.FACULTY]}>
              <Layout>
                <FacultyDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* HOD Routes */}
        <Route
          path={ROUTES.HOD_DASHBOARD}
          element={
            <ProtectedRoute allowedRoles={[ROLES.HOD]}>
              <Layout>
                <HodDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Warden Dedicated Routes */}
        <Route
          path={ROUTES.WARDEN_DASHBOARD}
          element={
            <ProtectedRoute allowedRoles={[ROLES.WARDEN, ROLES.ADMIN]}>
              <Layout>
                <WardenDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.WARDEN_ALIAS}
          element={<Navigate to={ROUTES.WARDEN_DASHBOARD} replace />}
        />
        <Route
          path={ROUTES.WARDEN_LEAVES}
          element={
            <ProtectedRoute allowedRoles={[ROLES.WARDEN, ROLES.ADMIN]}>
              <Layout>
                <WardenLeaves />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.WARDEN_PROFILE}
          element={
            <ProtectedRoute allowedRoles={[ROLES.WARDEN, ROLES.ADMIN]}>
              <Layout>
                <WardenProfile />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Campus Digital Twin */}
        <Route
          path={ROUTES.CAMPUS_PULSE}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN, ROLES.HOD, ROLES.SECURITY, ROLES.WARDEN]}>
              <Layout>
                <CampusPulse />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin Console */}
        <Route
          path={ROUTES.ADMIN_DASHBOARD}
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_DATA_IMPORT}
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Layout>
                <AdminDataImport />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_CORE_HUB}
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Layout>
                <AdminCoreHub />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_TIMETABLE_GENERATOR}
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Layout>
                <AdminTimetableGenerator />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Forum Discussions */}
        <Route
          path={ROUTES.FORUM}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN]}>
              <Layout>
                <Forum />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.FORUM_POST}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN]}>
              <Layout>
                <ForumPost />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback 404 Route */}
        <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
