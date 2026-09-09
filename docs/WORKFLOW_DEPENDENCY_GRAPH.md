# Smart Campus AI — Workflow Dependency Graphs

This document details the multi-role handoffs, intermediate checkpoints, database side-effects, and notification pathways across all major business processes.

---

## 1. Autonomous Gate Pass & Perimeter Security Flow

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Frontend as Student Portal
    participant API as FastAPI GatePass Router
    participant Service as GatePassService (AI Rules Engine)
    participant DB as MySQL Database
    actor Guardian
    actor Warden
    actor Security as Security Guard

    Student->>Frontend: Request Pass (Outpass / Weekend / Emergency)
    Frontend->>API: POST /api/v1/gate-pass/request
    API->>Service: Evaluate AI Risk Score & Rules
    alt Weekend Leave / High Risk
        Service->>DB: INSERT GatePass (status: PENDING_PARENT_OTP)
        Service->>Guardian: SMS 6-Digit OTP Generated (e.g. 849201)
        Guardian->>Frontend: Enter OTP via Guardian Portal
        Frontend->>API: POST /api/v1/gate-pass/verify-parent-otp
        API->>DB: UPDATE GatePass (parent_verified=True, status: PENDING_WARDEN_APPROVAL)
        Warden->>Frontend: 1-Click Warden Review (/gate-pass-admin)
        Frontend->>API: POST /api/v1/gate-pass/warden-action (approve)
        API->>DB: UPDATE GatePass (warden_approved=True, status: APPROVED)
    else Low Risk Day Outpass
        Service->>DB: INSERT GatePass (auto_approved=True, status: APPROVED)
    end
    API->>DB: Generate Signed Minimal-PII QR Token & Nonce
    API-->>Student: Return Approved Gate Pass with Signed QR
    
    Note over Student,Security: Student reaches Campus Gate
    Security->>Frontend: Scan QR Code (/gate-security)
    Frontend->>API: POST /api/v1/gate-pass/exit (qr_token)
    API->>DB: UPDATE GatePass (status: OUT, actual_exit_time: NOW())
    API->>DB: INSERT GatePassAuditLog (action: EXITED)
    
    Note over Student,Security: Student returns to Campus
    Security->>Frontend: Scan QR Code on Return
    Frontend->>API: POST /api/v1/gate-pass/return (qr_token)
    API->>DB: UPDATE GatePass (status: RETURNED, actual_return_time: NOW())
    API->>DB: INSERT GatePassAuditLog (action: RETURNED)

    opt Overdue Check (Background Engine)
        API->>DB: Scan Passes where status=OUT and NOW() > expected_return_time
        API->>DB: UPDATE GatePass (status: OVERDUE)
        API->>DB: INSERT GatePassAuditLog (action: OVERDUE)
        API->>Warden: Urgent Push Notification
    end
```

---

## 2. Student Leave & On-Duty (OD) Multi-Tier Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant API as Workflows Router (/workflows)
    participant DB as MySQL DB
    actor Faculty as Faculty Advisor
    actor HOD as Head of Department

    Student->>API: POST /workflows/leaves (type, dates, reason, advisor_id)
    API->>DB: INSERT StudentLeave (status: 'Pending Faculty Review')
    API->>DB: INSERT Notification (target_role: 'faculty', user_id: advisor_id)
    
    Faculty->>API: GET /workflows/leaves (filters for assigned students)
    Faculty->>API: PUT /workflows/leaves/{id}/review (status: 'Pending HOD Approval', comment)
    API->>DB: UPDATE StudentLeave (faculty_reviewer_id, reviewed_at, comment)
    API->>DB: INSERT Notification (target_role: 'hod', dept: student.department)
    API->>DB: INSERT Notification (target_role: 'student', user_id: student.id)
    
    HOD->>API: GET /workflows/leaves (filters for department students)
    alt Approved by HOD
        HOD->>API: PUT /workflows/leaves/{id}/approve (status: 'Approved', comment)
        API->>DB: UPDATE StudentLeave (status: 'Approved', hod_reviewer_id, reviewed_at)
        API->>DB: INSERT Notification (Student: Leave Approved)
    else Rejected by HOD
        HOD->>API: PUT /workflows/leaves/{id}/approve (status: 'Rejected', comment)
        API->>DB: UPDATE StudentLeave (status: 'Rejected', hod_reviewer_id, reviewed_at)
        API->>DB: INSERT Notification (Student: Leave Rejected)
    end
    Student->>API: GET /workflows/leaves (views updated status & feedback comments)
```

---

## 3. Assignment Lifecycle Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Faculty
    participant API as Assignments Router (/assignments)
    participant DB as MySQL DB
    actor Student

    Faculty->>API: POST /assignments (title, subject, due_date, year, section)
    API->>DB: INSERT Assignment
    API->>DB: INSERT Notification (Target: Enrolled Section Students)
    
    Student->>API: GET /assignments (list active assignments)
    Student->>API: POST /assignments/{id}/submit (submission_text, file_url)
    API->>DB: INSERT Submission (status: 'submitted', submitted_at: NOW())
    API->>DB: INSERT Notification (Faculty: New Student Submission)
    
    Faculty->>API: GET /assignments/{id}/submissions
    Faculty->>API: PUT /assignments/submissions/{sub_id}/grade (marks, feedback)
    API->>DB: UPDATE Submission (marks_obtained, feedback, graded_at: NOW())
    API->>DB: INSERT Notification (Student: Assignment Graded)
    
    Student->>API: GET /assignments/student/analytics (view updated GPA/submission metric)
```

---

## 4. Attendance Recording & Recalculation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Faculty
    participant API as Attendance Router (/attendance)
    participant DB as MySQL DB
    actor Student

    Faculty->>API: GET /attendance/students?department=CSE
    Faculty->>API: POST /attendance/bulk (subject, date, records[{student_id, status}])
    API->>DB: Bulk INSERT Attendance records
    
    Student->>API: GET /attendance/my
    API->>DB: SELECT Attendance WHERE student_id = current_user.id
    API->>API: Aggregate Present / Total classes per Subject
    API->>API: Compute cumulative Attendance %
    alt Attendance < 75%
        API->>Student: Shortage Warning & Recommended Classes Needed
    else Attendance >= 75%
        API->>Student: Safe-Bunk Allowance Calculation
    end
```

---

## 5. Placement Drive & Candidate Application Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Placement Officer / Admin
    participant API as Placements Router (/placements)
    participant DB as MySQL DB
    actor Student

    Admin->>API: POST /placements (company_id, title, package_lpa, eligibility, deadline)
    API->>DB: INSERT Placement
    API->>DB: INSERT Notification (Target: Final Year Students)
    
    Student->>API: GET /placements (view open drives, eligibility criteria)
    Student->>API: POST /placements/{id}/apply (resume_url)
    API->>DB: INSERT PlacementApplication (status: 'applied')
    
    Admin->>API: GET /placements/{id}/applications
    Admin->>API: PUT /placements/applications/{app_id}/status (status: 'shortlisted' | 'selected')
    API->>DB: UPDATE PlacementApplication (status, offer_status)
    API->>DB: INSERT Notification (Student: Application Status Changed)
    
    Student->>API: GET /placements (views 'Applied' / 'Shortlisted' badge)
```
