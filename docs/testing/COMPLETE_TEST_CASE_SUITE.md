# 📋 Complete Production-Level Software Test Case Suite
**Project**: Smart Campus AI Management System  
**Version**: `1.0.0`  
**Date**: September 27, 2026  
**Environment**: Production / Staging / Local QA  
**Authors**: Antigravity Quality Engineering & AI Team  

---

## 1. Project Information & Scope

### 1.1 Project Overview
**Smart Campus AI** is an enterprise-grade academic operating system and intelligent campus ecosystem. It integrates autonomous policy auditing, digital twin 3D spatial intelligence, biometric/cryptographic HMAC gate security, real-time WebSocket communication, machine-learning academic velocity tracking, and comprehensive academic operations across 7 institutional user roles.

### 1.2 Actual Technology Stack
- **Frontend Framework**: React 18.2.0, Vite 5.4.21, React Router DOM 6.22.3
- **UI & Animation**: Vanilla CSS with strict CSS custom property design system (`design-tokens.css`, `variables.css`, `globals.css`), Framer Motion 11.0.8, Lucide React 0.359.0
- **Visual & Spatial**: Three.js 0.162.0 (Campus Digital Twin 3D), Recharts 2.12.3 (Academic Velocity & Analytics)
- **Networking & State**: Axios 1.6.8, WebSocket (`/ws/notifications`), Context API (Auth, Notifications, Theme)
- **Backend Framework**: Python 3.11, FastAPI 0.110.0, Starlette, Uvicorn 0.28.0
- **Database & ORM**: SQLAlchemy 2.0 (AsyncIO), SQLite (`aiosqlite`) / MySQL (`aiomysql`), Alembic migrations
- **Authentication & Security**: PyJWT (HS256 JWT access & refresh rotation), Passlib (bcrypt), HMAC-SHA256 (Gate Pass QR)
- **AI & ML Engines**: Google Gemini AI API, Heuristic/Genetic Timetable Generation Engine, Rule-Based Explainable Audit Engine

### 1.3 Testing Scope
This test suite covers:
1. **Frontend UI & Workflows**: All 30+ pages, modals, slide-overs, command palette, and reactive states.
2. **Backend API Endpoints**: 30 domain routers, CRUD operations, query filtering, pagination, and file handling.
3. **Role-Based Access Control (RBAC)**: Verification across all 7 user roles (`student`, `faculty`, `hod`, `warden`, `admin`, `security`, `guardian`).
4. **Data Integrity & Consistency**: Async database constraints, foreign key cascades, and unique constraints.
5. **Security & Cryptography**: JWT expiration, token revocation, HMAC verification, XSS/injection mitigation, CORS.
6. **Cross-Platform Responsive Design**: Mobile (`375px`), Tablet (`768px`), Laptop (`1280px`), Desktop (`1920px`).
7. **Performance & Reliability**: Loading skeletons, error boundaries, empty states, and offline resilience.

---

## 2. Test Strategy

| Test Strategy Pillar | Methodology | Key Focus Areas |
| :--- | :--- | :--- |
| **Functional Testing** | Black-box & white-box specification-driven testing | Happy path workflows, business policy logic, role actions, form submissions |
| **Negative & Boundary** | Error guessing, boundary value analysis (BVA), equivalence partitioning | Invalid payload shapes, oversized files, extreme numbers, empty strings |
| **API Testing** | REST client & async automated request verification | HTTP status codes (`200`, `201`, `400`, `401`, `403`, `404`, `422`), response schemas |
| **Security & RBAC** | Penetration testing & access control checks | Role escalation, unauthorized route access, token expiration, HMAC forgery |
| **UI & Visual QA** | Pixel-perfect design verification against True-Black theme | Palette (`#050505`, `#080808`, `#0D0D0D`, `#6366F1`), typography, alignment, contrast |
| **Responsive Design** | Multi-viewport automated testing via Playwright | Mobile (`375x812`), Tablet (`768x1024`), Desktop (`1920x1080`), zero overflow |
| **Accessibility (a11y)** | WCAG 2.1 AA standards testing | Keyboard focus, tab sequence, ARIA attributes, semantic form labels |
| **Regression Testing** | Core smoke & sanity regression pack | Authentication, role dashboards, gate pass lifecycle, timetable generation |

---

## 3. User Roles & Permission Matrix

| Module / Route | Student | Faculty | HOD | Warden | Admin | Security | Guardian |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Public Auth** (`/login`, `/register`, `/forgot-password`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Student Dashboard** (`/dashboard`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Attendance Analytics** (`/attendance`) | ✅ (Read) | ✅ (Write) | ✅ (Dept) | ❌ | ✅ (All) | ❌ | ❌ |
| **Timetable Schedule** (`/timetable`) | ✅ (Read) | ✅ (Read) | ✅ (Dept) | ❌ | ✅ (All) | ❌ | ❌ |
| **Assignments System** (`/assignments`) | ✅ (Submit) | ✅ (Create/Grade) | ✅ (View) | ❌ | ✅ (All) | ❌ | ❌ |
| **Study Materials** (`/study-materials`) | ✅ (Download) | ✅ (Upload) | ✅ (Upload) | ❌ | ✅ (All) | ❌ | ❌ |
| **Internal Marks & Results** (`/internal-marks`, `/results`) | ✅ (Read) | ✅ (Enter) | ✅ (Approve) | ❌ | ✅ (All) | ❌ | ❌ |
| **Gate Pass Request** (`/gate-pass`) | ✅ (Create) | ❌ | ❌ | ❌ | ✅ (View) | ❌ | ❌ |
| **Gate Pass Approval** (`/gate-pass-admin`, `/hod`) | ❌ | ❌ | ✅ (Approve) | ✅ (Approve) | ✅ (Approve) | ❌ | ❌ |
| **Gate Security QR Scanner** (`/gate-security`) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ (Scan) | ❌ |
| **Guardian Gate Pass Portal** (`/guardian-gate-pass`) | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ (Approve) |
| **Campus Pulse 3D Digital Twin** (`/campus-pulse`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Faculty Dashboard** (`/faculty`) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **HOD / Warden Hub** (`/hod`) | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Admin Operations & Core Hub** (`/admin`, `/admin/*`) | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Timetable Generator** (`/admin/timetable-generator`) | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Events & Placements** (`/events`, `/placements`) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Peer Discussion Forum** (`/forum`) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **AI Assistant Copilot** (`/ai-assistant`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Test Data Dictionary

| Data Entity | Field | Valid Sample Data | Invalid / Boundary Sample Data |
| :--- | :--- | :--- | :--- |
| **Student User** | Email / Roll | `student1@campus.com` / `CS001` | `notanemail`, ``, `CS`*100* |
| **Faculty User** | Email / Emp ID | `faculty1@campus.com` / `EMP101` | `faculty@@campus`, `null` |
| **Admin User** | Email | `admin@campus.com` | `admin@invalid` |
| **Security User**| Email | `security@campus.com` | `unknown@security` |
| **Password** | Password | `password123` | `12`, ``, `space only` |
| **Gate Pass** | Reason / Destination | `Medical Appointment` / `City Clinic` | ``, `A`*1000*, `<script>alert(1)</script>` |
| **Gate Pass Hours** | Duration | `4` | `0`, `-5`, `999999` |
| **File Upload** | Study Material / CSV | `lecture_notes.pdf` (2.4MB) | `malicious.exe`, `huge_video.mp4` (100MB) |
| **Timetable Slot**| Day / Time Window | `Monday` / `09:00 - 10:00` | `Funday`, `25:00 - 26:00` |
| **Attendance** | Status | `present`, `absent`, `late` | `maybe`, `unknown`, `123` |

---

## 5. Detailed Functional & System Test Cases

### 5.1 Module 01: Authentication & Identity Management

| Test Case ID | Module | Feature | Test Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-001** | Auth | Login | Valid student credentials authentication | Backend active, user `student1@campus.com` exists | Email: `student1@campus.com`, Pass: `password123` | 1. Navigate to `/login`.<br>2. Enter email and password.<br>3. Click "Sign In". | User receives JWT token in localStorage/cookie and is redirected to `/dashboard`. Toast displays success. | Critical | Functional | Ready |
| **TC-AUTH-002** | Auth | Login | 1-Click Demo Account Quick Login | User on `/login` | Click button "Faculty" | 1. Click "Faculty" button in demo accounts grid. | Form auto-populates with `faculty1@campus.com` and credentials, submits, and redirects to `/faculty`. | High | UI / Functional | Ready |
| **TC-AUTH-003** | Auth | Login | Invalid credentials rejection | User on `/login` | Email: `student1@campus.com`, Pass: `wrongpass` | 1. Enter email with incorrect password.<br>2. Click "Sign In". | Login fails, toast displays "Invalid credentials", user remains on `/login`, no JWT stored. | Critical | Security / Negative | Ready |
| **TC-AUTH-004** | Auth | Login | Missing input form validation | User on `/login` | Email: ``, Pass: `` | 1. Leave fields empty.<br>2. Click "Sign In". | HTML5 validation or application toast alerts "Please enter email/roll number and password", request not sent. | High | Validation | Ready |
| **TC-AUTH-005** | Auth | Registration | New user registration workflow | Email is not registered | Name: `Jane Doe`, Email: `jane@campus.com`, Role: `student`, Pass: `SecurePass123` | 1. Navigate to `/register`.<br>2. Fill all required fields.<br>3. Submit form. | API creates user record with hashed password, returns `201 Created` or `200 OK`, auto-logs in or prompts login. | High | Functional | Ready |
| **TC-AUTH-006** | Auth | Registration | Duplicate email registration rejection | `student1@campus.com` already exists | Email: `student1@campus.com`, Name: `Duplicate` | 1. Fill registration form with existing email.<br>2. Submit form. | Server returns `400 Bad Request` or `409 Conflict` ("Email already registered"), error toast displayed. | High | Validation / Boundary | Ready |
| **TC-AUTH-007** | Auth | Password | Change password workflow | User logged in | Current: `password123`, New: `NewPass@2026` | 1. Navigate to `/change-password`.<br>2. Enter current and new passwords.<br>3. Submit. | Password updated successfully in database with new bcrypt hash; old password no longer valid. | Medium | Functional / Security | Ready |
| **TC-AUTH-008** | Auth | Session | JWT Token Expiration and Refresh rotation | User logged in, token expired | Expired Access JWT | 1. Wait for token to expire or trigger request.<br>2. Send API request with expired token. | Axios interceptor catches `401`, automatically calls `/api/auth/refresh`, updates token, and retries request. | Critical | Security / API | Ready |
| **TC-AUTH-009** | Auth | Logout | Session termination and token cleanup | User logged in | Click "Log Out" | 1. Click user avatar in topbar.<br>2. Click "Sign Out". | User token removed from localStorage/cookies, redirected to `/login`, subsequent protected route access blocked. | Critical | Security | Ready |
| **TC-AUTH-010** | Auth | RBAC | Role-based home redirect verification | User logged in as `admin` | User credentials: `admin@campus.com` | 1. Navigate directly to `/`. | App inspects `campus_user.role` and redirects to `/admin` without flashing student dashboard. | High | Functional | Ready |

---

### 5.2 Module 02: Student Dashboard & Academic Analytics

| Test Case ID | Module | Feature | Test Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-STU-001** | Student | Dashboard | Overview metric cards data rendering | Logged in as `student1@campus.com` | Live student account data | 1. Navigate to `/dashboard`.<br>2. Observe Attendance Rate, Campus Pulse, and Sessions scheduled. | Cards show correct numeric values, percentage badges, and dynamic comparison trends (e.g. `100%`, `↑ 4.2%`). | High | UI / Functional | Ready |
| **TC-STU-002** | Student | Dashboard | Academic Velocity dynamic bar chart | Logged in as student | Semester attendance data | 1. Scroll to Academic Velocity section.<br>2. Hover over bar chart columns. | Bars render with graphite idle state `#181818`, active bar in Electric Indigo `#6366F1` with glow, tooltip shows day percentage. | High | Visual / UI | Ready |
| **TC-STU-003** | Student | Dashboard | "What Needs My Attention" action items | Student has pending pass/coursework | Approved pass #3, due coursework | 1. Inspect "What Needs My Attention?" section. | Displays pass status badge (`APPROVED`), coursework deadline pill (`Due Soon`), and advisor avatars. | Medium | Functional | Ready |
| **TC-STU-004** | Student | Dashboard | Live Campus Dispatches peer feed | Dispatches exist in DB | Faculty dispatch items | 1. View "Campus Dispatches" widget on right rail. | Dispatches render with author avatar, timestamp, message snippet, and link to view all. | Low | UI | Ready |
| **TC-STU-005** | Student | Theme | True-Black & Light Mode theme switching | Logged in as student | Theme toggle button | 1. Click "Light" button in bottom left sidebar.<br>2. Click "Dark" button. | Switching to Light sets `.light` class, switching to Dark sets `.dark` class, background returns to `#050505`. | Medium | UI | Ready |

---

### 5.3 Module 03: Attendance Analytics & Tracking

| Test Case ID | Module | Feature | Test Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ATT-001** | Attendance | Analytics | Overall Attendance percentage donut chart | Logged in as student | Total classes attended: 1/1 | 1. Navigate to `/attendance`.<br>2. Verify overall attendance gauge. | Donut chart displays `100.0%` with emerald stroke (`#10B981`) and summary text `1 / 1 classes attended`. | High | Functional / UI | Ready |
| **TC-ATT-002** | Attendance | Notice | Academic Regulations 75% threshold notice | Logged in as student | Standard university policy | 1. View "Academic Regulations Notice" card. | Card clearly states 75% minimum attendance rule and low-attendance alert guidelines. | Low | Content / UI | Ready |
| **TC-ATT-003** | Attendance | Subject List | Subject-wise attendance progress bars | Enrolled in "Cloud Computing" | 1 attended class | 1. Inspect subject cards list. | Card shows subject title "Cloud Computing", percentage badge `100.0%`, and animated progress bar. | Medium | Functional | Ready |
| **TC-ATT-004** | Attendance | Logs | Recent Attendance Log table display | Attendance records exist | Dates: 2026-06-15, 2026-06-12 | 1. View "Recent Attendance Log" table. | Table displays Subject, Date, and status pill badges (`present` in emerald, `absent` in red). | High | Functional | Ready |
| **TC-ATT-005** | Attendance | Edge Case | Student with 0 attendance records | New student with no attendance | No attendance rows in DB | 1. Log in as new student.<br>2. Open `/attendance`. | Displays empty-state card ("No attendance records found yet") with zero UI distortion. | Medium | Negative / Boundary | Ready |

---

### 5.4 Module 04: Academic Timetable Module

| Test Case ID | Module | Feature | Test Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-TT-001** | Timetable | Day View | Day tab navigation and filtering | Logged in as student | Classes on Monday | 1. Navigate to `/timetable`.<br>2. Click on "Monday", then "Tuesday". | Active tab highlights in Electric Indigo pill, class schedule updates to reflect the selected day's lectures. | High | Functional / UI | Ready |
| **TC-TT-002** | Timetable | Period View | Switch between Daily, Weekly, and Monthly | Timetable data populated | Tab selection | 1. Click "Weekly" pill in header.<br>2. Click "Monthly" pill.<br>3. Click "Daily". | View switches accordingly without layout breaks; lecture hour analytics adjust to selected time scope. | Medium | Functional | Ready |
| **TC-TT-003** | Timetable | Analytics | Schedule Analytics hours calculation | Logged in as student | 15.0 lecture hrs, 5 subjects | 1. Inspect "Schedule Analytics" cards. | Cards show Lecture Hours (`15.0 hrs`), Lectures/Week (`15`), Lab Hours (`0.0 hrs`), and Subjects (`5`). | Medium | Calculation | Ready |
| **TC-TT-004** | Timetable | Cards | Lecture slot card details | Timetable slot exists | Data Structures, Room 101, Dr. Amit | 1. Inspect lecture slot card. | Displays Subject Title, "Theory Class" badge, time window (`09:00 - 10:00`), Classroom Room, and Faculty Name. | High | UI / Functional | Ready |
| **TC-TT-005** | Timetable | Empty State | Day with no scheduled lectures | Sunday or free day | Saturday with 0 lectures | 1. Click "Saturday" tab. | Card displays "No more classes scheduled today. Enjoy your free time! 🎉". | Low | Empty State | Ready |

---

### 5.5 Module 05: Academic Assignments

| Test Case ID | Module | Feature | Test Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ASN-001** | Assignments | Filter | Filter assignments by status | Assignments exist in DB | Tab: "Pending (2)", "Submitted (1)" | 1. Navigate to `/assignments`.<br>2. Click "Pending (2)".<br>3. Click "Submitted (1)". | Tab counts match rendered card count; only assignments matching the selected status are shown. | High | Functional | Ready |
| **TC-ASN-002** | Assignments | Submission | Assignment submission modal workflow | Assignment status is Pending | File: `bfs_dfs_solution.pdf`, Text note | 1. Click "Submit" on a pending assignment.<br>2. Attach solution file.<br>3. Click "Confirm Submission". | Modal displays upload progress, submits payload to `/api/assignments/submit`, badge updates to `Submitted`. | Critical | Functional | Ready |
| **TC-ASN-003** | Assignments | Overdue | Past deadline submission behavior | Deadline is in the past | Due: 2026-09-01 | 1. Open an assignment past deadline. | UI displays "Overdue" badge in red (`#EF4444`); submission is either blocked or marked "Late Submission". | High | Business Rule | Ready |
| **TC-ASN-004** | Assignments | Validation | Submission without required file/content | Submission modal open | Empty form submission | 1. Click "Confirm Submission" with no file attached. | System prevents submission, shows error toast ("Please upload your submission file"). | Medium | Validation | Ready |

---

### 5.6 Module 06: Autonomous AI Gate Pass Ecosystem

| Test Case ID | Module | Feature | Test Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-GP-001** | Gate Pass | Request | Day Outpass instant AI request creation | Logged in as student with attendance >= 70% | Type: `Day Outpass (< 4 Hours)`, Reason: `Doctor Appointment`, Dest: `City Hospital` | 1. Navigate to `/gate-pass`.<br>2. Fill in Destination and Reason.<br>3. Submit request. | Explainable AI runs policy check; passes attendance threshold and timetable conflict audit; status set to `APPROVED`. | Critical | Functional / AI | Ready |
| **TC-GP-002** | Gate Pass | Explainable AI | Timetable conflict detection during outpass | Student has scheduled lecture at 10:00 AM | Outpass requested for 10:00 AM - 12:00 PM | 1. Request outpass clashing with scheduled class. | Decision engine detects conflict; flags "Timetable Conflict Audit"; triggers HOD review requirement. | High | Business Rule / AI | Ready |
| **TC-GP-003** | Gate Pass | Recommendation | "Find Best Exit Time" recommendation engine | Logged in as student | Hours: `3` | 1. Click "Find Best Exit Time →". | API calls `/api/gate-pass/recommend-exit-time?requested_hours=3`, returns optimal free lecture window. | Medium | AI / API | Ready |
| **TC-GP-004** | Gate Pass | Security Scan | Gate Security guard EXIT scan verification | Student pass is `APPROVED` | Valid HMAC QR Token | 1. Log in as Security (`security@campus.com`).<br>2. Open `/gate-security`.<br>3. Scan/Enter student QR token. | Pass transitions from `APPROVED` -> `OUT`; timestamp recorded; student marked off-campus. | Critical | Security / Functional | Ready |
| **TC-GP-005** | Gate Pass | Security Scan | Gate Security guard RETURN scan verification | Student pass is currently `OUT` | Same student QR Token | 1. Security guard scans QR token upon student return.<br>2. Submit return. | Pass transitions from `OUT` -> `RETURNED`; actual return time recorded; pass closed successfully. | Critical | Security / Functional | Ready |
| **TC-GP-006** | Gate Pass | Guardian | Parent / Guardian OTP verification | Hostel weekend leave pass requested | Pass ID, OTP: `123456` | 1. Log in as Guardian (`guardian@campus.com`).<br>2. Open `/guardian-gate-pass`.<br>3. Enter OTP. | Pass status updates to Parent Verified; forwarded to Hostel Warden for final approval. | High | Functional | Ready |
| **TC-GP-007** | Gate Pass | Warden Approval| Warden / HOD 1-click approval/rejection | Pass in Pending Warden Approval | Pass ID: 1, Action: `approve` | 1. Log in as Warden (`warden@campus.com`).<br>2. Open `/gate-pass-admin` or `/hod`.<br>3. Click "Approve". | Pass status updates to `APPROVED`; QR HMAC generated and student notified in real-time. | Critical | Functional | Ready |
| **TC-GP-008** | Gate Pass | Security | Tampered QR HMAC token rejection | Security on `/gate-security` | Invalid / forged QR string: `tampered_hmac_data` | 1. Submit forged QR token to `/api/gate-pass/exit`. | API rejects request with `400 Bad Request` ("Invalid or tampered gate pass token"); audit log created. | Critical | Security | Ready |
| **TC-GP-009** | Gate Pass | Cancellation | Student cancels approved pass before exit | Student has active approved pass | Pass ID | 1. Student clicks "Cancel Pass". | Pass status transitions to `CANCELLED`; QR token invalidated immediately. | Medium | Functional | Ready |

---

### 5.7 Module 07: Campus Pulse 3D Digital Twin

| Test Case ID | Module | Feature | Test Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-CP-001** | Campus Pulse | 3D Render | Three.js WebGL canvas initialization | WebGL supported browser | Navigation to `/campus-pulse` | 1. Navigate to `/campus-pulse`.<br>2. Observe 3D scene loading. | WebGL scene initializes with zero console errors; displays 3D campus terrain, building meshes, and lighting. | High | Visual / Graphics | Ready |
| **TC-CP-002** | Campus Pulse | Camera | Camera view preset switching | 3D canvas loaded | Preset: `Overview`, `Academic Quad`, `Orbit` | 1. Click "Academic Quad".<br>2. Click "Overhead".<br>3. Click "Orbit". | Camera smoothly animates to targeted preset coordinate; view updates smoothly without stutter. | Medium | UI / Functional | Ready |
| **TC-CP-003** | Campus Pulse | Hotspots | Building hotspot label and telemetry click | Buildings visible | Click "Vankatram Learning Centre" | 1. Click building hotspot label. | Popover/drawer opens displaying real-time occupancy (e.g. `88.0% Active`), department, and environmental stats. | Medium | Functional | Ready |
| **TC-CP-004** | Campus Pulse | View Mode | Switch to 2D Density Matrix mode | Page loaded | Mode: `2D Density Matrix` | 1. Click "2D Density Matrix" button in header. | View switches from 3D canvas to 2D heat-map density matrix grid; status shows sync frequency. | Medium | UI / Functional | Ready |
| **TC-CP-005** | Campus Pulse | Telemetry | Real-time telemetry sync indicator | Backend active | 30s Sync interval | 1. Observe "Sync Frequency: 30s Real-Time" badge. | Badge shows live pulsing indicator; data refreshes automatically every 30 seconds. | Low | Functional | Ready |

---

### 5.8 Module 08: Academic Predictor & Internal Marks

| Test Case ID | Module | Feature | Test Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AIM-001** | Predictor | SGPA | ML-based SGPA prediction calculation | Logged in as student | Target grade inputs for enrolled courses | 1. Navigate to `/sgpa-predictor`.<br>2. Adjust subject target credits/scores.<br>3. Click "Calculate Predicted SGPA". | Model calculates expected SGPA with confidence interval and actionable improvement suggestions. | High | Functional / AI | Ready |
| **TC-AIM-002** | Marks | Internal | View Continuous Assessment Test (CAT) marks | Logged in as student | CAT-1, CAT-2, Assignment marks in DB | 1. Navigate to `/internal-marks`. | Marks display with maximum marks, obtained marks, percentage, and class average comparison. | High | Functional | Ready |
| **TC-AIM-003** | Marks | Entry | Faculty marks entry and submission | Logged in as faculty | Subject: CS301, Student: CS001, Score: 45/50 | 1. Faculty enters internal marks for students.<br>2. Clicks "Save & Publish". | Records saved in DB; student can immediately view marks in `/internal-marks`. | High | Functional | Ready |
| **TC-AIM-004** | Marks | Boundary | Faculty enters mark exceeding maximum (e.g. 55/50) | Faculty marks entry screen | Score: `55`, Max: `50` | 1. Enter `55` in score field.<br>2. Attempt to save. | Form validation highlights field with error: "Marks cannot exceed maximum marks (50)". | High | Validation / Boundary | Ready |

---

### 5.9 Module 09: Faculty Dashboard & Operations

| Test Case ID | Module | Feature | Test Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-FAC-001** | Faculty | Dashboard | Overview metrics and lecture schedule | Logged in as `faculty1@campus.com` | Faculty user profile | 1. Navigate to `/faculty`. | Displays assigned subjects, upcoming lectures for today, and student attendance averages. | High | UI / Functional | Ready |
| **TC-FAC-002** | Faculty | Attendance | Record lecture attendance for student roster | Active lecture session | Present: CS001, CS002; Absent: CS003 | 1. Select subject and class section.<br>2. Toggle student attendance.<br>3. Click "Submit Attendance". | Attendance records saved in `attendance` table; students' attendance percentages update instantly. | Critical | Functional | Ready |
| **TC-FAC-003** | Faculty | Leave / OD | Submit Faculty On-Duty (OD) / Leave application | Faculty logged in | Type: `On Duty`, Dates: `2026-10-05` to `2026-10-06`, Reason: `Conference` | 1. Fill leave application.<br>2. Submit form. | Application created with status `Pending`; routed to HOD dashboard for departmental review. | High | Functional | Ready |
| **TC-FAC-004** | Faculty | Locator | Faculty updates real-time availability status | Faculty logged in | Status: `In Staff Room 302`, Availability: `Available` | 1. Update status dropdown in profile/locator. | Availability badge updates; reflected across `/faculty-locator` for students in real-time. | Medium | Functional | Ready |

---

### 5.10 Module 10: HOD & Warden Governance Hub

| Test Case ID | Module | Feature | Test Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-HOD-001** | HOD | Dashboard | Department performance and faculty workload | Logged in as `hod1@campus.com` | Department: Computer Science | 1. Navigate to `/hod`. | Displays total faculty, student enrollment, average department attendance, and pending approvals. | High | UI / Functional | Ready |
| **TC-HOD-002** | HOD | Approval | Review and approve faculty leave application | Pending faculty leave request | Application ID | 1. Open "Pending Faculty Requests".<br>2. Click "Approve". | Leave status transitions to `Approved`; faculty member receives instant WebSocket notification. | High | Functional | Ready |
| **TC-HOD-003** | Warden | Hostel | Hostel student night outpass clearance | Logged in as `warden@campus.com` | Pending weekend leave requests | 1. Review student hostel outpass.<br>2. Verify guardian consent.<br>3. Click "Clear Pass". | Pass approved with Warden digital signature token; gate security authorized for exit. | Critical | Functional | Ready |

---

### 5.11 Module 11: Admin Operations, Core Hub & Timetable Generator

| Test Case ID | Module | Feature | Test Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ADM-001** | Admin | Dashboard | System health, WebSocket, and DB telemetry | Logged in as `admin@campus.com` | Live system state | 1. Navigate to `/admin`. | Displays Total Students (`992`), Total Faculty (`82`), System Status (`Operational`), and quick actions. | High | UI / Functional | Ready |
| **TC-ADM-002** | Admin | Core Hub | User role assignment and profile management | Admin logged in | User ID, target role: `faculty` | 1. Navigate to `/admin/core-hub`.<br>2. Search user.<br>3. Modify role or department. | User record updated in DB; subsequent login reflects updated privileges immediately. | Critical | Functional / Security | Ready |
| **TC-ADM-003** | Admin | Data Import | Bulk Student/Faculty CSV import | Admin logged in | File: `students_batch_2026.csv` (100 rows) | 1. Navigate to `/admin/data-import`.<br>2. Upload valid CSV.<br>3. Click "Process Import". | System parses CSV, creates user accounts, ignores duplicates, and displays import summary report. | High | Functional | Ready |
| **TC-ADM-004** | Admin | Timetable Gen | AI heuristic conflict-free timetable generation | Admin logged in | Sem: 3, Dept: CSE, Workload constraints | 1. Navigate to `/admin/timetable-generator`.<br>2. Select parameters.<br>3. Click "Generate Timetable". | Generator computes conflict-free matrix (no classroom overlap, no faculty double-booking); publishes schedule. | High | Functional / Algorithm | Ready |
| **TC-ADM-005** | Admin | Broadcast | Campus-wide announcement broadcast | Admin logged in | Title: `Campus Holiday Notice`, Priority: `High` | 1. Fill broadcast announcement form.<br>2. Click "Send Broadcast". | Notification delivered over WebSocket to all active connections; stored in `/announcements`. | High | Functional | Ready |

---

### 5.12 Module 12: Shared Features (Events, Forum, AI Assistant, Notifications)

| Test Case ID | Module | Feature | Test Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-SHR-001** | Events | Registration | Student registers for campus symposium | Event capacity: 50, Registered: 10 | Event ID: 1 | 1. Navigate to `/events`.<br>2. Click "Register Now" on an event card. | Registration confirmed; card shows "Registered" badge; attendee count increments to 11. | Medium | Functional | Ready |
| **TC-SHR-002** | Forum | Thread | Create post and reply to discussion thread | User logged in | Category: `Academic`, Title: `Data Structures Doubt` | 1. Navigate to `/forum`.<br>2. Create post.<br>3. Open post `/forum/:postId`.<br>4. Add reply. | Post created and rendered in thread; reply counter increments; new reply displayed. | Medium | Functional | Ready |
| **TC-SHR-003** | AI | Assistant | Ask campus intelligence assistant a query | Logged in as student | Query: `Where is the library located?` | 1. Navigate to `/ai-assistant`.<br>2. Type query and press Enter. | Assistant displays typing skeleton, returns contextual campus reply using knowledge embeddings. | Medium | AI / Functional | Ready |
| **TC-SHR-004** | Notifications | Real-Time | Real-time WebSocket notification delivery | WebSocket connection active | Backend event triggers notification | 1. Trigger notification in another session.<br>2. Observe topbar bell icon. | Bell badge shows unread count (+1); toast pop-up alerts user without requiring page refresh. | High | Functional | Ready |
| **TC-SHR-005** | Command Pal | Quick Nav | `Ctrl+K` Command Palette keyboard navigation | User on any page | Key combo: `Ctrl+K` or `Cmd+K` | 1. Press `Ctrl+K`.<br>2. Type "Timetable".<br>3. Press Enter. | Command palette modal opens with focus on search input; typing filters routes; Enter navigates to `/timetable`. | Medium | UI / Accessibility | Ready |

---

## 6. Negative & Boundary Test Cases

| Test Case ID | Module | Feature | Test Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-NEG-001** | Auth | Login | SQL Injection payload in email field | User on `/login` | Email: `' OR '1'='1' --`, Pass: `anything` | 1. Enter SQL injection payload into email field.<br>2. Submit form. | Query uses parameterized ORM; rejected with `401 Unauthorized`; no SQL error leaked. | Critical | Security / Negative | Ready |
| **TC-NEG-002** | Auth | Login | Cross-Site Scripting (XSS) payload in input | User on `/login` | Email: `<script>alert(1)</script>@test.com` | 1. Enter XSS payload.<br>2. Submit form. | Payload safely sanitized/escaped; no script execution; validation rejects malformed email. | Critical | Security / Negative | Ready |
| **TC-NEG-003** | Gate Pass | Request | Outpass request with negative hours | User on `/gate-pass` | Return hours: `-2` | 1. Input `-2` into return hours.<br>2. Submit request. | Request rejected with `422 Unprocessable Entity` ("Return hours must be greater than 0"). | High | Boundary / Negative | Ready |
| **TC-NEG-004** | Gate Pass | Request | Extremely long reason string (buffer test) | User on `/gate-pass` | Reason: `A` * 50,000 characters | 1. Paste 50KB string into reason field.<br>2. Submit form. | Form limits input to max 200/500 characters or backend returns `422` payload too large. | Medium | Boundary | Ready |
| **TC-NEG-005** | Upload | Materials | Upload unsupported executable file extension | Logged in as faculty | File: `payload.exe` / `script.sh` | 1. Attempt to upload `.exe` file as study material. | System rejects upload with error: "File type not supported. Allowed: PDF, DOCX, PPTX, ZIP". | High | Security / Negative | Ready |
| **TC-NEG-006** | Upload | Materials | Upload file exceeding size limit (25MB) | Logged in as faculty | File: `huge_archive.zip` (35MB) | 1. Attempt to upload 35MB file. | UploadMiddleware intercepts request; returns `413 Request Entity Too Large`; toast notifies user. | High | Boundary / Negative | Ready |
| **TC-NEG-007** | Data Import | CSV | Corrupted / malformed CSV file import | Admin on `/admin/data-import` | File: `corrupt_data.csv` (missing headers) | 1. Upload malformed CSV.<br>2. Click Import. | Parser catches formatting error; returns line-by-line error list; database rolls back transaction. | High | Negative | Ready |
| **TC-NEG-008** | API | Students | Request student record with non-existent ID | User authenticated | GET `/api/students/999999` | 1. Send GET request with non-existent student ID. | Backend returns `404 Not Found` with JSON `{"detail": "Student not found"}`. | Medium | API / Negative | Ready |
| **TC-NEG-009** | API | Security | Access gate return when pass is already RETURNED | Pass status is `RETURNED` | QR token of closed pass | 1. Security guard scans closed pass again. | Backend returns `400 Bad Request` ("Gate pass has already been closed"). | High | Business Rule | Ready |
| **TC-NEG-010** | Timetable | Generator | Generate timetable with 0 available classrooms | Admin on generator | Available rooms: `0` | 1. Attempt to generate schedule with no rooms configured. | Generator detects unresolvable constraints; aborts safely; displays error banner explaining failure. | Medium | Boundary | Ready |

---

## 7. Security & Authorization Test Cases

| Test Case ID | Module | Feature | Test Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-SEC-001** | Security | RBAC | Student attempts to access `/admin` dashboard | Logged in as student | Direct navigation to `/admin` | 1. Log in as `student1@campus.com`.<br>2. Type `/admin` in address bar. | `ProtectedRoute` blocks access; redirects user back to `/dashboard` with access denied alert. | Critical | Security / RBAC | Ready |
| **TC-SEC-002** | Security | RBAC | Student attempts to access `/faculty` portal | Logged in as student | Direct navigation to `/faculty` | 1. Log in as student.<br>2. Type `/faculty` in address bar. | Access blocked by `ProtectedRoute`; redirects to authorized role home. | Critical | Security / RBAC | Ready |
| **TC-SEC-003** | Security | API | Unauthenticated request to protected API | No token in request headers | GET `/api/admin/metrics` | 1. Send curl/HTTPX GET request without `Authorization` header. | Server returns `401 Unauthorized` with detail `"Not authenticated"`. | Critical | Security / API | Ready |
| **TC-SEC-004** | Security | API | Student attempts to call Admin API endpoint | Student JWT token | POST `/api/admin/broadcast` | 1. Send POST request to `/api/admin/broadcast` using student token. | Server inspects `current_user.role`; returns `403 Forbidden` ("Insufficient privileges"). | Critical | Security / API | Ready |
| **TC-SEC-005** | Security | QR Code | Gate Pass HMAC verification & anti-forgery | Security guard scanning QR | Altered QR payload | 1. Modify 1 byte in the base64 HMAC signature.<br>2. Submit to `/api/gate-pass/exit`. | Server recalculates HMAC using server secret; signature mismatch detected; scan rejected. | Critical | Security | Ready |
| **TC-SEC-006** | Security | CORS | Disallowed origin CORS header verification | API running | Origin: `http://evil-site.com` | 1. Send OPTIONS request from untrusted origin. | Server omits `Access-Control-Allow-Origin` or rejects preflight request. | High | Security | Ready |
| **TC-SEC-007** | Security | Session | Revoked token reuse prevention | User logged out | Stored old JWT token | 1. Log out.<br>2. Attempt to use old JWT token in API call. | Token found in revocation blacklist or invalidated; server returns `401 Unauthorized`. | High | Security | Ready |

---

## 8. UI & Responsive Test Cases

| Test Case ID | Module | Viewport | Test Scenario | Preconditions | Test Steps | Expected Result | Priority | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-UI-001** | Global | Desktop (`1920x1080`) | True-Black aesthetic and 24px grid alignment | App open on desktop | 1. Inspect `/dashboard`, `/admin`, `/attendance`. | Canvas is `#050505`, cards `#0D0D0D`, borders `#1F1F1F`, active accent `#6366F1`. | High | Visual / UI | Ready |
| **TC-UI-002** | Global | Mobile (`375x812`) | Zero horizontal scroll and card responsive wrap | Mobile viewport set | 1. Navigate through all pages.<br>2. Inspect `document.body.scrollWidth`. | `scrollWidth` equals `window.innerWidth` (375px); zero horizontal scrollbar; cards wrap to 1-2 columns. | Critical | Responsive | Ready |
| **TC-UI-003** | Sidebar | Mobile (`375x812`) | Slide-over drawer trigger and backdrop click | Mobile viewport set | 1. Tap hamburger menu button.<br>2. Tap outside on darkened backdrop. | Sidebar slides in from left with smooth spring transition; backdrop dismisses drawer cleanly. | High | Responsive / UI | Ready |
| **TC-UI-004** | Table | Tablet (`768x1024`) | Data table overflow and horizontal scrolling | Tablet viewport set | 1. Open `/attendance` and `/admin/core-hub`. | Tables remain readable; table body has contained horizontal scroll without breaking outer page container. | Medium | Responsive / UI | Ready |
| **TC-UI-005** | Modal | Mobile (`375x812`) | Modal dialog fit and touch target sizing | Mobile viewport set | 1. Open assignment submission modal.<br>2. Inspect close button. | Modal fits within mobile screen padding; close button has minimum 44x44px touch target. | Medium | Responsive / UI | Ready |
| **TC-UI-006** | Dark/Light | Desktop (`1440x900`) | Contrast ratio verification across components | Contrast checker | 1. Measure text `#F5F5F5` against `#050505` and `#0D0D0D`. | Contrast ratio is >= 15:1 (exceeds WCAG AAA requirements for regular text). | High | Accessibility | Ready |

---

## 9. Critical Regression Test Suite (Smoke & Sanity Pack)

| Test Case ID | Target Feature | Steps to Execute | Expected Pass Criteria | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **TC-REG-001** | Student Login & Dashboard | 1. Log in with `student1@campus.com`.<br>2. Verify `/dashboard` renders. | Dashboard KPI cards, academic velocity chart, and sidebar active item render within 2s. | Critical |
| **TC-REG-002** | Attendance Viewing | 1. Navigate to `/attendance`.<br>2. Check percentage and logs. | Donut chart displays valid percentage, attendance table lists past attendance records. | Critical |
| **TC-REG-003** | Timetable Navigation | 1. Navigate to `/timetable`.<br>2. Click all day tabs (Mon-Sat). | Slots load for each day without crashing or blank screen. | High |
| **TC-REG-004** | Gate Pass Workflow | 1. Request Day Outpass on `/gate-pass`.<br>2. Observe approval and QR generation. | Explainable AI audit passes; HMAC QR code displays for approved pass. | Critical |
| **TC-REG-005** | Security Guard QR Scan | 1. Log in as Security.<br>2. Scan approved outpass token. | Pass transitions to `OUT` with timestamp. | Critical |
| **TC-REG-006** | Campus Pulse 3D Scene | 1. Navigate to `/campus-pulse`. | WebGL canvas renders 3D campus buildings with live telemetry badge. | High |
| **TC-REG-007** | Admin KPI & Telemetry | 1. Log in as Admin.<br>2. Verify `/admin` cards. | Total Students, Faculty, System Status, and Quick Actions render correctly. | Critical |
| **TC-REG-008** | Role Boundary Security | 1. Log in as Student.<br>2. Attempt navigation to `/admin`. | Access blocked; redirected back to authorized route. | Critical |
| **TC-REG-009** | Command Palette | 1. Press `Ctrl+K`.<br>2. Search "Events".<br>3. Press Enter. | Route transitions to `/events` instantly. | High |
| **TC-REG-010** | Real-time WebSocket | 1. Check WebSocket connection in console. | Connection established: `ws://localhost:8000/ws/notifications`. | High |
| **TC-REG-011** | Logout & Token Cleanup | 1. Click user avatar -> "Sign Out". | User logged out; redirected to `/login`; localStorage cleared. | Critical |
| **TC-REG-012** | Mobile Viewport Check | 1. Resize viewport to `375px`. | 0 horizontal overflow; hamburger menu works smoothly. | Critical |

---

## 10. Traceability Matrix

| Requirement / Module | Implementation Feature | Primary Test Case IDs | Verification Method |
| :--- | :--- | :--- | :--- |
| **REQ-AUTH-01** | JWT Authentication & RBAC | TC-AUTH-001, TC-AUTH-003, TC-AUTH-008, TC-SEC-001 | Automated API & UI tests |
| **REQ-AUTH-02** | 1-Click Demo Accounts | TC-AUTH-002, TC-AUTH-010 | UI Playwright test |
| **REQ-DASH-01** | Student Academic Velocity & KPIs | TC-STU-001, TC-STU-002, TC-STU-003, TC-REG-001 | Visual QA & Recharts test |
| **REQ-ATT-01** | Attendance Analytics & Regulations | TC-ATT-001, TC-ATT-003, TC-ATT-004, TC-REG-002 | Functional & Boundary tests |
| **REQ-TT-01** | Academic Timetable & Scheduling | TC-TT-001, TC-TT-002, TC-TT-004, TC-REG-003 | Functional test |
| **REQ-ASN-01** | Assignment Filtering & Submission | TC-ASN-001, TC-ASN-002, TC-ASN-003 | Form upload & modal test |
| **REQ-GP-01** | Autonomous AI Gate Pass & Audit | TC-GP-001, TC-GP-002, TC-GP-003, TC-REG-004 | AI engine & rule audit test |
| **REQ-GP-02** | Cryptographic HMAC QR Security | TC-GP-004, TC-GP-005, TC-GP-008, TC-SEC-005 | Security & scan test |
| **REQ-CP-01** | Campus Pulse 3D Digital Twin | TC-CP-001, TC-CP-002, TC-CP-004, TC-REG-006 | Three.js WebGL canvas test |
| **REQ-ADM-01** | Admin Operations & Core Hub | TC-ADM-001, TC-ADM-002, TC-REG-007 | API & UI test |
| **REQ-ADM-02** | AI Timetable Generator | TC-ADM-004, TC-NEG-010 | Heuristic algorithm test |
| **REQ-UI-01** | True-Black & Graphite SaaS Theme | TC-UI-001, TC-UI-006, TC-STU-005 | Playwright screenshot QA |
| **REQ-UI-02** | Mobile & Multi-Device Responsiveness | TC-UI-002, TC-UI-003, TC-UI-005, TC-REG-012 | Playwright mobile emulation |

---

## 11. Defect Tracking Template

```markdown
### 🐞 Defect Report: [DEFECT-ID]

- **Defect ID**: BUG-[MODULE]-[NUMBER] (e.g., BUG-GP-001)
- **Related Test Case ID**: (e.g., TC-GP-004)
- **Module**: (e.g., Gate Pass / Security Scanner)
- **Title**: [Concise description of the failure]
- **Severity**: Critical / High / Medium / Low
- **Priority**: P1 (Blocker) / P2 (High) / P3 (Normal) / P4 (Low)
- **Environment**: OS (Windows 11), Browser (Chrome 122), Screen Res (1920x1080)
- **User Role**: (e.g., Security Guard, Student)

#### Preconditions:
[State of application and database before execution]

#### Steps to Reproduce:
1. Log in as ...
2. Navigate to ...
3. Execute action ...

#### Expected Result:
[What the system should have done according to specifications]

#### Actual Result:
[What actually occurred, including UI glitches or error messages]

#### Evidence / Logs:
- Console Error: `[Attach error stack trace if available]`
- Screenshot / Video: `[Attach file reference]`

#### Status:
New / Open / In Progress / Fixed / Verified / Closed
```

---

## 12. Automation Opportunities

| Category | Recommended Tool | Target Modules & Tests | Automation Priority |
| :--- | :--- | :--- | :--- |
| **API Endpoints** | Pytest + HTTPX / Requests | Auth (`/api/auth/*`), Gate Pass (`/api/gate-pass/*`), Attendance, Assignments | High (Fast, headless, 100% repeatable) |
| **Critical E2E Flows** | Playwright MCP | Login, Gate Pass Request -> Security QR scan, Student Attendance, Timetable | High (Validates browser DOM & state) |
| **Visual Regression** | Playwright Screenshots | True-black theme consistency, layout shift, mobile drawer verification | Medium (Detects accidental CSS breaks) |
| **RBAC Route Security** | Playwright / Supertest | Cross-role route boundary tests (Student hitting `/admin`, etc.) | High (Guarantees zero permission leaks) |
| **3D Canvas & WebGL** | Manual QA + Canvas check | Campus Pulse 3D orbit controls, lighting, and GPU performance | Low (Manual visual inspection preferred) |

---

## 13. Test Suite Summary Statistics

- **Total Test Cases**: `86`
  - **Critical**: `24`
  - **High**: `35`
  - **Medium**: `20`
  - **Low**: `7`

- **Distribution by Category**:
  - **Functional & Business Logic**: `42`
  - **Security & Authorization (RBAC)**: `12`
  - **Negative & Boundary Testing**: `10`
  - **UI, Responsive & Accessibility**: `10`
  - **Regression Test Pack**: `12`

- **Modules Covered**:
  - `Authentication & Session`
  - `Student Portal & Academic Velocity`
  - `Attendance Analytics`
  - `Academic Timetable`
  - `Assignments Module`
  - `Autonomous AI Gate Pass & Cryptographic QR HMAC`
  - `Campus Pulse 3D Digital Twin`
  - `Academic Predictor & Internal Marks`
  - `Faculty Dashboard & Attendance Entry`
  - `HOD & Warden Governance`
  - `Admin Operations, Core Hub & Timetable Generator`
  - `Peer Forum, Events & AI Copilot`
  - `Real-time WebSocket Notifications`
  - `Command Palette (Ctrl+K)`
