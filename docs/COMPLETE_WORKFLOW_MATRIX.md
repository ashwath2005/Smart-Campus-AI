# COMPLETE WORKFLOW MATRIX
## Smart Campus AI Management System — End-to-End Enterprise Operational Lifecycles

**Document Version:** 1.0.0  
**Date:** September 2026  
**Scope:** 7 Core Cross-Role Campus Lifecycles

---

## 1. Lifecycle Overview & Inventory

```
+-------------------------------------------------------------------------------+
|                      7 COMPLETE CAMPUS BUSINESS WORKFLOWS                     |
+-------------------------------------------------------------------------------+
|  1. Smart Gate Pass Lifecycle (Day-Out & Overnight)                           |
|  2. Multi-Tier Student Leave & On-Duty (OD) Regularization                    |
|  3. Class Attendance Capture & Automated Guardian Risk Escalation            |
|  4. Academic Coursework, Submission, Grading & Velocity Analytics            |
|  5. Campus Security Incident Dispatch, Checkpoint Alert & Admin Resolution    |
|  6. Student Grievance Redressal & Institutional Escalation                    |
|  7. Emergency Lockdown & High-Risk Curfew Automated Protocol                  |
+-------------------------------------------------------------------------------+
```

---

## 2. Workflow 1: Smart Gate Pass Lifecycle (Day-Out & Overnight)

### Workflow ID: `WF-GP-01`
- **Primary Roles:** Student $\rightarrow$ Guardian $\rightarrow$ HOD $\rightarrow$ Security Officer $\rightarrow$ Student/Guardian
- **Entities Involved:** `User`, `GatePass`, `GatePassPolicy`, `GatePassAuditLog`, `Notification`
- **Linear Stage Progression:**
  1. **Initiation (`Student`):** Student fills departure time, return time, category (`Personal`, `Emergency`, `Academic`), and reason. System calculates AI risk score based on student attendance %, past return timeliness, and time of day.
  2. **Parental Verification (`Guardian`):** If policy requires parent consent (e.g. overnight or weekday hours), status becomes `PENDING_PARENT_OTP`. 6-digit cryptographic OTP is dispatched. Guardian reviews reason, ward telemetry, and inputs OTP.
  3. **Departmental Sanction (`HOD`):** Upon OTP consent, pass enters HOD review queue (`PENDING_HOD_APPROVAL`). HOD inspects AI risk score, reason, and guardian remarks. HOD clicks **Approve** &rarr; state transitions to `APPROVED`.
  4. **Physical Gate Exit (`Security`):** Student presents dynamic QR code at security gate. Security Officer scans token. Backend verifies cryptographic signature and expiration. Gate officer clicks **Confirm Exit** &rarr; state transitions to `OUT`. Live student status flips to `OUT_OF_CAMPUS`. Real-time SMS/WebSocket alert arrives on Guardian portal.
  5. **Physical Gate Return (`Security`):** Student returns to gate. Security officer scans pass &rarr; checks if current time $\le$ `valid_until`. If on time, status transitions to `RETURNED`. If late, transitions to `OVERDUE` and files disciplinary flag. Student location switches back to `ON_CAMPUS`.
  6. **Immutable Audit:** Complete timestamped ledger recorded in `GatePassAuditLog`.

---

## 3. Workflow 2: Multi-Tier Student Leave & On-Duty (OD) Regularization

### Workflow ID: `WF-LOD-02`
- **Primary Roles:** Student $\rightarrow$ Faculty Advisor $\rightarrow$ HOD $\rightarrow$ Attendance Engine
- **Entities Involved:** `StudentLeave`, `Attendance`, `User`, `Notification`
- **Linear Stage Progression:**
  1. **Application:** Student selects leave type (`Medical`, `Personal`, `On-Duty Academic`, `Sports OD`), provides date range, reason, and supporting certificates. Status: `PENDING_ADVISOR`.
  2. **Advisor Endorsement:** Faculty Advisor receives notification, reviews academic standing, and endorses application with comments. Status: `PENDING_HOD`.
  3. **HOD Executive Decision:** HOD reviews endorsed application. HOD approves &rarr; status: `APPROVED`.
  4. **Downstream Attendance Crediting:** If approved as `OD`, system automatically traverses `Attendance` table for the specified date range and marks corresponding class sessions with status `OD_EXCUSED`, preserving student attendance percentage.
  5. **Student Notification:** Notification emitted to student with approval badge.

---

## 4. Workflow 3: Class Attendance Capture & Automated Guardian Risk Escalation

### Workflow ID: `WF-ATT-03`
- **Primary Roles:** Faculty Instructor $\rightarrow$ Student $\rightarrow$ Guardian $\rightarrow$ HOD
- **Entities Involved:** `AttendanceSession`, `Attendance`, `Notification`, `GuardianAlert`
- **Linear Stage Progression:**
  1. **Session Submission:** Faculty logs in, selects course (e.g., `CS301 - Operating Systems`), date, and period. Faculty marks Present / Absent / Late for each enrolled student and clicks **Submit Session**.
  2. **Database Aggregate Recalculation:** Backend writes attendance rows and recalculates the student's cumulative subject attendance:
     $$\text{Attendance \%} = \frac{\text{Attended Sessions}}{\text{Total Conducted Sessions}} \times 100$$
  3. **Risk Detection Guard:**
     - If $\text{Attendance \%} \ge 75\%$: Normal status recorded.
     - If $\text{Attendance \%} < 75\%$: System automatically flags student as `AT_RISK`.
  4. **Downstream Cascade:**
     - **Student Dashboard:** Displays high-priority warning badge in "What Needs My Attention?".
     - **Guardian Portal:** Emits critical callout banner: *"Attendance dropped below mandatory 75% threshold in CS301"*.
     - **HOD Risk Radar:** Student card appears in the departmental At-Risk Academic List for intervention.

---

## 5. Workflow 4: Academic Coursework, Submission, Grading & Velocity Analytics

### Workflow ID: `WF-ACAD-04`
- **Primary Roles:** Faculty $\rightarrow$ Student $\rightarrow$ Faculty $\rightarrow$ AI Analytics Engine
- **Entities Involved:** `Assignment`, `AssignmentSubmission`, `AcademicVelocityMetric`
- **Linear Stage Progression:**
  1. **Assignment Publication:** Faculty creates assignment with title, description, deadline, maximum marks, and attachments. Status: `ACTIVE`.
  2. **Student Hand-in:** Student uploads work before deadline. State transitions to `SUBMITTED`.
  3. **Faculty Assessment:** Faculty reviews submission, enters numeric score (e.g. 92/100) and qualitative feedback. Status transitions to `GRADED`.
  4. **Velocity Recomputation:** Background AI engine recalculates student's 7-week academic velocity score combining homework timeliness, score trends, and attendance stability.
  5. **Live Analytics Update:** Velocity bar chart on Student Dashboard updates dynamically.

---

## 6. Workflow 5: Security Incident Dispatch & Checkpoint Alert

### Workflow ID: `WF-SEC-05`
- **Primary Roles:** Security Officer $\rightarrow$ Campus Administrator $\rightarrow$ Security Fleet
- **Entities Involved:** `SecurityIncident`, `DigitalTwinTelemetry`, `AuditLog`
- **Linear Stage Progression:**
  1. **Incident Trigger:** Security Officer spots security anomaly (e.g., tailgating at East Gate, unverified vehicle, curfew violation).
  2. **Incident Dispatch:** Officer enters title, gate location, severity (`LOW`, `HIGH`, `CRITICAL`), and description in `GateSecurity.jsx`.
  3. **Event Broadcast:** Emits `SECURITY_ALERT` WebSocket event across the campus network.
  4. **Admin HUD Reception:** Admin Dashboard flashes alert badge; 3D Digital Twin highlights the zone with an active red pulsing marker.
  5. **Resolution:** Security / Admin marks incident `RESOLVED` with incident notes.

---

## 7. Workflow 6: Student Grievance Redressal & Institutional Escalation

### Workflow ID: `WF-GRV-06`
- **Primary Roles:** Student $\rightarrow$ Admin $\rightarrow$ Assigned Officer $\rightarrow$ Student
- **Entities Involved:** `GrievanceTicket`, `GrievanceComment`, `AuditLog`
- **Linear Stage Progression:**
  1. **Filing:** Student submits grievance under Category (`Hostel`, `Academics`, `Infrastructure`, `Harassment`). Option for anonymous submission.
  2. **Ticket Generation:** System generates tracking ticket `#GRV-2026-XXXX`. Status: `OPEN`.
  3. **Admin Assignment:** Administrator reviews grievance in central console and assigns investigation to responsible official. Status: `IN_PROGRESS`.
  4. **Resolution & Feedback:** Official logs resolution remarks. Admin marks ticket `RESOLVED`. Student receives notification to accept resolution or appeal.

---

## 8. Workflow 7: Emergency Lockdown & High-Risk Curfew Protocol

### Workflow ID: `WF-LCK-07`
- **Primary Roles:** Administrator $\rightarrow$ All Security Gates $\rightarrow$ Campus Population
- **Entities Involved:** `GatePassPolicy`, `GatePass`, `SecurityIncident`, `AuditLog`
- **Linear Stage Progression:**
  1. **Emergency Trigger:** Admin invokes Emergency Lock on Admin Dashboard.
  2. **Automated Gate Freeze:** Backend locks all gate passes in database:
     $$\forall p \in \text{GatePass}, p.\text{status} == \text{APPROVED} \implies p.\text{status} = \text{SUSPENDED}$$
  3. **Security Checkpoint Alarm:** All security consoles receive immediate audio-visual lockdown siren. Gate barriers lock.
  4. **Campus Broadcast:** Universal broadcast dispatched to all logged-in students, guardians, and faculty via WebSockets and SMS fallback.
  5. **Lift Lockdown:** Admin enters secondary authentication code to lift emergency freeze.
