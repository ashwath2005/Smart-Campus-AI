# Smart Campus AI — Master Test Case Specification
## Complete End-to-End Business Workflow Test Catalog

---

### Module 1: Authentication & Authorization (AUTH)

```text
TC-AUTH-001
Module: Authentication
Feature: Multi-Role Credential Login
Workflow: Role Login -> JWT Generation -> Role Redirection
Priority: Critical (P0)
Severity: Blocker
Preconditions: Test accounts for student, faculty, hod, admin, security, and guardian exist in MySQL.
Required Roles: Student, Faculty, HOD, Admin, Security, Guardian
Test Data:
  - student1@campus.com / password123
  - faculty1@campus.com / password123
  - hod1@campus.com / password123
  - admin@campus.com / password123
  - security@campus.com / password123
  - guardian@campus.com / password123
Steps:
  1. Send POST request to /api/v1/auth/login with valid email and password.
  2. Inspect response payload for access_token and user object.
  3. Validate role-based homepage redirection (student -> /dashboard, faculty -> /faculty, hod -> /hod, admin -> /admin, security -> /gate-security, guardian -> /guardian-gate-pass).
Expected Result: HTTP 200 returned with valid HS256 JWT containing sub, role, department, semester. Client routes to role home.
API Validation: POST /api/v1/auth/login returns status 200, schema contains access_token, token_type='bearer', user object.
Database Validation: SELECT * FROM users WHERE email = :email returns matching record with active status.
Notification Validation: N/A
Final State: User session active, token cached in localStorage.
Negative Cases:
  - Wrong password returns HTTP 401 "Invalid email/roll number or password".
  - Non-existent user returns HTTP 401.
  - Empty body returns HTTP 422 Unprocessable Entity.
Postconditions: Session established.
Automation Status: Automated (tests/api/test_master_api_suite.py)
```

```text
TC-AUTH-002
Module: Authorization & Role Boundaries (RBAC)
Feature: Cross-Role Endpoint Protection
Workflow: Role A attempts restricted action of Role B
Priority: Critical (P0)
Severity: Critical
Preconditions: Authenticated student session.
Required Roles: Student
Test Data: Student JWT token
Steps:
  1. Student requests Admin endpoint: GET /api/v1/admin/dashboard/stats.
  2. Student requests HOD approval endpoint: PUT /api/v1/workflows/leaves/1/approve.
  3. Student requests Security gate scan: POST /api/v1/gate-pass/exit.
Expected Result: Server intercepts unauthorized role and rejects with HTTP 403 Forbidden.
API Validation: Response status code strictly equals 403. Body contains detail: "Forbidden" or "Admin/Faculty role required".
Database Validation: Zero state mutations occur.
Notification Validation: No unauthorized notifications dispatched.
Final State: System state untouched, unauthorized breach prevented.
Negative Cases: Missing bearer token returns HTTP 401 Unauthorized.
Postconditions: Token remains valid for permitted student endpoints.
Automation Status: Automated (tests/security/test_security_suite.py)
```

```text
TC-AUTH-003
Module: Authentication & Security
Feature: Cryptographic JWT Tampering & Expiry
Workflow: Forged signature -> API validation
Priority: High (P1)
Severity: High
Preconditions: Active API server.
Required Roles: Anonymous / Attacker
Test Data:
  - Token with invalid signature: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.invalidsignature"
  - Expired token with exp < current timestamp
Steps:
  1. Transmit request to /api/v1/gate-pass/my-passes with forged signature token.
  2. Transmit request with expired token.
Expected Result: Both requests fail with HTTP 401 Unauthorized.
API Validation: HTTP 401 with detail "Could not validate credentials" or "Signature verification failed".
Database Validation: No queries executed on behalf of attacker.
Notification Validation: N/A
Final State: Attacker rejected.
Automation Status: Automated (tests/security/test_security_suite.py)
```

---

### Module 2: Autonomous AI Gate Pass & Perimeter Mobility (GP)

```text
TC-GP-001
Module: Gate Pass
Feature: Student Autonomous Day Outpass Request (Low Risk)
Workflow: Student Request -> AI Evaluation -> Instant Approval -> QR Generation
Priority: Critical (P0)
Severity: Blocker
Preconditions: Student is enrolled, has >= 75% attendance, no pending active passes.
Required Roles: Student
Test Data:
  - pass_type: "outpass"
  - reason: "Medical prescription pickup"
  - destination: "City Pharmacy, Gandhipuram"
  - return_hours: 3
Steps:
  1. Student logs in and navigates to /gate-pass.
  2. Submits outpass form with reason and duration.
  3. Backend GatePassService runs rule checks and AI risk evaluation.
  4. Response returns approved pass with cryptographic signed_qr_token.
Expected Result: Gate pass status becomes 'APPROVED' immediately. QR code rendered on student screen.
API Validation: POST /api/v1/gate-pass/request returns 200, status='APPROVED', auto_approved_by_ai=True, signed_qr_token is non-null.
Database Validation: Record inserted into gate_passes table with status='APPROVED', actual_exit_time=NULL. Audit log record created.
Notification Validation: Notification record created for student confirming instant approval.
Final State: Pass in APPROVED state awaiting physical exit scan.
Negative Cases: Requesting pass when another pass is already active returns HTTP 400 "Active pass already exists".
Postconditions: Pass ID available for security verification.
Automation Status: Automated (tests/workflows/test_master_workflows.py)
```

```text
TC-GP-002
Module: Gate Pass
Feature: Weekend Hostel Leave Multi-Tier Workflow
Workflow: Student -> AI Risk Engine -> Guardian OTP -> Warden Review -> Security
Priority: Critical (P0)
Severity: Blocker
Preconditions: Student is a hostel resident. Guardian phone and account exist.
Required Roles: Student, Guardian, Warden / HOD, Security
Test Data:
  - pass_type: "weekend_leave"
  - reason: "Family function & semester break"
  - destination: "Home (Salem, Tamil Nadu)"
  - return_hours: 48
  - Guardian OTP: "849201"
Steps:
  1. Student submits weekend leave request.
  2. System detects outstation weekend pass; flags status='PENDING_PARENT_OTP' and generates OTP '849201'.
  3. Guardian logs in to /guardian-gate-pass, views student's pending leave, enters OTP, and clicks Verify.
  4. Backend verifies OTP, marks parent_verified=True, transitions status='PENDING_WARDEN_APPROVAL'.
  5. Warden / HOD logs into /gate-pass-admin and performs 1-Click Approve.
  6. Pass status transitions to 'APPROVED'; signed QR token activated.
Expected Result: Full multi-tier chain completes without skipping parental consent or warden oversight.
API Validation:
  - POST /api/v1/gate-pass/request -> 200 (status: PENDING_PARENT_OTP)
  - POST /api/v1/gate-pass/verify-parent-otp -> 200 (success: True, status: PENDING_WARDEN_APPROVAL)
  - POST /api/v1/gate-pass/warden-action -> 200 (success: True, status: APPROVED)
Database Validation:
  - gate_passes: parent_verified=1, warden_approved=1, status='APPROVED'.
  - gate_pass_audit_logs contains entries for CREATED, VERIFIED_OTP, WARDEN_APPROVED.
Notification Validation: Notifications sent to Guardian (OTP alert), Warden (pending leave), and Student (approval).
Final State: Pass status is APPROVED.
Negative Cases: Entering incorrect OTP returns error "Invalid OTP code".
Automation Status: Automated (tests/workflows/test_master_workflows.py)
```

```text
TC-GP-003
Module: Gate Pass
Feature: Security Guard Physical Exit & Return Scan
Workflow: Security Exit Scan (OUT) -> Security Return Scan (RETURNED)
Priority: Critical (P0)
Severity: Blocker
Preconditions: Gate pass is in APPROVED status with valid signed_qr_token.
Required Roles: Security Guard
Test Data: signed_qr_token from TC-GP-001 or TC-GP-002
Steps:
  1. Security Officer opens Gate Security Mobility Portal (/gate-security).
  2. Security scans or submits signed_qr_token at exit checkpoint.
  3. GatePassService validates token signature and status=APPROVED.
  4. Pass status transitions to 'OUT'; actual_exit_time recorded as current timestamp.
  5. Student exits campus.
  6. Upon return, Security scans signed_qr_token at entry checkpoint.
  7. Pass status transitions to 'RETURNED'; actual_return_time recorded.
Expected Result: Both checkpoints successfully validate token and record entry/exit timestamps.
API Validation:
  - POST /api/v1/gate-pass/exit -> 200, status='OUT', actual_exit_time non-null.
  - POST /api/v1/gate-pass/return -> 200, status='RETURNED', actual_return_time non-null.
Database Validation:
  - gate_passes: status='RETURNED', actual_exit_time and actual_return_time populated.
  - gate_pass_audit_logs has 2 new logs: 'EXITED' and 'RETURNED'.
Notification Validation: Security mobility counter decrements active students outside campus.
Final State: Pass completed and archived.
Negative Cases:
  - Attempting exit on an already EXITED pass returns error "Student has already exited".
  - Attempting return on an un-exited pass returns error "Student has not exited yet".
  - Attempting scan with tampered token string returns HTTP 400 "Invalid or corrupt token".
Automation Status: Automated (tests/workflows/test_master_workflows.py)
```

```text
TC-GP-004
Module: Gate Pass
Feature: Automated Overdue Curfew Violation Scanner
Workflow: Student fails to return -> Background Scanner -> Incident Escalation
Priority: High (P1)
Severity: High
Preconditions: Gate pass with status='OUT' where expected_return_time < NOW().
Required Roles: System Background Engine, Warden, Admin
Test Data: Gate pass fixture with expected return set to 1 hour in the past.
Steps:
  1. Backend executes check_overdue_passes background task (or POST /gate-pass/check-overdue).
  2. Engine queries active passes where status='OUT' and expected_return_time + threshold < NOW().
  3. Engine transitions status to 'OVERDUE'.
  4. Generates urgent audit log and dispatches notifications to Warden and Guardian.
Expected Result: Overdue pass detected, flagged, and escalated immediately.
API Validation: POST /api/v1/gate-pass/check-overdue returns overdueCount >= 1 and pass details in overduePasses list.
Database Validation: gate_passes.status updated to 'OVERDUE'.
Notification Validation: Critical priority notification inserted for Warden and Guardian.
Final State: Pass marked OVERDUE on Warden security dashboard.
Automation Status: Automated (tests/workflows/test_master_workflows.py)
```

---

### Module 3: Student Leave & On-Duty (OD) Multi-Tier Approvals (LV / OD)

```text
TC-LV-001
Module: Workflows (Leave)
Feature: Complete Student Leave Application & 2-Tier Approval
Workflow: Student Apply -> Faculty Advisor Review -> HOD Approval -> Student Notification
Priority: Critical (P0)
Severity: Blocker
Preconditions: Student is assigned to a Faculty Advisor in the same department (CSE).
Required Roles: Student, Faculty (Advisor), HOD
Test Data:
  - leave_type: "Casual Leave"
  - start_date: "2026-10-01"
  - end_date: "2026-10-03"
  - reason: "Family event attendance"
Steps:
  1. Student submits leave via POST /workflows/leaves.
  2. System assigns leave to student's Faculty Advisor; status='Pending Faculty Review'.
  3. Faculty Advisor logs in, retrieves pending reviews via GET /workflows/leaves, and submits PUT /workflows/leaves/{id}/review with status='Pending HOD Approval' and comment="Recommended".
  4. Leave transitions to 'Pending HOD Approval'.
  5. HOD logs into /hod, views forwarded request, and submits PUT /workflows/leaves/{id}/approve with status='Approved' and comment="Approved by HOD".
Expected Result: Leave is fully approved through the designated academic chain.
API Validation:
  - POST /workflows/leaves -> 200, returns leave_id.
  - PUT /workflows/leaves/{id}/review -> 200, status='Pending HOD Approval'.
  - PUT /workflows/leaves/{id}/approve -> 200, status='Approved'.
Database Validation:
  - student_leaves: status='Approved', advisor_id populated, faculty_reviewer_id populated, hod_reviewer_id populated.
Notification Validation:
  - Advisor receives "New Student Leave Request"
  - HOD receives "Pending Student Leave Approval"
  - Student receives "Leave Request Approved"
Final State: Leave finalized as Approved.
Negative Cases:
  - Faculty from another department attempting review returns HTTP 403.
  - HOD from another department attempting approval returns HTTP 403.
  - Submitting start_date > end_date returns HTTP 400.
Automation Status: Automated (tests/workflows/test_master_workflows.py)
```

```text
TC-LV-002
Module: Workflows (Leave)
Feature: Leave Rejection Pathway with Justification
Workflow: Student Apply -> Faculty Advisor Rejects
Priority: High (P1)
Severity: Normal
Preconditions: Student leave submitted in 'Pending Faculty Review'.
Required Roles: Faculty (Advisor), Student
Test Data: Review status: "Rejected", comment: "Exam revision period; leave not granted"
Steps:
  1. Faculty Advisor reviews leave.
  2. Submits PUT /workflows/leaves/{id}/review with status='Rejected' and mandatory comment.
Expected Result: Leave transitions immediately to 'Rejected'. Does not escalate to HOD.
API Validation: PUT /workflows/leaves/{id}/review returns 200. GET /workflows/leaves reflects status='Rejected'.
Database Validation: student_leaves.status = 'Rejected', faculty_comment saved.
Notification Validation: Student receives notification: "Leave Request Reviewed by Faculty - Status: Rejected".
Final State: Leave closed as Rejected.
Automation Status: Automated (tests/workflows/test_master_workflows.py)
```

---

### Module 4: Attendance Management & Recalculation (ATT)

```text
TC-ATT-001
Module: Attendance
Feature: Faculty Single and Bulk Period Attendance Entry
Workflow: Faculty retrieves roster -> marks attendance -> student analytics updated
Priority: Critical (P0)
Severity: Blocker
Preconditions: Faculty is assigned to department; students exist in class roster.
Required Roles: Faculty, Student
Test Data:
  - subject: "Cloud Computing"
  - date: "2026-09-09"
  - records: [{student_id: 1, status: "present"}, {student_id: 2, status: "absent"}]
Steps:
  1. Faculty requests student list via GET /attendance/students?department=CSE.
  2. Faculty submits bulk attendance via POST /attendance/bulk.
  3. Student logs in and queries GET /attendance/my.
Expected Result: Bulk attendance persisted. Student's subject attendance % accurately recalculated.
API Validation:
  - GET /attendance/students returns list of students with roll_number and department.
  - POST /attendance/bulk returns status 200 with recorded count.
  - GET /attendance/my reflects incremented totalClasses and attended count for "Cloud Computing".
Database Validation: attendance table has rows with correct student_id, subject, status, date.
Notification Validation: If attendance drops below 75%, shortage alert notification created.
Final State: Records saved; student attendance percentage up to date.
Negative Cases: Student role attempting POST /attendance/bulk returns HTTP 403.
Automation Status: Automated (tests/workflows/test_master_workflows.py)
```

---

### Module 5: Assignments & Coursework Evaluation (ASN)

```text
TC-ASN-001
Module: Assignments
Feature: End-to-End Assignment Lifecycle (Create -> Submit -> Grade)
Workflow: Faculty Publishes -> Student Submits -> Faculty Grades -> Student Marks
Priority: High (P1)
Severity: Major
Preconditions: Faculty and Student are in the same department and section.
Required Roles: Faculty, Student
Test Data:
  - Assignment: title="Distributed Systems Lab 1", subject="Cloud Computing", due_date="2026-10-15", year="IV", section="A"
  - Submission: submission_text="Raft Consensus Algorithm implementation", file_url="https://drive.google.com/lab1.pdf"
  - Grading: marks_obtained=95.0, feedback="Excellent edge-case handling"
Steps:
  1. Faculty creates assignment via POST /assignments.
  2. Student views enrolled assignments via GET /assignments.
  3. Student submits work via POST /assignments/{id}/submit.
  4. Faculty views submissions via GET /assignments/{id}/submissions.
  5. Faculty grades submission via PUT /assignments/submissions/{sub_id}/grade.
  6. Student checks grade and feedback on their dashboard.
Expected Result: Entire assignment lifecycle completes; grade persisted and visible to student.
API Validation:
  - POST /assignments returns 200 and assignment ID.
  - POST /assignments/{id}/submit returns 200, status='submitted'.
  - PUT /assignments/submissions/{id}/grade returns 200, marks_obtained=95.
Database Validation:
  - assignments record created.
  - submissions record has marks_obtained=95.0, feedback recorded.
Notification Validation: Student notified upon grading.
Final State: Assignment completed and graded.
Negative Cases: Submitting after deadline flags submission as 'LATE' if accepted or rejects if locked.
Automation Status: Automated (tests/workflows/test_master_workflows.py)
```

---

### Module 6: Campus Placements & Recruitment (PL)

```text
TC-PL-001
Module: Placements
Feature: Placement Drive Creation, Student Application, and Status Progression
Workflow: Admin Creates Drive -> Student Applies -> Admin Updates Status
Priority: High (P1)
Severity: Major
Preconditions: Registered recruiting company exists in database.
Required Roles: Admin / Placement Officer, Student
Test Data:
  - Placement: title="Graduate Software Engineer", package_lpa=18.5, deadline="2026-12-31"
  - Application: resume_url="https://storage.campus.com/resumes/std1.pdf"
  - Status Update: status="shortlisted", interview_status="Round 1 Scheduled"
Steps:
  1. Admin creates placement drive via POST /placements.
  2. Student retrieves active drives via GET /placements; checks eligibility.
  3. Student applies via POST /placements/{id}/apply.
  4. Admin retrieves drive applicants via GET /placements/{id}/applications.
  5. Admin updates candidate status to 'shortlisted' via PUT /placements/applications/{app_id}/status.
Expected Result: Application correctly linked and status updated to shortlisted.
API Validation:
  - POST /placements returns created placement object with active=True.
  - POST /placements/{id}/apply returns 200.
  - PUT /placements/applications/{app_id}/status returns 200, status='shortlisted'.
Database Validation: placement_applications record has student_id, placement_id, status='shortlisted'.
Notification Validation: Student receives notification of shortlist status update.
Final State: Candidate shortlisted for Round 1 interview.
Negative Cases: Duplicate application by same student returns HTTP 400 "Already applied".
Automation Status: Automated (tests/workflows/test_master_workflows.py)
```

---

### Module 7: Campus Events & Technical Symposiums (EV)

```text
TC-EV-001
Module: Events
Feature: Event Publishing, Student Registration, and Capacity Tracking
Workflow: Organizer Publishes Event -> Student Registers -> Attendee Count Increments
Priority: Medium (P2)
Severity: Normal
Preconditions: Admin/Faculty session active.
Required Roles: Admin, Student
Test Data: title="National AI Symposium 2026", event_date="2026-11-20", venue="Convention Center"
Steps:
  1. Admin publishes event via POST /events.
  2. Student lists events via GET /events and observes registered=False.
  3. Student registers via POST /events/{id}/register.
  4. Student queries GET /events and verifies registered=True and registeredCount has incremented.
Expected Result: Registration confirmed; count incremented by 1.
API Validation: POST /events/{id}/register returns 200, registered=True.
Database Validation: Row inserted into event_registrations (event_id, student_id).
Notification Validation: Confirmation notification sent to student.
Final State: Student registered.
Negative Cases: Duplicate registration returns HTTP 400 "Already registered for this event".
Automation Status: Automated (tests/api/test_master_api_suite.py)
```

---

### Module 8: Peer Discussion Forum (FR)

```text
TC-FR-001
Module: Forum
Feature: Post Creation, Peer Reply, Upvote, and Ownership Moderation
Workflow: Student A posts -> Student B replies & upvotes -> Faculty moderates
Priority: Medium (P2)
Severity: Normal
Preconditions: Student A and Student B authenticated.
Required Roles: Student, Faculty
Test Data:
  - Post: title="Tips for Distributed Systems Midterm", body="Discussion on Paxos vs Raft"
  - Reply: content="Focus on leader election in Raft and heartbeat intervals."
Steps:
  1. Student A creates post via POST /forum/posts.
  2. Student B retrieves post and submits reply via POST /forum/posts/{id}/replies.
  3. Student B upvotes post via POST /forum/posts/{id}/upvote.
  4. Faculty pins the post via PUT /forum/posts/{id}/pin.
Expected Result: Post created, reply appended, upvote count incremented, post pinned.
API Validation:
  - POST /forum/posts returns 200 with post ID.
  - POST /forum/posts/{id}/replies returns 200 with reply ID.
  - PUT /forum/posts/{id}/pin (as faculty) returns 200, is_pinned=True.
Database Validation: forum_posts and forum_replies records created and linked via post_id foreign key.
Negative Cases: Student attempting to pin/unpin returns HTTP 403.
Automation Status: Automated (tests/api/test_master_api_suite.py)
```

---

### Module 9: Campus Pulse 3D & Spatial Telemetry (CP)

```text
TC-CP-001
Module: Campus Pulse
Feature: Real-Time Intelligence Score and Building Telemetry Stream
Workflow: System Telemetry Aggregation -> Real-time Pulse Retrieval -> History Snapshots
Priority: High (P1)
Severity: Normal
Preconditions: Campus facilities and room allocations exist.
Required Roles: Student, Faculty, Admin, HOD
Test Data: Timeframe query: "today"
Steps:
  1. Client sends GET /campus-pulse/current.
  2. Backend computes campus activity score (students, faculty, room utilization, lab load).
  3. Client queries GET /campus-pulse/history?timeframe=today.
  4. Client queries GET /campus-pulse/locations.
Expected Result: Returns comprehensive telemetry JSON with activityScore (0-100), breakdown scores, and location utilization.
API Validation: HTTP 200, payload contains activityScore, status, students, faculty, rooms, labs.
Database Validation: Snapshot saved to campus_pulse_snapshots table.
Final State: Dashboard and 3D digital twin HUD synchronized with real-time score.
Automation Status: Automated (tests/api/test_master_api_suite.py)
```

---

### Module 10: AI Intelligence & SGPA Risk Predictor (AI)

```text
TC-AI-001
Module: AI Intelligence
Feature: Predictive SGPA Early-Warning Engine & Study Plan Generation
Workflow: Student queries prediction -> Model computes academic risk -> 14-day study plan generated
Priority: High (P1)
Severity: Normal
Preconditions: Student has internal marks or semester course enrollment.
Required Roles: Student
Test Data: Endpoint GET /academic-risk/predict
Steps:
  1. Student navigates to /sgpa-predictor.
  2. Frontend queries GET /academic-risk/predict.
  3. Backend evaluates student internal assessments, past trends, and calculates predicted SGPA.
  4. Returns risk level (LOW, MEDIUM, HIGH) and dynamic 14-day study schedule.
Expected Result: Returns numeric predicted_sgpa, risk status, and actionable recommendations.
API Validation: HTTP 200, contains predicted_sgpa, risk_level, subjects_at_risk, recommendations.
Database Validation: Any toggled tasks saved to student_study_plans.
Final State: Student informed of academic risk before university exams.
Automation Status: Automated (tests/api/test_master_api_suite.py)
```
