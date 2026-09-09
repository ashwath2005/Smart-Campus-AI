# Smart Campus AI System - Software Test Cases Specification

> **Project Name**: Smart Campus AI (SCI) - Next-Gen Autonomous Campus Intelligence Engine  
> **Document Type**: Software Test Cases & Quality Assurance Specification  
> **Format Version**: 1.0.0  
> **Status**: Verified & Passed  

---

## 📊 Test Execution Summary

| Module ID | Module Name | Total Test Cases | Passed | Failed | Blocked | Pass Rate |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **MOD-01** | Authentication & User Management | 8 | 8 | 0 | 0 | 100% |
| **MOD-02** | Student Portal & AI Advisory | 6 | 6 | 0 | 0 | 100% |
| **MOD-03** | Faculty Portal & Academics | 5 | 5 | 0 | 0 | 100% |
| **MOD-04** | Gate Pass & Campus Security | 4 | 4 | 0 | 0 | 100% |
| **MOD-05** | Dynamic Timetable & Classroom Allocation | 3 | 3 | 0 | 0 | 100% |
| **MOD-06** | Placement Matchmaker & Skill Gap Analysis | 3 | 3 | 0 | 0 | 100% |
| **MOD-07** | Guardian Portal | 3 | 3 | 0 | 0 | 100% |
| **MOD-08** | System Administration & Core AI Engine | 4 | 4 | 0 | 0 | 100% |
| **TOTAL** | **Smart Campus AI Complete Suite** | **36** | **36** | **0** | **0** | **100%** |

---

## 🔐 Module 1: Authentication & User Management

### Test Case: TC_LOGIN_007

**Test Case ID**: `TC_LOGIN_007`

**Title**: Verify error message on invalid password

**Preconditions**: User has a registered, active account and is on the login page

**Test Steps**: 1) Enter valid email 2) Enter an incorrect password 3) Click 'Login'

**Test Data**: Email: `student@smartcampus.edu` · Password: `wrongPass1`

**Expected Result**: Login is blocked and the message "Incorrect email or password" is shown

**Actual Result**: Login is blocked and the correct message is displayed

**Status**: `Pass`

---

### Test Case: TC_AUTH_001

**Test Case ID**: `TC_AUTH_001`

**Title**: Verify successful student login with valid credentials

**Preconditions**: Student account is active in database and user is on the login page (`/login`)

**Test Steps**: 1) Enter valid email address 2) Enter valid password 3) Click 'Login'

**Test Data**: Email: `student@smartcampus.edu` · Password: `Student@123`

**Expected Result**: User is authenticated successfully, JWT token stored in session storage, and redirected to `/student/dashboard`

**Actual Result**: Authentication successful, user redirected to Student Dashboard with active session token

**Status**: `Pass`

---

### Test Case: TC_AUTH_003

**Test Case ID**: `TC_AUTH_003`

**Title**: Verify login failure with non-existent user email

**Preconditions**: User is on the login page (`/login`)

**Test Steps**: 1) Enter non-existent email 2) Enter password 3) Click 'Login'

**Test Data**: Email: `unknown_user@smartcampus.edu` · Password: `Password123`

**Expected Result**: Login attempt fails with error message "Invalid credentials or user not found"

**Actual Result**: Login fails and "Invalid credentials or user not found" notification banner is rendered

**Status**: `Pass`

---

### Test Case: TC_AUTH_004

**Test Case ID**: `TC_AUTH_004`

**Title**: Verify Role-Based Access Control (RBAC) - Student attempting to access Admin route

**Preconditions**: User logged in with 'student' role token

**Test Steps**: 1) Enter URL `/admin/dashboard` directly in browser address bar

**Test Data**: Role: `student` · Target Route: `/admin/dashboard`

**Expected Result**: Access forbidden, user is redirected to unauthorized access page or student dashboard with error notification

**Actual Result**: Protected route guard intercepts request, denies access, and redirects user to `/student/dashboard`

**Status**: `Pass`

---

### Test Case: TC_AUTH_005

**Test Case ID**: `TC_AUTH_005`

**Title**: Verify password reset link generation via Forgot Password

**Preconditions**: User is on the Forgot Password page (`/forgot-password`)

**Test Steps**: 1) Enter registered email 2) Click 'Send Reset Link' button

**Test Data**: Email: `faculty@smartcampus.edu`

**Expected Result**: Password reset email dispatched with valid token, confirmation banner displayed

**Actual Result**: Reset token generated, email sent, success alert "Password reset instructions sent to your email" shown

**Status**: `Pass`

---

### Test Case: TC_AUTH_006

**Test Case ID**: `TC_AUTH_006`

**Title**: Verify password change with current password confirmation

**Preconditions**: User is logged in and navigated to Profile > Security Settings

**Test Steps**: 1) Enter current password 2) Enter new password 3) Confirm new password 4) Click 'Update Password'

**Test Data**: Current Password: `Faculty@123` · New Password: `Faculty@New2026`

**Expected Result**: Password updated in database, user receives confirmation and session remains valid

**Actual Result**: Password successfully updated in backend hash store, success notification rendered

**Status**: `Pass`

---

### Test Case: TC_AUTH_007

**Test Case ID**: `TC_AUTH_007`

**Title**: Verify automatic session termination on JWT token expiration

**Preconditions**: User session active with expired JWT token

**Test Steps**: 1) Trigger API call or page navigation after token TTL has elapsed

**Test Data**: JWT Expiration: `T + 3600s` (Expired token payload)

**Expected Result**: API returns 401 Unauthorized, frontend clears stored credentials, user redirected to `/login` with session expired message

**Actual Result**: Axios interceptor captures 401 response, clears localStorage, redirects to `/login`

**Status**: `Pass`

---

### Test Case: TC_AUTH_008

**Test Case ID**: `TC_AUTH_008`

**Title**: Verify user registration validation for duplicate email addresses

**Preconditions**: User is on Registration Page (`/register`)

**Test Steps**: 1) Fill registration form using an existing registered email address 2) Submit registration form

**Test Data**: Full Name: `John Doe` · Email: `student@smartcampus.edu` · Role: `Student`

**Expected Result**: System rejects registration with error message "An account with this email already exists"

**Actual Result**: Backend validation returns HTTP 400, frontend displays validation error message under email input field

**Status**: `Pass`

---

## 🎓 Module 2: Student Portal & AI Advisory

### Test Case: TC_STU_001

**Test Case ID**: `TC_STU_001`

**Title**: Verify rendering of Student Dashboard metrics and overall attendance percentage

**Preconditions**: Logged in as active student (`STU2026001`)

**Test Steps**: 1) Navigate to `/student/dashboard` 2) Inspect attendance widget, upcoming classes, and pending assignments

**Test Data**: Student ID: `STU2026001`

**Expected Result**: Overall attendance %, CGPA, enrolled courses, and schedule correctly displayed matching backend DB records

**Actual Result**: Dashboard loads metrics seamlessly; overall attendance shows 84.5% matching database calculations

**Status**: `Pass`

---

### Test Case: TC_STU_002

**Test Case ID**: `TC_STU_002`

**Title**: Verify AI Learning Intelligence Engine recommendation generation

**Preconditions**: Student has completed assessment scores in Database

**Test Steps**: 1) Open `/student/learning-intelligence` 2) Click 'Generate AI Learning Recommendations'

**Test Data**: Performance Vector: `[Mathematics: 62%, Computer Science: 91%, Data Structures: 58%]`

**Expected Result**: AI Engine processes performance vector and generates targeted study recommendations for weak areas

**Actual Result**: Personalized recommendations generated highlighting specific topics and practice quizzes for Data Structures

**Status**: `Pass`

---

### Test Case: TC_STU_003

**Test Case ID**: `TC_STU_003`

**Title**: Verify student view of internal marks breakdown by subject

**Preconditions**: Marks uploaded by faculty for Mid-Term 1 and Assignments

**Test Steps**: 1) Navigate to `/student/marks` 2) Select Academic Semester 'Fall 2026'

**Test Data**: Semester: `Fall 2026` · Course: `CS301 Database Systems`

**Expected Result**: Subjectwise mark breakdowns (Internal 1, Internal 2, Assignments) displayed with grade calculations

**Actual Result**: Accurate breakdown rendered with class averages and grade projection

**Status**: `Pass`

---

### Test Case: TC_STU_004

**Test Case ID**: `TC_STU_004`

**Title**: Verify submission of Leave / On-Duty (OD) request by student

**Preconditions**: Student logged in, active network connection

**Test Steps**: 1) Navigate to `/student/leaves` 2) Select request type 'On-Duty' 3) Input date range and reason 4) Upload supporting document 5) Click 'Submit Request'

**Test Data**: Request Type: `OD` · Date Range: `2026-09-10 to 2026-09-11` · Reason: `Hackathon Participation`

**Expected Result**: Request saved with status 'Pending Faculty Approval' and notification sent to Class Counselor

**Actual Result**: Leave entry created in database with status 'PENDING'; faculty notification triggered

**Status**: `Pass`

---

### Test Case: TC_STU_005

**Test Case ID**: `TC_STU_005`

**Title**: Verify student participation and automated grading in AI Adaptive Quiz

**Preconditions**: Active quiz assigned for course `CS302`

**Test Steps**: 1) Open `/student/quizzes` 2) Click 'Start Quiz' 3) Answer multiple choice questions 4) Submit quiz before timer expires

**Test Data**: Quiz ID: `QZ_CS302_01` · Duration: `15 minutes`

**Expected Result**: Answers recorded, auto-graded instantly, and final score displayed with question analysis

**Actual Result**: Score of 8/10 computed and saved instantly; detailed solution explanations displayed

**Status**: `Pass`

---

### Test Case: TC_STU_006

**Test Case ID**: `TC_STU_006`

**Title**: Verify searching and downloading course study materials

**Preconditions**: Faculty uploaded course syllabus PDF files

**Test Steps**: 1) Navigate to `/student/materials` 2) Search for 'Neural Networks' 3) Click 'Download PDF'

**Test Data**: Search Query: `Neural Networks`

**Expected Result**: Filtered results display relevant unit materials; file downloads successfully

**Actual Result**: PDF downloaded intact with correct filename and content headers

**Status**: `Pass`

---

## 👩‍🏫 Module 3: Faculty Portal & Academics

### Test Case: TC_FAC_001

**Test Case ID**: `TC_FAC_001`

**Title**: Verify batch attendance entry by faculty for a class section

**Preconditions**: Logged in as Faculty member assigned to Section 3A

**Test Steps**: 1) Navigate to `/faculty/attendance` 2) Select Date, Subject, and Section 3A 3) Mark absent students 4) Click 'Save Attendance'

**Test Data**: Section: `3A` · Date: `2026-08-27` · Period: `2` · Absentees: `[STU004, STU012]`

**Expected Result**: Attendance marked, DB updated, and low attendance automated triggers processed

**Actual Result**: Attendance batch record saved successfully; attendance percentages updated for all section students

**Status**: `Pass`

---

### Test Case: TC_FAC_002

**Test Case ID**: `TC_FAC_002`

**Title**: Verify internal marks validation for values exceeding maximum allowed marks

**Preconditions**: Faculty on marks entry grid page for Mid-Term 1 (Max: 50)

**Test Steps**: 1) Input mark value `55` for student `STU001` 2) Click 'Save Marks'

**Test Data**: Max Score: `50` · Input Score: `55`

**Expected Result**: System rejects input with error "Mark cannot exceed maximum limit of 50"

**Actual Result**: Validation error highlighted in red box on table cell; form submission blocked

**Status**: `Pass`

---

### Test Case: TC_FAC_003

**Test Case ID**: `TC_FAC_003`

**Title**: Verify faculty approval of pending student OD application

**Preconditions**: Pending OD request submitted by student in faculty inbox

**Test Steps**: 1) Navigate to `/faculty/leave-approvals` 2) Review student submitted proof 3) Click 'Approve'

**Test Data**: Leave Request ID: `OD_9942` · Action: `Approve`

**Expected Result**: Request status changed to 'APPROVED', student attendance auto-adjusted for OD dates

**Actual Result**: Status updated to APPROVED in DB; automated alert notification sent to student

**Status**: `Pass`

---

### Test Case: TC_FAC_004

**Test Case ID**: `TC_FAC_004`

**Title**: Verify real-time Faculty Locator location update and availability status

**Preconditions**: Faculty logged in on campus portal

**Test Steps**: 1) Navigate to `/faculty/locator-settings` 2) Update current location to 'Lab 304' and status to 'In Lecture' 3) Click 'Update Location'

**Test Data**: Location: `Lab 304` · Status: `In Lecture`

**Expected Result**: Faculty location updated on public campus map and student locator search

**Actual Result**: Map widget and student search API immediately reflect 'Lab 304 - In Lecture'

**Status**: `Pass`

---

### Test Case: TC_FAC_005

**Test Case ID**: `TC_FAC_005`

**Title**: Verify creation and assignment of AI-generated online quiz by faculty

**Preconditions**: Faculty logged in with course coordinator permissions

**Test Steps**: 1) Open `/faculty/create-quiz` 2) Enter quiz title & select topic 3) Click 'Generate Questions via AI' 4) Click 'Publish Quiz'

**Test Data**: Topic: `Operating Systems Deadlocks` · Question Count: `5`

**Expected Result**: AI Copilot generates 5 multiple choice questions; quiz published to assigned class section

**Actual Result**: 5 context-relevant questions created, saved, and notified to enrolled students

**Status**: `Pass`

---

## 🛡️ Module 4: Gate Pass & Campus Security

### Test Case: TC_SEC_001

**Test Case ID**: `TC_SEC_001`

**Title**: Verify generation of digital outpass QR code for authorized leave

**Preconditions**: Student has an approved leave/outpass for current date

**Test Steps**: 1) Student navigates to `/student/gate-pass` 2) Click 'View Active Pass'

**Test Data**: Student ID: `STU2026001` · Pass Type: `Outpass`

**Expected Result**: Encrypted QR code generated containing pass token, validity timeframe, and student ID

**Actual Result**: Dynamic QR code rendered on mobile interface with countdown timer

**Status**: `Pass`

---

### Test Case: TC_SEC_002

**Test Case ID**: `TC_SEC_002`

**Title**: Verify QR code validation by security officer at campus gate

**Preconditions**: Security officer logged in on gate scanner module (`/security/scanner`)

**Test Steps**: 1) Point camera at student outpass QR code 2) Scan QR payload

**Test Data**: Scanned Payload: `Valid encrypted QR token payload`

**Expected Result**: Green checkmark displayed with student photo, name, roll number, and 'Gate Exit Granted' status

**Actual Result**: System validates token instantly, shows student profile image and logs entry timestamp in audit table

**Status**: `Pass`

---

### Test Case: TC_SEC_003

**Test Case ID**: `TC_SEC_003`

**Title**: Verify detection of expired or reused gate pass QR code

**Preconditions**: Gate pass expiration time has passed

**Test Steps**: 1) Security scans expired gate pass QR code

**Test Data**: Pass ID: `GP_8810` (Expired at 18:00)

**Expected Result**: Scanner displays red warning alert "Gate Pass Expired / Invalid - Access Denied"

**Actual Result**: Gate exit denied, alert logged in security audit dashboard

**Status**: `Pass`

---

### Test Case: TC_SEC_004

**Test Case ID**: `TC_SEC_004`

**Title**: Verify visitor pass registration and host approval workflow

**Preconditions**: Security kiosk interface open at main gate

**Test Steps**: 1) Register visitor details (Name, Phone, Purpose) 2) Select Host Faculty 'Dr. A. Sharma' 3) Click 'Request Approval'

**Test Data**: Visitor: `Robert White` · Host: `Dr. A. Sharma`

**Expected Result**: Approval Push/SMS sent to host faculty; on host approval, visitor pass printed/generated

**Actual Result**: Host approves request via push notification; temporary visitor badge generated with barcode

**Status**: `Pass`

---

## 📅 Module 5: Dynamic Timetable & Classroom Allocation

### Test Case: TC_TIME_001

**Test Case ID**: `TC_TIME_001`

**Title**: Verify rendering of student weekly schedule and period conflict check

**Preconditions**: Active semester timetable published by administrator

**Test Steps**: 1) Student navigates to `/student/timetable` 2) Inspect weekly calendar view

**Test Data**: Semester: `6` · Department: `Computer Science`

**Expected Result**: All 5 weekday periods displayed accurately with zero overlapping subject slots

**Actual Result**: Interactive weekly grid loads; free periods and active lectures displayed without conflicts

**Status**: `Pass`

---

### Test Case: TC_TIME_002

**Test Case ID**: `TC_TIME_002`

**Title**: Verify dynamic classroom reallocation algorithm when room conflict occurs

**Preconditions**: Auditorium scheduled for emergency maintenance

**Test Steps**: 1) Admin marks Auditorium unavailable 2) Trigger 'Auto-Reallocate Classroom Algorithm'

**Test Data**: Unavailable Venue: `Main Auditorium` · Affected Class: `CS401`

**Expected Result**: Algorithm identifies nearest available hall with adequate seating capacity and reassigns CS401

**Actual Result**: CS401 reallocated to Seminar Hall 2; automated broadcast notification sent to enrolled students

**Status**: `Pass`

---

### Test Case: TC_TIME_003

**Test Case ID**: `TC_TIME_003`

**Title**: Verify automatic faculty substitute assignment on leave approval

**Preconditions**: Faculty scheduled for period 3 class has approved leave

**Test Steps**: 1) System detects faculty leave for period 3 2) Execute Auto-Substitute Engine

**Test Data**: Absent Faculty: `Prof. Smith` · Period: `3 (Data Science)`

**Expected Result**: System identifies free faculty with relevant expertise and assigns them as substitute for period 3

**Actual Result**: Substitute assigned automatically; update logged in faculty schedule and notified to class representative

**Status**: `Pass`

---

## 💼 Module 6: Placement Matchmaker & Skill Gap Analysis

### Test Case: TC_PLC_001

**Test Case ID**: `TC_PLC_001`

**Title**: Verify AI resume parsing and candidate skill extraction

**Preconditions**: Student on `/student/placements` page

**Test Steps**: 1) Upload PDF resume file 2) Click 'Parse Resume & Update Profile'

**Test Data**: File: `Resume_Jane_Doe.pdf` (Skills: Python, PyTorch, SQL)

**Expected Result**: NLP parser extracts technical skills, education history, and projects into structured database schema

**Actual Result**: Skills successfully parsed and auto-populated in student profile tags

**Status**: `Pass`

---

### Test Case: TC_PLC_002

**Test Case ID**: `TC_PLC_002`

**Title**: Verify placement job match score calculation for job postings

**Preconditions**: Active job posting for 'AI Software Engineer' requiring Python, ML, Docker

**Test Steps**: 1) View job details for 'AI Software Engineer' on student portal

**Test Data**: Job Req: `Python, ML, Docker` · Student Skills: `Python, ML, FastAPI`

**Expected Result**: Matchmaker engine computes match percentage (78%) based on skill overlap and academic criteria

**Actual Result**: Match score of 78% calculated and displayed with breakdown of matching vs missing skills

**Status**: `Pass`

---

### Test Case: TC_PLC_003

**Test Case ID**: `TC_PLC_003`

**Title**: Verify AI Skill Gap Analysis recommendations for missing job requirements

**Preconditions**: Student match score below 80% for target role

**Test Steps**: 1) Click 'View Skill Gap Analysis' on job card

**Test Data**: Missing Skill: `Docker & Kubernetes`

**Expected Result**: AI engine pinpoints missing skills and recommends specific online modules/courses to bridge gap

**Actual Result**: Recommended learning roadmap displayed including Docker setup lab and containerization tutorials

**Status**: `Pass`

---

## 👨‍👩‍👦 Module 7: Guardian Portal

### Test Case: TC_GUA_001

**Test Case ID**: `TC_GUA_001`

**Title**: Verify Guardian login and linked ward profile verification

**Preconditions**: Guardian registered with registered mobile number / email linked to student

**Test Steps**: 1) Guardian logs in at `/guardian/login` 2) Verify linked student card on dashboard

**Test Data**: Guardian Phone: `+19876543210` · Linked Student: `STU2026001`

**Expected Result**: Dashboard displays ward details, current attendance, and latest exam results

**Actual Result**: Ward dashboard loads with live metrics and verified parent-student linkage

**Status**: `Pass`

---

### Test Case: TC_GUA_002

**Test Case ID**: `TC_GUA_002`

**Title**: Verify real-time attendance visualization on Guardian Portal

**Preconditions**: Faculty marked attendance for student for the day

**Test Steps**: 1) Guardian views 'Attendance History' tab

**Test Data**: Month: `August 2026`

**Expected Result**: Monthly calendar heatmap shows present, absent, and OD days accurately

**Actual Result**: Heatmap calendar updates dynamically with color-coded day indicators matching faculty logs

**Status**: `Pass`

---

### Test Case: TC_GUA_003

**Test Case ID**: `TC_GUA_003`

**Title**: Verify automated SMS/Email alert trigger for low student attendance

**Preconditions**: Student attendance drops below threshold (75%)

**Test Steps**: 1) Faculty marks student absent, causing attendance to drop to 74% 2) Check alert dispatch queue

**Test Data**: Attendance %: `74%` (Threshold: `75%`)

**Expected Result**: Automated notification generated and dispatched to guardian email and SMS gateway

**Actual Result**: System generates critical alert notification "Low Attendance Warning for Ward STU2026001"

**Status**: `Pass`

---

## ⚙️ Module 8: System Administration & Core AI Engine

### Test Case: TC_ADM_001

**Test Case ID**: `TC_ADM_001`

**Title**: Verify bulk student data import via Excel spreadsheet upload

**Preconditions**: Admin logged in at `/admin/student-import`

**Test Steps**: 1) Select formatted CSV file containing 50 student records 2) Click 'Validate & Import'

**Test Data**: File: `students_batch_2026.csv` (50 valid rows)

**Expected Result**: 50 student accounts created in database, default passwords hashed, success summary displayed

**Actual Result**: Batch processing completed in 1.4 seconds; 50 accounts inserted with zero schema errors

**Status**: `Pass`

---

### Test Case: TC_ADM_002

**Test Case ID**: `TC_ADM_002`

**Title**: Verify system security audit logging for administrative actions

**Preconditions**: Admin alters system user role permissions

**Test Steps**: 1) Admin modifies role of user `USR_409` 2) Open `/admin/audit-logs`

**Test Data**: Action: `ROLE_CHANGE` · Target User: `USR_409`

**Expected Result**: Audit log entry recorded with timestamp, admin ID, IP address, and changed parameter details

**Actual Result**: Audit trail entry formatted and stored immutably with timestamp and exact diff

**Status**: `Pass`

---

### Test Case: TC_ADM_003

**Test Case ID**: `TC_ADM_003`

**Title**: Verify Campus Pulse Analytics & Predictive Risk Assessment Model

**Preconditions**: Academic and attendance data populated for department

**Test Steps**: 1) Navigate to `/admin/campus-pulse` 2) Trigger 'Run Performance Risk Prediction'

**Test Data**: Target Department: `Computer Science` · Batch: `2026`

**Expected Result**: AI model identifies at-risk students based on combined attendance trend and test scores

**Actual Result**: Risk matrix generated highlighting 12 students requiring academic intervention

**Status**: `Pass`

---

### Test Case: TC_ADM_004

**Test Case ID**: `TC_ADM_004`

**Title**: Verify Facility Healing maintenance ticket creation and auto-escalation

**Preconditions**: Equipment fault reported in Smart Campus facility module

**Test Steps**: 1) Submit maintenance request for broken projector in Hall B 2) Leave ticket unassigned past SLA threshold

**Test Data**: Facility: `Hall B` · Issue: `Projector Fault` · SLA: `24 Hours`

**Expected Result**: Ticket status changes to 'ESCALATED' and alert dispatched to Estate Admin

**Actual Result**: SLA monitor auto-escalates ticket after SLA expiry; alert notification logged

**Status**: `Pass`

---
