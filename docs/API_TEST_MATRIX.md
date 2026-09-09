# Smart Campus AI — Backend API Endpoint Test Matrix

This matrix catalogs all major backend REST API endpoints exposed by the FastAPI server, detailing HTTP Method, Path, Permitted Roles, Authentication Requirement, Database Mutations, Notification Dispatches, and Associated Test Case IDs.

---

| HTTP Method | API Path | Authorized Roles | Auth Required | Request Payload Summary | Database Side-Effects | Notification Triggered | Master Test ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | No | `{email, password}` | Updates `users.last_login` | None | `TC-AUTH-001` |
| `GET` | `/api/v1/auth/me` | Any Authenticated | Yes (Bearer) | None | None (Read) | None | `TC-AUTH-001` |
| `POST` | `/api/v1/gate-pass/request` | Student | Yes | `{pass_type, reason, destination, return_hours}` | INSERT `gate_passes`, INSERT `gate_pass_audit_logs` | Real-time WebSocket + DB alert | `TC-GP-001` / `002` |
| `POST` | `/api/v1/gate-pass/verify-parent-otp` | Guardian, Student, Admin | Yes | `{pass_id, otp_code}` | UPDATE `gate_passes` (parent_verified=True) | Alert to Warden | `TC-GP-002` |
| `POST` | `/api/v1/gate-pass/warden-action` | Warden, HOD, Faculty, Admin | Yes | `{pass_id, action}` | UPDATE `gate_passes` (warden_approved=True, status='APPROVED') | Alert to Student | `TC-GP-002` |
| `POST` | `/api/v1/gate-pass/exit` | Security, Admin, Faculty | Yes | `{qr_token}` | UPDATE `gate_passes` (status='OUT', actual_exit_time) | Mobility counter update | `TC-GP-003` |
| `POST` | `/api/v1/gate-pass/return` | Security, Admin, Faculty | Yes | `{qr_token}` | UPDATE `gate_passes` (status='RETURNED', actual_return_time) | Mobility counter update | `TC-GP-003` |
| `POST` | `/api/v1/gate-pass/check-overdue` | System, Admin | Yes | None | UPDATE `gate_passes` (status='OVERDUE') | Urgent Warden/Parent Push | `TC-GP-004` |
| `GET` | `/api/v1/gate-pass/my-passes` | Student | Yes | None | None (Read own passes) | None | `TC-GP-001` |
| `GET` | `/api/v1/gate-pass/all-passes` | Admin, Security, Warden, HOD | Yes | None | None (Read all passes) | None | `TC-GP-002` |
| `GET` | `/api/v1/gate-pass/policy` | Public / Authenticated | Optional | None | None (Read active policy) | None | `TC-GP-001` |
| `PUT` | `/api/v1/gate-pass/policy` | Admin, HOD | Yes | `{min_attendance_pct, ...}` | UPDATE `gate_pass_policies` | None | `TC-GP-001` |
| `POST` | `/api/v1/workflows/leaves` | Student | Yes | `{leave_type, start_date, end_date, reason, advisor_id}` | INSERT `student_leaves`, INSERT `notifications` | Notification to Advisor | `TC-LV-001` |
| `GET` | `/api/v1/workflows/leaves` | Student, Faculty, HOD, Admin | Yes | Query: `status, student_id` | None (Filtered by caller role) | None | `TC-LV-001` |
| `PUT` | `/api/v1/workflows/leaves/{id}/review` | Faculty (Advisor) | Yes | `{status, comment}` | UPDATE `student_leaves` (status, faculty_comment) | Notification to HOD & Student | `TC-LV-001` / `002` |
| `PUT` | `/api/v1/workflows/leaves/{id}/approve` | HOD | Yes | `{status, comment}` | UPDATE `student_leaves` (status, hod_comment) | Notification to Student | `TC-LV-001` |
| `POST` | `/api/v1/workflows/ods` | Student | Yes | `{event_title, start_date, end_date, reason}` | INSERT `student_ods`, INSERT `notifications` | Notification to Advisor | `TC-LV-003` |
| `GET` | `/api/v1/workflows/ods` | Student, Faculty, HOD, Admin | Yes | Query: `status` | None (Filtered by caller role) | None | `TC-LV-003` |
| `PUT` | `/api/v1/workflows/ods/{id}/review` | Faculty (Advisor) | Yes | `{status, comment}` | UPDATE `student_ods` (status, faculty_comment) | Notification to HOD & Student | `TC-LV-003` |
| `PUT` | `/api/v1/workflows/ods/{id}/approve` | HOD | Yes | `{status, comment}` | UPDATE `student_ods` (status, hod_comment) | Notification to Student | `TC-LV-003` |
| `GET` | `/api/v1/attendance/students` | Faculty, Admin | Yes | Query: `department` | None (Roster fetch) | None | `TC-ATT-001` |
| `POST` | `/api/v1/attendance/mark` | Faculty, Admin | Yes | `{student_id, subject, date, status}` | INSERT / UPDATE `attendance` | Shortage check | `TC-ATT-001` |
| `POST` | `/api/v1/attendance/bulk` | Faculty, Admin | Yes | `{subject, date, records: [...]}` | Bulk INSERT `attendance` | Shortage check | `TC-ATT-001` |
| `GET` | `/api/v1/attendance/my` | Student | Yes | None | Aggregates subject attendance % | Shortage notice if < 75% | `TC-ATT-002` |
| `GET` | `/api/v1/assignments` | Student, Faculty, Admin, HOD | Yes | None | Filtered by role/section | None | `TC-ASN-001` |
| `POST` | `/api/v1/assignments` | Faculty, Admin, HOD | Yes | `{title, subject, due_date, year, section}` | INSERT `assignments`, INSERT `notifications` | Notification to Section | `TC-ASN-001` |
| `POST` | `/api/v1/assignments/{id}/submit` | Student | Yes | `{submission_text, file_url}` | INSERT `submissions` | Notification to Faculty | `TC-ASN-002` |
| `GET` | `/api/v1/assignments/{id}/submissions`| Faculty, Admin, HOD | Yes | None | None (Read submissions) | None | `TC-ASN-002` |
| `PUT` | `/api/v1/assignments/submissions/{id}/grade` | Faculty, Admin | Yes | `{marks_obtained, feedback}` | UPDATE `submissions` (marks, feedback) | Notification to Student | `TC-ASN-002` |
| `GET` | `/api/v1/placements` | Authenticated | Yes | None | Checks applied status for student | None | `TC-PL-001` |
| `POST` | `/api/v1/placements` | Admin, Faculty | Yes | `{company_id, title, package_lpa, deadline}` | INSERT `placements`, INSERT `notifications` | Notification to Students | `TC-PL-001` |
| `POST` | `/api/v1/placements/{id}/apply` | Student | Yes | `{resume_url}` | INSERT `placement_applications` | Alert to Placement Officer | `TC-PL-001` |
| `PUT` | `/api/v1/placements/applications/{id}/status` | Admin, Faculty | Yes | `{status, interview_status}` | UPDATE `placement_applications` | Alert to Student | `TC-PL-002` |
| `GET` | `/api/v1/events` | Authenticated | Yes | None | Read events + user registration | None | `TC-EV-001` |
| `POST` | `/api/v1/events` | Admin, HOD, Faculty | Yes | `{title, event_date, venue}` | INSERT `events` | None | `TC-EV-001` |
| `POST` | `/api/v1/events/{id}/register` | Student | Yes | None | INSERT `event_registrations` | Registration confirmation | `TC-EV-001` |
| `GET` | `/api/v1/study-materials` | Authenticated | Yes | Query: `subject, material_type` | None (Read materials) | None | `TC-SM-001` |
| `POST` | `/api/v1/study-materials` | Faculty, Admin | Yes | Multipart Form: `file, title, subject` | INSERT `study_materials`, AI categorizer | Alert to department | `TC-SM-001` |
| `GET` | `/api/v1/forum/posts` | Authenticated | Yes | Query: `page, page_size, course_tag` | None (Read posts with reply counts) | None | `TC-FR-001` |
| `POST` | `/api/v1/forum/posts` | Authenticated | Yes | `{title, body, course_tag}` | INSERT `forum_posts` | None | `TC-FR-001` |
| `POST` | `/api/v1/forum/posts/{id}/replies` | Authenticated | Yes | `{content, body}` | INSERT `forum_replies` | Alert to post author | `TC-FR-001` |
| `POST` | `/api/v1/forum/posts/{id}/upvote` | Authenticated | Yes | None | Increments post upvotes | None | `TC-FR-001` |
| `PUT` | `/api/v1/forum/posts/{id}/pin` | Faculty, Admin | Yes | None | UPDATE `forum_posts` (is_pinned) | None | `TC-FR-001` |
| `GET` | `/api/v1/campus-pulse/current` | Student, Faculty, Admin, HOD | Yes | None | INSERT snapshot, returns telemetry | WebSocket broadcast | `TC-CP-001` |
| `GET` | `/api/v1/campus-pulse/history` | Student, Faculty, Admin, HOD | Yes | Query: `timeframe` | Read `campus_pulse_snapshots` | None | `TC-CP-001` |
| `GET` | `/api/v1/academic-risk/predict` | Student | Yes | None | Calculates SGPA prediction & study plan | Early-warning if < 6.0 | `TC-AI-001` |
| `POST` | `/api/v1/ai/chat` | Authenticated | Yes | `{question, conversation_id}` | INSERT `chat_history` | None | `TC-AI-001` |
| `POST` | `/api/v1/ai/study-plan` | Authenticated | Yes | `{subject, topics, days, available_hours}` | Gemini study plan generation | None | `TC-AI-001` |
| `POST` | `/api/v1/faculty-locator/status` | Faculty | Yes | `{status, location, notes}` | UPDATE `users` physical location status | Real-time presence update | `TC-FL-001` |
| `GET` | `/api/v1/faculty-locator/all` | Authenticated | Yes | None | Read all faculty presence & cabins | None | `TC-FL-001` |
