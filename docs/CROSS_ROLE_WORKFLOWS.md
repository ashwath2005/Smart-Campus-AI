# CROSS-ROLE WORKFLOWS SPECIFICATION
## Smart Campus AI Management System — Multi-Persona Event Chains & Propagation Rules

**Document Version:** 1.0.0  
**Date:** September 2026  
**Focus:** Exact Causality Chains Across Roles

---

## 1. Cross-Role Event Cascade Architecture

Every business workflow in Smart Campus traverses multiple user roles. The table below documents the exact sender $\rightarrow$ receiver linkages, transport channels, and downstream UI consequences.

```
+-----------------------------------------------------------------------------------+
|                           CROSS-ROLE INTERACTION MAP                              |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|     +-----------+            (Request)            +------------+                  |
|     |  STUDENT  | ------------------------------> |  GUARDIAN  |                  |
|     +-----------+                                 +------------+                  |
|           ^                                             |                         |
|           | (Status Update)                             | (OTP Consent)           |
|           v                                             v                         |
|     +-----------+         (Dept Decision)         +------------+                  |
|     | SECURITY  | <------------------------------ |    HOD     |                  |
|     +-----------+                                 +------------+                  |
|           |                                             ^                         |
|           | (Scan Checkout)                             | (Endorsement)           |
|           v                                             |                         |
|     +-----------+         (Mark Absence)          +------------+                  |
|     |   ADMIN   | <------------------------------ |  FACULTY   |                  |
|     +-----------+                                 +------------+                  |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Event Cascade 1: Student Gate Pass & Perimeter Crossing

### Causality Sequence:
1. **Student (`CS001`)** fills form in `GatePass.jsx` and clicks `Submit Request`.
   - **Backend:** `POST /api/v1/gate-pass/request`
   - **DB:** Creates `GatePass` row (`id=452`, `status="PENDING_PARENT_OTP"`).
   - **Notification Service:** Dispatches SMS OTP + WebSocket event `PARENT_PASS_REQUEST` targeting `guardian_id = gdn_001`.
2. **Guardian (`gdn_001`)** is viewing `GuardianGatePass.jsx`.
   - **UI Consequence:** Without page reload, the active pass card illuminates: *"New Outing Request from Rahul Sharma (CS001) - Needs Verification"*.
   - **Action:** Guardian reviews reason ("Attending Tech Symposium in Chennai"), verifies 6-digit OTP `849201`, and clicks **Authorize Outing**.
   - **Backend:** `POST /api/v1/guardian/gate-pass/verify-otp`
   - **DB:** Updates `GatePass.status = "PENDING_HOD_APPROVAL"`, records `parent_consent_at = NOW()`.
   - **Notification Service:** Emits `HOD_PASS_ESCALATION` to `hod_cse_01`.
3. **HOD (`hod_cse_01`)** is viewing `HodDashboard.jsx`.
   - **UI Consequence:** The *Gate Pass Authorization Queue* updates, showing Rahul Sharma with AI Risk Score: `14% (Low Risk, 88% Attendance)`.
   - **Action:** HOD clicks **Approve Pass**.
   - **Backend:** `POST /api/v1/gate-pass/452/approve`
   - **DB:** Updates `GatePass.status = "APPROVED"`, generates cryptographic dynamic token `gp_tok_9f3a1...`.
   - **Notification Service:** Emits `GATE_PASS_READY` to Student and `PASS_APPROVED_ALERT` to Guardian.
4. **Student (`CS001`)** in `GatePass.jsx`.
   - **UI Consequence:** Step tracker marks "Department Approved" green; live dynamic QR code unlocks on screen.
5. **Security Officer (`sec_gate_01`)** at Main Gate in `GateSecurity.jsx`.
   - **Action:** Security Officer scans QR code or enters Roll `CS001`.
   - **Backend:** `POST /api/v1/gate-pass/verify` returns Student photo, approved validity range (`16:00 - 20:00`), and status `APPROVED`.
   - **Action:** Officer clicks **Confirm Campus Exit**.
   - **Backend:** `POST /api/v1/gate-pass/452/scan-exit`
   - **DB:** Updates `GatePass.status = "OUT"`, `actual_departure = NOW()`, `exit_gate = "MAIN_GATE"`.
   - **Notification Service:** Emits `STUDENT_EXITED_CAMPUS` to Guardian and Student.
   - **Guardian UI Consequence:** Ward Telemetry status pill changes from green `ON CAMPUS` to amber `OUT OF CAMPUS (Departed Main Gate 16:05)`.
6. **Security Officer** records return later that evening.
   - **Action:** Security Officer scans QR code upon return.
   - **Backend:** `POST /api/v1/gate-pass/452/scan-return`
   - **DB:** Checks current timestamp vs `valid_until`. Since $19:45 \le 20:00$, sets `GatePass.status = "RETURNED"`, `actual_return = NOW()`.
   - **Notification Service:** Emits `STUDENT_RETURNED_CAMPUS` to Guardian.
   - **Guardian UI Consequence:** Ward status flips back to green `ON CAMPUS (Returned Main Gate 19:45)`.

---

## 3. Event Cascade 2: Attendance Marking & Parent Risk Intervention

### Causality Sequence:
1. **Faculty (`fac_cse_01`)** opens `FacultyDashboard.jsx` &rarr; Attendance Section.
   - Selects Course: `CS301 - Operating Systems`, Period: `2 (10:00 AM - 11:00 AM)`.
   - Marks Student `CS001 (Rahul Sharma)` as **Absent**.
   - Clicks **Submit Attendance**.
2. **Backend Processing:**
   - `POST /api/v1/attendance/submit-session`
   - Inserts record into `attendance` table.
   - Runs aggregate calculation: Rahul Sharma attended sessions drop from 94/114 ($82.5\%$) down to 74.8% due to unexcused absences.
   - Trigger condition met: $\text{Attendance \%} < 75.0\%$.
3. **Downstream Escalation:**
   - **Student Dashboard:** Urgent banner appears: *"Attendance Alert: Operating Systems attendance dropped to 74.8%. Risk of debarment from semester exams."*
   - **Guardian Portal:** Critical alert appears in red callout: *"Academic Alert: Rahul Sharma has fallen below mandatory 75% attendance in CS301."*
   - **HOD Dashboard:** Student card appears in CSE Academic Intervention Radar.
   - **Faculty Advisor:** Prompted to schedule counseling session.

---

## 4. Event Cascade 3: On-Duty (OD) Regularization & Automatic Attendance Credit

### Causality Sequence:
1. **Student (`CS001`)** submits an OD application for representing the university at the National Hackathon (2 days).
2. **Faculty Advisor (`fac_cse_01`)** reviews the invitation letter and marks **Endorsed**.
3. **HOD (`hod_cse_01`)** reviews the application in `HodDashboard.jsx` and clicks **Approve OD**.
4. **Backend System Hook:**
   - `POST /api/v1/leaves-od/89/decision` with `status: "APPROVED"`.
   - Hook queries all `attendance` rows for `CS001` during the approved dates.
   - Updates `attendance.status` from `ABSENT` to `OD_EXCUSED`.
   - Recalculates student attendance percentage back above 75.0%.
5. **Downstream UI Consequence:**
   - Student's attendance gauge turns green immediately.
   - Guardian portal clears the low attendance warning.
   - HOD dashboard removes student from the at-risk list.

---

## 5. Event Cascade 4: Perimeter Security Incident Escalation

### Causality Sequence:
1. **Security Officer (`sec_gate_01`)** detects an unauthorized vehicle attempting to bypass the North Gate boom barrier.
2. Officer clicks **Report Security Incident** in `GateSecurity.jsx`.
   - Inputs Title: *"Unauthorized Vehicle Breach Attempt"*, Location: *"North Gate"*, Severity: *"CRITICAL"*.
   - Clicks **Dispatch Alert**.
3. **Backend Processing:**
   - `POST /api/v1/security/incidents`
   - Inserts `SecurityIncident` with status `ACTIVE`.
   - Broadcasts real-time WebSocket packet across `ROLE_ADMIN` and `ROLE_SECURITY` channels.
4. **Admin Dashboard Consequence:**
   - Immediate high-priority toast and flashing HUD counter: *"CRITICAL INCIDENT: North Gate"*.
   - 3D Digital Twin camera smoothly pans to North Gate perimeter and renders a red pulsating sphere.
5. **Security Checkpoints:**
   - All gate consoles lock outbound gate passes until officer issues an "ALL CLEAR".
