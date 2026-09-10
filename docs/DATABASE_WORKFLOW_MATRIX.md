# DATABASE WORKFLOW MATRIX SPECIFICATION
## Smart Campus AI Management System — Relational Schemas, Foreign Keys, State Columns, & Lifecycle Mutations

**Document Version:** 1.0.0  
**Date:** September 2026  
**RDBMS:** PostgreSQL / SQLite Compatible (SQLAlchemy ORM)

---

## 1. Relational Entity Relationship Diagram (Textual Representation)

```
       +---------------------------------------------+
       |                    User                     |
       +---------------------------------------------+
       | id (PK)                                     |
       | email (Unique)                              |
       | role [student|guardian|faculty|hod|sec|adm] |
       | department                                  |
       | advisor_id  ------> [User.id (Faculty)]     |
       | guardian_id ------> [User.id (Guardian)]    |
       +---------------------------------------------+
              |                               |
              | (student_id)                  | (student_id)
              v                               v
+-------------------------------+   +-------------------------------+
|           GatePass            |   |         StudentLeave          |
+-------------------------------+   +-------------------------------+
| id (PK)                       |   | id (PK)                       |
| student_id (FK -> User.id)    |   | student_id (FK -> User.id)    |
| status (VARCHAR)              |   | leave_type (VARCHAR)          |
| departure_time (TIMESTAMP)    |   | start_date (DATE)             |
| return_time (TIMESTAMP)       |   | end_date (DATE)               |
| actual_departure (TIMESTAMP)  |   | status (VARCHAR)              |
| actual_return (TIMESTAMP)     |   | advisor_endorsed_at           |
| ai_risk_score (FLOAT)         |   | hod_approved_at               |
| parent_otp_hash (VARCHAR)     |   | reason (TEXT)                 |
+-------------------------------+   +-------------------------------+
              |
              | (pass_id)
              v
+-------------------------------+
|       GatePassAuditLog        |
+-------------------------------+
| id (PK)                       |
| pass_id (FK -> GatePass.id)   |
| previous_status (VARCHAR)     |
| new_status (VARCHAR)          |
| actor_id (FK -> User.id)      |
| actor_role (VARCHAR)          |
| timestamp (TIMESTAMP)         |
| remarks (TEXT)                |
+-------------------------------+
```

---

## 2. Table Lifecycle & Column Mutations Matrix

### 2.1 Table: `gate_passes`
| Operation / Phase | Affected Columns | Old Value $\rightarrow$ New Value | Initiating Actor | Validation Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **Request Creation** | `status`, `created_at`, `ai_risk_score` | $\emptyset \rightarrow$ `REQUESTED` or `PENDING_PARENT_OTP` | `Student` | Departure $\ge$ Now. Unique active pass per student. |
| **Parent Consent** | `status`, `parent_consent_at` | `PENDING_PARENT_OTP` $\rightarrow$ `PENDING_HOD_APPROVAL` | `Guardian` | OTP matches hash; OTP not expired. |
| **Parent Rejection** | `status`, `rejection_reason` | `PENDING_PARENT_OTP` $\rightarrow$ `REJECTED` | `Guardian` | Terminal transition. |
| **HOD Sanction** | `status`, `hod_approved_at`, `approved_by` | `PENDING_HOD_APPROVAL` $\rightarrow$ `APPROVED` | `HOD` | Department matches student department. |
| **HOD Rejection** | `status`, `rejection_reason` | `PENDING_HOD_APPROVAL` $\rightarrow$ `REJECTED` | `HOD` | Rejection justification recorded. |
| **Security Exit** | `status`, `actual_departure`, `exit_gate`| `APPROVED` $\rightarrow$ `OUT` | `Security` | Current time within pass departure window. |
| **Security Return (On-time)** | `status`, `actual_return`, `entry_gate` | `OUT` $\rightarrow$ `RETURNED` | `Security` | Return timestamp recorded. |
| **Security Return (Late)** | `status`, `actual_return`, `late_flag` | `OUT` $\rightarrow$ `OVERDUE` | `Security` | System logs overdue disciplinary tag. |

### 2.2 Table: `student_leaves`
| Operation / Phase | Affected Columns | Old Value $\rightarrow$ New Value | Initiating Actor | Validation Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **Application** | `status`, `created_at` | $\emptyset \rightarrow$ `PENDING_ADVISOR` | `Student` | End Date $\ge$ Start Date. |
| **Advisor Endorsement**| `status`, `advisor_endorsed_at` | `PENDING_ADVISOR` $\rightarrow$ `PENDING_HOD` | `Faculty` | Actor ID == Student's `advisor_id`. |
| **HOD Approval** | `status`, `hod_approved_at` | `PENDING_HOD` $\rightarrow$ `APPROVED` | `HOD` | Department matches student department. |
| **HOD Rejection** | `status`, `rejection_reason` | `PENDING_HOD` $\rightarrow$ `REJECTED` | `HOD` | Rejection reason required. |

### 2.3 Table: `attendances`
| Operation / Phase | Affected Columns | Old Value $\rightarrow$ New Value | Initiating Actor | Validation Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **Session Mark** | `status`, `recorded_by`, `session_date` | $\emptyset \rightarrow$ `PRESENT` \| `ABSENT` \| `LATE` | `Faculty` | Faculty teaches this subject. |
| **OD Regularization** | `status`, `updated_at`, `remarks` | `ABSENT` $\rightarrow$ `OD_EXCUSED` | `System` (HOD OD approval hook) | Valid approved `StudentLeave` exists for date. |

### 2.4 Table: `security_incidents`
| Operation / Phase | Affected Columns | Old Value $\rightarrow$ New Value | Initiating Actor | Validation Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **Incident Logged** | `status`, `severity`, `location` | $\emptyset \rightarrow$ `ACTIVE` | `Security` | Valid gate or campus location. |
| **Containment** | `status`, `contained_at` | `ACTIVE` $\rightarrow$ `CONTAINED` | `Security`, `Admin` | Containment log entry required. |
| **Resolution** | `status`, `resolved_at`, `resolution_notes`| `CONTAINED` $\rightarrow$ `RESOLVED` | `Security`, `Admin` | Resolution summary required. |

---

## 3. Database Indexes & Query Performance Standards

To guarantee sub-50ms API response times across the multi-role operating system:
1. `CREATE INDEX idx_gatepass_student_status ON gate_passes (student_id, status);`
2. `CREATE INDEX idx_gatepass_status ON gate_passes (status);`
3. `CREATE INDEX idx_attendance_student_subject ON attendances (student_id, subject_id);`
4. `CREATE INDEX idx_user_guardian ON users (guardian_id);`
5. `CREATE INDEX idx_user_advisor ON users (advisor_id);`
6. `CREATE INDEX idx_user_department ON users (department, role);`
