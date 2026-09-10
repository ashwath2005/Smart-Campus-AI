# API ROLE MATRIX SPECIFICATION
## Smart Campus AI Management System — Authoritative Endpoint Access Control & Scope Validation

**Document Version:** 1.0.0  
**Date:** September 2026  
**Scope:** Complete Backend REST API Endpoint Inventory

---

## 1. Authentication & User Management Endpoints

| Method | Endpoint | Allowed Roles | Object Scoping Rule | Target Entity |
| :---: | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | None | User Token |
| `GET` | `/api/v1/auth/me` | All Roles | Current user token only | `User` |
| `PUT` | `/api/v1/auth/password` | All Roles | Current user ID only | `User` |
| `GET` | `/api/v1/admin/users` | `ADMIN` | Global | `User` |
| `PUT` | `/api/v1/admin/users/{id}/status` | `ADMIN` | Global | `User` |

---

## 2. Gate Pass & Perimeter Security Endpoints

| Method | Endpoint | Allowed Roles | Object Scoping Rule | Target Entity |
| :---: | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/gate-pass/request` | `STUDENT`, `ADMIN` | Current user ID only for student | `GatePass` |
| `GET` | `/api/v1/gate-pass/my-passes` | `STUDENT` | `student_id == current_user.id` | `GatePass` |
| `POST` | `/api/v1/gate-pass/{id}/cancel` | `STUDENT` | `student_id == current_user.id` | `GatePass` |
| `GET` | `/api/v1/gate-pass/pending-hod` | `HOD`, `ADMIN` | Scoped to HOD's department | `GatePass` |
| `POST` | `/api/v1/gate-pass/{id}/approve` | `HOD`, `ADMIN` | Scoped to student's department | `GatePass` |
| `POST` | `/api/v1/gate-pass/verify` | `SECURITY`, `ADMIN`| Any valid cryptographic token | `GatePass` |
| `POST` | `/api/v1/gate-pass/{id}/scan-exit` | `SECURITY`, `ADMIN`| Must be in `APPROVED` status | `GatePass` |
| `POST` | `/api/v1/gate-pass/{id}/scan-return`| `SECURITY`, `ADMIN`| Must be in `OUT` status | `GatePass` |
| `GET` | `/api/v1/gate-pass/active` | `SECURITY`, `ADMIN`| Currently active exits on campus | `GatePass` |

---

## 3. Guardian Portal Endpoints

| Method | Endpoint | Allowed Roles | Object Scoping Rule | Target Entity |
| :---: | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/guardian/ward-status` | `GUARDIAN` | `student.guardian_id == current_user.id` | `User`, `GatePass` |
| `GET` | `/api/v1/guardian/gate-pass/pending`| `GUARDIAN` | `student.guardian_id == current_user.id` | `GatePass` |
| `POST` | `/api/v1/guardian/gate-pass/verify-otp`| `GUARDIAN` | `student.guardian_id == current_user.id` | `GatePass` |
| `GET` | `/api/v1/guardian/ward-attendance` | `GUARDIAN` | `student.guardian_id == current_user.id` | `Attendance` |
| `POST` | `/api/v1/guardian/acknowledge-alert`| `GUARDIAN` | Scoped to ward alert | `GuardianAlert` |

---

## 4. Attendance & Academic Endpoints

| Method | Endpoint | Allowed Roles | Object Scoping Rule | Target Entity |
| :---: | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/attendance/my-record` | `STUDENT` | `student_id == current_user.id` | `Attendance` |
| `POST` | `/api/v1/attendance/submit-session` | `FACULTY`, `ADMIN` | Scoped to instructor courses | `Attendance` |
| `GET` | `/api/v1/attendance/department-stats`| `HOD`, `ADMIN` | Scoped to HOD department | `Attendance` |
| `GET` | `/api/v1/attendance/at-risk` | `HOD`, `FACULTY`, `ADMIN`| Departmental student roster | `Attendance` |
| `POST` | `/api/v1/assignments/create` | `FACULTY`, `ADMIN` | Faculty assigned courses | `Assignment` |
| `POST` | `/api/v1/assignments/submit` | `STUDENT` | `student_id == current_user.id` | `AssignmentSubmission`|
| `POST` | `/api/v1/assignments/grade` | `FACULTY`, `ADMIN` | Scoped to course instructor | `AssignmentSubmission`|

---

## 5. Leaves & On-Duty Endpoints

| Method | Endpoint | Allowed Roles | Object Scoping Rule | Target Entity |
| :---: | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/leaves-od/apply` | `STUDENT` | `student_id == current_user.id` | `StudentLeave` |
| `GET` | `/api/v1/leaves-od/my-leaves` | `STUDENT` | `student_id == current_user.id` | `StudentLeave` |
| `POST` | `/api/v1/leaves-od/{id}/endorse` | `FACULTY`, `ADMIN` | `student.advisor_id == current_user.id` | `StudentLeave` |
| `POST` | `/api/v1/leaves-od/{id}/decision`| `HOD`, `ADMIN` | Scoped to HOD department | `StudentLeave` |

---

## 6. Security, Digital Twin & Incident Endpoints

| Method | Endpoint | Allowed Roles | Object Scoping Rule | Target Entity |
| :---: | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/security/incidents` | `SECURITY`, `FACULTY`, `ADMIN` | Any campus checkpoint | `SecurityIncident` |
| `GET` | `/api/v1/security/incidents` | `SECURITY`, `ADMIN` | Global incident list | `SecurityIncident` |
| `PUT` | `/api/v1/security/incidents/{id}/resolve`| `SECURITY`, `ADMIN` | Active incidents | `SecurityIncident` |
| `GET` | `/api/v1/campus-pulse/headcount`| All Authenticated | Aggregated non-PII metrics | Zone Headcounts |
| `GET` | `/api/v1/campus-pulse/zones` | All Authenticated | Campus building zone models | 3D Zone Geometries |
