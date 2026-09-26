# ROLE ACTION MATRIX
## Smart Campus AI Management System — UI Action to Backend Endpoint & State Change Specification

**Document Version:** 1.0.0  
**Date:** September 2026  
**Scope:** Complete Front-to-Back Mapping across all 6 Roles

---

## 1. Student Actions (`/dashboard`, `/attendance`, `/gate-pass`, `/assignments`, `/leaves`)

| UI Component / Trigger | Visual Location | Backend Endpoint Called | HTTP Verb | Request Payload Highlights | Downstream State & DB Changes | Real-Time Event Emitted |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **Request Gate Pass** | `GatePass.jsx` &rarr; Submit Button | `/api/v1/gate-pass/request` | `POST` | `{reason, pass_type, departure_time, return_time}` | Creates `GatePass` with `status: PENDING_PARENT_OTP` or `PENDING_HOD_APPROVAL`. | `GATE_PASS_REQUESTED` to Guardian & HOD |
| **Apply for Leave / OD** | `LeavesOD.jsx` &rarr; Submit Form | `/api/v1/leaves-od/apply` | `POST` | `{leave_type, start_date, end_date, reason, documents}` | Inserts `StudentLeave` record with `status: PENDING_ADVISOR`. | `LEAVE_APPLIED` to Faculty Advisor |
| **Submit Assignment** | `Assignments.jsx` &rarr; Upload & Submit | `/api/v1/assignments/submit` | `POST` | `{assignment_id, file_url, comments}` | Inserts `AssignmentSubmission` record, marks status `SUBMITTED`. | `ASSIGNMENT_SUBMITTED` to Faculty |
| **Report Grievance** | `Grievances.jsx` &rarr; Submit Ticket | `/api/v1/grievance/submit` | `POST` | `{category, description, urgency, anonymous}` | Inserts `GrievanceTicket` with `status: OPEN`. | `GRIEVANCE_FILED` to Admin |

---

## 2. Guardian Actions (`/guardian-gate-pass`)

| UI Component / Trigger | Visual Location | Backend Endpoint Called | HTTP Verb | Request Payload Highlights | Downstream State & DB Changes | Real-Time Event Emitted |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **Authorize Pass (OTP)** | `GuardianGatePass.jsx` &rarr; Verify Button | `/api/v1/guardian/gate-pass/verify-otp` | `POST` | `{pass_id, otp_code, consent: true}` | Transitions `GatePass.status` from `PENDING_PARENT_OTP` to `PENDING_HOD_APPROVAL`. | `PARENT_CONSENT_GRANTED` to HOD & Student |
| **Reject Pass (OTP)** | `GuardianGatePass.jsx` &rarr; Decline Button | `/api/v1/guardian/gate-pass/verify-otp` | `POST` | `{pass_id, remarks, consent: false}` | Transitions `GatePass.status` to `REJECTED`. | `GATE_PASS_REJECTED` to Student |
| **Refresh Ward State** | `GuardianGatePass.jsx` &rarr; Live Refresh Pill | `/api/v1/guardian/ward-status` | `GET` | *(Query)* | Refreshes ward location, active passes, and attendance. | None (Synchronous Read) |
| **Acknowledge Risk Alert** | `GuardianGatePass.jsx` &rarr; Alert Banner | `/api/v1/guardian/acknowledge-alert`| `POST` | `{alert_id, student_id}` | Updates alert record `acknowledged_at`. | `ALERT_ACKNOWLEDGED` to Advisor |

---

## 3. Faculty Advisor / Instructor Actions (`/faculty`)

| UI Component / Trigger | Visual Location | Backend Endpoint Called | HTTP Verb | Request Payload Highlights | Downstream State & DB Changes | Real-Time Event Emitted |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **Submit Attendance Sheet** | `FacultyDashboard.jsx` &rarr; Save Session | `/api/v1/attendance/submit-session` | `POST` | `{subject_code, date, period, records: [{student_id, status}]}` | Bulk creates `Attendance` records. Recalculates student aggregate %. | `ATTENDANCE_RECORDED`; triggers `ATTENDANCE_RISK_ALERT` if <75% |
| **Endorse Student Leave** | `FacultyDashboard.jsx` &rarr; Endorse Button | `/api/v1/leaves-od/{id}/endorse` | `POST` | `{endorsement: true, remarks}` | Updates `StudentLeave.status` to `PENDING_HOD`. | `LEAVE_ENDORSED` to HOD |
| **Grade Assignment** | `FacultyDashboard.jsx` &rarr; Post Grade | `/api/v1/assignments/grade` | `POST` | `{submission_id, score, max_score, feedback}` | Updates `AssignmentSubmission.grade`, triggers Academic Velocity update. | `GRADE_POSTED` to Student |
| **Update Campus Presence** | `FacultyDashboard.jsx` &rarr; Status Switcher | `/api/v1/faculty/presence` | `PUT` | `{status: "In Office" \| "In Lecture"}` | Updates `FacultyProfile.current_status`. | `FACULTY_PRESENCE_CHANGED` to Dept |

---

## 4. Head of Department (HOD) Actions (`/hod`)

| UI Component / Trigger | Visual Location | Backend Endpoint Called | HTTP Verb | Request Payload Highlights | Downstream State & DB Changes | Real-Time Event Emitted |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **Approve Gate Pass** | `HodDashboard.jsx` &rarr; Quick Approve | `/api/v1/gate-pass/{id}/approve` | `POST` | `{pass_id, decision: "APPROVED"}` | Transitions `GatePass.status` to `APPROVED`. Activates cryptographic QR code token. | `GATE_PASS_APPROVED` to Student, Guardian, Security |
| **Reject Gate Pass** | `HodDashboard.jsx` &rarr; Reject Button | `/api/v1/gate-pass/{id}/approve` | `POST` | `{pass_id, decision: "REJECTED", reason}` | Transitions `GatePass.status` to `REJECTED`. | `GATE_PASS_REJECTED` to Student & Guardian |
| **Approve Leave / OD** | `HodDashboard.jsx` &rarr; Leave Queue Approve | `/api/v1/leaves-od/{id}/decision` | `POST` | `{decision: "APPROVED", remarks}` | Transitions `StudentLeave.status` to `APPROVED`. If OD, credits attendance automatically. | `LEAVE_APPROVED` to Student & Advisor |
| **Broadcast Dept Circular**| `HodDashboard.jsx` &rarr; Post Circular | `/api/v1/department/circular` | `POST` | `{title, content, target_years}` | Inserts `Announcement` scoped to department. | `CIRCULAR_BROADCAST` to Dept Students & Faculty |

---

## 5. Security Officer Actions (`/gate-security`)

| UI Component / Trigger | Visual Location | Backend Endpoint Called | HTTP Verb | Request Payload Highlights | Downstream State & DB Changes | Real-Time Event Emitted |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **Scan Token / RFID** | `GateSecurity.jsx` &rarr; Scanner Field | `/api/v1/gate-pass/verify` | `POST` | `{token: "GP_HASH_OR_ID"}` | Validates token signature, returns student identity, status, and photo. | None (Synchronous Verification) |
| **Record Physical Exit** | `GateSecurity.jsx` &rarr; Confirm Exit | `/api/v1/gate-pass/{id}/scan-exit` | `POST` | `{pass_id, gate_id: "MAIN_GATE"}` | Transitions `status` to `OUT`. Records `actual_departure`. Appends audit log. | `STUDENT_EXITED_CAMPUS` to Guardian, Student, Admin HUD |
| **Record Physical Return** | `GateSecurity.jsx` &rarr; Confirm Entry | `/api/v1/gate-pass/{id}/scan-return`| `POST` | `{pass_id, gate_id: "MAIN_GATE"}` | Transitions `status` to `RETURNED` (or `OVERDUE` if past `valid_until`). | `STUDENT_RETURNED_CAMPUS` to Guardian & Student |
| **Report Incident** | `GateSecurity.jsx` &rarr; Incident Modal | `/api/v1/security/incidents` | `POST` | `{title, location, severity, description}` | Inserts `SecurityIncident`. Increments active alerts on Admin HUD. | `CRITICAL_SECURITY_ALERT` to Admin & Security Fleet |

---

## 6. Administrator Actions (`/admin`)

| UI Component / Trigger | Visual Location | Backend Endpoint Called | HTTP Verb | Request Payload Highlights | Downstream State & DB Changes | Real-Time Event Emitted |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **Toggle User Status** | `AdminDashboard.jsx` &rarr; User Table Toggle | `/api/v1/admin/users/{id}/status` | `PUT` | `{is_active: true \| false}` | Sets `User.is_active`. If inactive, revokes active JWT tokens. | `USER_STATUS_REVOKED` to User Session |
| **Update Pass Policy** | `AdminDashboard.jsx` &rarr; Policy Config | `/api/v1/admin/policy/gate-pass` | `PUT` | `{curfew_time, parent_otp_required, max_duration}` | Updates `GatePassPolicy` row in DB. | `SYSTEM_POLICY_UPDATED` to System |
| **Trigger Campus Lock** | `AdminDashboard.jsx` &rarr; Emergency Action | `/api/v1/admin/emergency-lock` | `POST` | `{scope: "ALL_GATES", reason}` | Freezes all gate pass approvals and alerts all security gates. | `EMERGENCY_LOCKDOWN` Broadcast to All |
| **Export Audit Logs** | `AdminDashboard.jsx` &rarr; Export CSV | `/api/v1/admin/audit-logs/export` | `GET` | *(Query filters)* | Generates tamper-evident cryptographic CSV stream. | Logs read action in Audit Ledger |
