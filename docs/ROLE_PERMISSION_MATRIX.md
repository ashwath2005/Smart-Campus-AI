# ROLE PERMISSION MATRIX
## Smart Campus AI Management System — Comprehensive RBAC & Object Scoping Specification

**Document Version:** 1.0.0  
**Security Standard:** NIST SP 800-162 (ABAC/RBAC Hybrid), Principle of Least Privilege (PoLP)  
**Roles Covered:** `student`, `guardian`, `faculty`, `hod`, `admin`, `security`

---

## 1. Matrix Overview & Permission Codes

- **C** = Create
- **R** = Read (All)
- **R(O)** = Read (Owned / Scoped Entities Only)
- **R(D)** = Read (Departmental Scope Only)
- **R(W)** = Read (Assigned Ward Only)
- **U** = Update (Unrestricted)
- **U(O)** = Update (Owned Entities Only)
- **U(W)** = Update / Approve (Assigned Ward Only)
- **U(D)** = Update / Approve (Departmental Scope Only)
- **D** = Delete
- **A** = Approve / Reject Transition
- **S** = Security Scan / Physical Checkpoint Verification
- **—** = Forbidden (HTTP 403 Forbidden / HTTP 401 Unauthorized)

---

## 2. Master Entity Permission Matrix

| Functional Resource / Domain | Student | Guardian | Faculty | HOD | Security | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Authentication & Profile** |
| User Profile | R(O), U(O) | R(O), U(O) | R(O), U(O) | R(O), U(O) | R(O), U(O) | C, R, U, D |
| Password / Credentials | U(O) | U(O) | U(O) | U(O) | U(O) | U |
| **Academic & Attendance** |
| Attendance Records | R(O) | R(W) | C, R(D), U(D) | R(D), U(D) | — | C, R, U, D |
| Coursework & Assignments | R(O), C(Sub) | R(W) | C, R(D), U(D), D | R(D) | — | C, R, U, D |
| Subject Roster & Syllabus | R | — | R, U(D) | R(D), U(D) | — | C, R, U, D |
| Academic Velocity & GPA | R(O) | R(W) | R(D) | R(D) | — | R |
| **Gate Passes & Movement** |
| Gate Pass Creation | C | — | — | — | — | C |
| Gate Pass Reading | R(O) | R(W) | R(D) | R(D) | R | R |
| Parent OTP Consent | — | U(W), A(W) | — | — | — | A |
| Departmental / HOD Approval| — | — | R(D) | A(D) | — | A |
| Physical Gate Verification | — | — | — | — | S | S |
| Gate Pass Policy Config | R | — | — | — | — | C, R, U, D |
| **Leaves & On-Duty (OD)** |
| Leave / OD Application | C, R(O) | R(W) | R(D), A(Endorse) | R(D), A(D) | — | C, R, U, D |
| Leave Policy Rules | R | — | R | R | — | C, R, U, D |
| **Safety, Incidents & Twin** |
| Security Incidents / Alerts | C(Report), R | R(W) | C(Report), R | C(Report), R | C, R, U, A | C, R, U, D |
| Digital Twin 3D Telemetry | R | — | R | R(D) | R | R, U |
| Real-time Headcount HUD | R | — | — | R(D) | R | R |
| **System Administration** |
| User Directory & Role Assign| — | — | — | — | — | C, R, U, D |
| Immutable Audit Logs | — | — | — | — | — | R (Append Only) |
| System Health & Metrics | — | — | — | — | — | R, U |

---

## 3. Object-Level Scoping Policies (ABAC Rules)

### 3.1 Student Scoping
- A student is bounded strictly to their `user_id`:
  $$\text{GatePass.student\_id} == \text{current\_user.id}$$
  $$\text{Attendance.student\_id} == \text{current\_user.id}$$
  $$\text{StudentLeave.student\_id} == \text{current\_user.id}$$
- Accessing or modifying records of another student returns **HTTP 403 Forbidden**.

### 3.2 Guardian Scoping
- A guardian is bounded strictly to students where:
  $$\text{User.guardian\_id} == \text{current\_user.id}$$
- All queries for passes, attendance, or ward telemetry must include the filter:
  `WHERE student.guardian_id = :guardian_id`
- Any attempt to provide OTP consent for an unrelated student returns **HTTP 403 Forbidden**.

### 3.3 Faculty Advisor Scoping
- An advisor is bounded to students where:
  $$\text{User.advisor\_id} == \text{current\_user.id}$$
- Class instructors are scoped to attendance sessions where:
  $$\text{AttendanceSession.faculty\_id} == \text{current\_user.id}$$

### 3.4 HOD Scoping
- An HOD is bounded strictly to their department:
  $$\text{student.department} == \text{current\_user.department}$$
- Actions attempting to approve leaves, view attendance, or inspect passes for other departments return **HTTP 403 Forbidden**.

### 3.5 Security Officer Scoping
- Security personnel are bounded strictly to physical checkpoint actions:
  - Allowed: Read active passes, verify tokens, mark `OUT`, mark `RETURNED`, report gate incidents.
  - Denied: Mutating academic records, changing student grades, approving leaves, altering user accounts.

### 3.6 Administrator Scoping
- Campus Administrators possess cross-tenant governance rights, but mutations to financial or grade records remain subject to cryptographic audit logging.

---

## 4. Enforcement Strategy
All FastAPI route handlers enforce these rules through:
1. `get_current_user`: Extracts JWT, verifies validity, unpacks `role`, `id`, and `department`.
2. `require_roles([Role.HOD, Role.ADMIN])`: Fast dependency validation.
3. Explicit query predicates: Direct SQLAlchemy filter expressions preventing horizontal privilege escalation (IDOR).
