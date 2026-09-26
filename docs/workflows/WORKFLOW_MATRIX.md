# Smart Campus AI — Business Workflow Matrix

This matrix maps every core business workflow discovered across the Smart Campus AI Platform. Each workflow traces the complete path: from the **Initiator**, through **Intermediary Reviews/Actions**, to the **Final Authorizing Role**, with underlying **Database Entities**, **Notification Dispatches**, and **Terminal System States**.

---

| Workflow ID | Business Workflow | Initiator Role | Intermediary Role(s) | Final Approving Role | Database Tables Impacted | Notifications Emitted | Terminal / State Values |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **WF-GP-01** | Day Outpass (Autonomous AI) | Student | AI Risk Engine (`auto_approved`) | Security Guard (Exit/Return Scan) | `gate_passes`, `gate_pass_audit_logs` | Real-time WebSocket + DB alert to Student & Security | `APPROVED` $\rightarrow$ `OUT` $\rightarrow$ `RETURNED` |
| **WF-GP-02** | Weekend Hostel Leave | Student | Parent Guardian (6-Digit SMS OTP) $\rightarrow$ Warden/HOD | Security Guard | `gate_passes`, `gate_pass_audit_logs`, `notifications` | SMS OTP to Guardian, Alert to Warden, Result to Student | `SUBMITTED` $\rightarrow$ `PENDING_PARENT_OTP` $\rightarrow$ `PENDING_WARDEN_APPROVAL` $\rightarrow$ `APPROVED` $\rightarrow$ `OUT` $\rightarrow$ `RETURNED` |
| **WF-GP-03** | Overdue Curfew Violation | System Engine | Background Scheduler | Warden & Admin | `gate_passes`, `gate_pass_audit_logs`, `notifications` | Urgent Overdue Alert dispatched to Warden, Admin & Parent | `OUT` $\rightarrow$ `OVERDUE` |
| **WF-LV-01** | Student Leave Application | Student | Faculty Advisor (Review & Forward) | Head of Department (HOD) | `student_leaves`, `users`, `notifications` | Notification to Advisor on apply, to HOD on review, to Student on decision | `Pending Faculty Review` $\rightarrow$ `Pending HOD Approval` $\rightarrow$ `Approved` / `Rejected` |
| **WF-OD-01** | On-Duty (OD) Event Leave | Student | Faculty Advisor (Review & Forward) | Head of Department (HOD) | `student_ods`, `users`, `notifications` | Notification to Advisor, to HOD, and final status to Student | `Pending Faculty Review` $\rightarrow$ `Pending HOD Approval` $\rightarrow$ `Approved` / `Rejected` |
| **WF-ATT-01** | Single / Period Attendance | Faculty | None | Faculty / System | `attendance`, `users` | Shortage alert if cumulative % drops below 75% | `present` / `absent` / `late` / `od` |
| **WF-ATT-02** | Bulk Class Attendance | Faculty | None | Faculty / System | `attendance`, `users` | Class-wide attendance update notification | Committed per student record |
| **WF-ASN-01** | Coursework Assignment | Faculty | Student (Submission) | Faculty (Grading) | `assignments`, `submissions`, `notifications` | Notification to Section students on create, to Faculty on submit, to Student on grade | `published` $\rightarrow$ `submitted` $\rightarrow$ `graded` |
| **WF-TT-01** | CSP Timetable Scheduling | Admin | Dynamic Classroom Reallocation (DCRA) | Admin (Confirmation) | `timetables`, `timetable_entries`, `classroom_allocations` | Class schedule update notification to enrolled students & faculty | `DRAFT` $\rightarrow$ `ACTIVE` |
| **WF-PL-01** | Campus Placement Drive | Admin / Placement Officer | Student (Application with Resume) | Placement Officer (Shortlist) | `companies`, `placements`, `placement_applications` | New Drive notification to eligible students; Shortlist update alert | `open` $\rightarrow$ `applied` $\rightarrow$ `shortlisted` / `rejected` / `selected` |
| **WF-EV-01** | Campus Event Registration | Admin / Faculty (Publish) | Student (Self-Registration) | Event Organizer (QR Check-in) | `events`, `event_registrations` | Registration confirmation notification | `UPCOMING` $\rightarrow$ `REGISTERED` $\rightarrow$ `CHECKED_IN` |
| **WF-SM-01** | Study Material Upload | Faculty / Admin | AI Engine (Unit & Tag Categorization) | Faculty (Publish) | `study_materials`, `notifications` | New material alert sent to department students | `SAVED` & Indexed |
| **WF-FR-01** | Peer Discussion Thread | Student / Faculty | Community Peers (Replies) | Faculty / Admin (Moderation & Pin) | `forum_posts`, `forum_replies` | Notification to author on peer reply | `Active` $\rightarrow$ `Pinned` / `Closed` |
| **WF-AI-01** | AI SGPA Risk & Study Plan | Student | SGPA Prediction Engine | Student (Task Progress Toggle) | `student_study_plans`, `study_sessions` | Proactive risk warning alert if projected SGPA < 6.0 | `PREDICTED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED` |
| **WF-CP-01** | Campus Pulse Telemetry | System Engine | IoT / Activity Aggregator | Admin / HOD (Observability) | `campus_pulse_snapshots`, `classrooms` | Real-time WebSocket pulse metrics push | Live Snapshot Recorded |

---

## Detailed State Transition Life Cycles

### 1. Gate Pass Multi-Tier State Machine
```text
[STUDENT APPLIES]
       │
       ▼
 [ELIGIBILITY & AI RISK CHECK]
       │
       ├── Low Risk & Day Pass ──────► [APPROVED]
       │                                   │
       └── High Risk or Weekend Leave      │
               │                           │
               ▼                           │
       [PENDING_PARENT_OTP]                │
               │                           │
         Parent enters OTP                 │
               │                           │
               ▼                           │
       [PENDING_WARDEN_APPROVAL]           │
               │                           │
         Warden 1-Click Approve            │
               │                           │
               ▼                           │
          [APPROVED] ◄─────────────────────┘
               │
      Security Scans QR Exit
               │
               ▼
             [OUT]
               │
       ┌───────┴────────────────────────┐
       │                                │
 Student returns in window        Curfew exceeded
       │                                │
       ▼                                ▼
  [RETURNED]                        [OVERDUE]
 (Terminal: OK)                         │
                                        ▼
                                Warden/Parent Alerted
```

### 2. Student Leave & On-Duty Approval Cycle
```text
[STUDENT SUBMITS LEAVE / OD]
             │
             ▼
[Pending Faculty Review]
             │
     Faculty Advisor Action
      ┌──────┴──────────────────────┐
      │                             │
Forward (Status: Recommended)    Reject
      │                             │
      ▼                             ▼
[Pending HOD Approval]          [Rejected]
      │                        (Terminal)
  HOD Action
┌─────┴──────────────┐
│                    │
Approve            Reject
│                    │
▼                    ▼
[Approved]       [Rejected]
(Terminal)       (Terminal)
```
