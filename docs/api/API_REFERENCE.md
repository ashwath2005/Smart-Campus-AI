# Smart Campus AI — API Contract & Endpoint Reference

## 1. Authentication & Security Headers

All protected endpoints require a valid JWT Bearer token in the `Authorization` request header:
```http
Authorization: Bearer <access_token>
```

---

## 2. API Routes Matrix

### 🔐 Authentication (`/api/auth` & `/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/login` | Authenticate user credentials & issue JWT + cookie | No |
| `POST` | `/api/auth/register` | Register new student / faculty account | No |
| `POST` | `/api/auth/refresh` | Rotate refresh token and issue new access token | Bearer / Cookie |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile | Bearer |
| `PUT` | `/api/auth/profile` | Update profile demographics | Bearer |
| `POST` | `/api/auth/forgot-password` | Request password reset token | No |
| `POST` | `/api/auth/change-first-password` | Update mandatory default password | Bearer |

---

### 🎓 Student Operations (`/api/students` & `/api/attendance` & `/api/timetable`)
| Method | Endpoint | Description | Permitted Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/attendance/summary` | Fetch student cumulative attendance % & breakdown | Student, Faculty, Admin |
| `GET` | `/api/timetable/my` | Fetch student weekly class schedule | Student |
| `GET` | `/api/timetable/today` | Fetch student today's remaining lectures | Student |
| `GET` | `/api/assignments/` | List enrolled coursework & submissions | Student, Faculty, Admin |
| `POST` | `/api/assignments/{id}/submit` | Submit coursework solution file or GitHub URL | Student |
| `GET` | `/api/students/internal-marks` | Fetch continuous assessment marks | Student, Faculty, Admin |
| `GET` | `/api/students/results` | Fetch semester SGPA, CGPA & grade cards | Student, Faculty, Admin |
| `GET` | `/api/academic-risk/predict` | Run ALRA latent risk assessment | Student, Faculty, Admin |

---

### 🛡️ Multi-Tier Gate Pass Subsystem (`/api/gate-pass`)
| Method | Endpoint | Description | Permitted Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/gate-pass/recommend-exit-time` | AI recommends ideal exit slot avoiding lectures | Student |
| `POST` | `/api/gate-pass/request` | Submit new outpass / day pass request | Student |
| `GET` | `/api/gate-pass/my-passes` | View student active and historic passes | Student |
| `POST` | `/api/gate-pass/warden-action` | Approve or reject student gate pass | Warden, HOD, Admin |
| `POST` | `/api/gate-pass/exit` | Security guard scans QR token on campus exit | Security, Admin |
| `POST` | `/api/gate-pass/return` | Security guard scans QR token on campus return | Security, Admin |
| `GET` | `/api/gate-pass/analytics` | View gate pass analytics and violation trends | Admin, Warden |
| `GET` | `/api/gate-pass/audit-logs` | Immutable audit trail of all pass lifecycle events | Admin |

---

### 🧠 Learning Intelligence & AI (`/api/learning-intelligence` & `/api/ai`)
| Method | Endpoint | Description | Permitted Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/learning-intelligence/profile` | Fetch CLPA cognitive radar & KDPA retention curves | Student, Faculty |
| `POST` | `/api/learning-intelligence/track` | Log real-time learning interaction event | Student |
| `GET` | `/api/learning-intelligence/career-roadmap`| Fetch DSEA industry career readiness roadmap | Student |
| `POST` | `/api/ai/study-plan` | Generate personalized multi-day study schedule | All Users |
| `POST` | `/api/ai/skill-gap` | Calculate Jaccard bigram skill gap distance | All Users |

---

### ⚙️ Admin & Core Hub (`/api/admin` & `/api/core-hub` & `/api/campus-pulse`)
| Method | Endpoint | Description | Permitted Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard-stats` | Aggregated campus metrics & headcount counts | Admin |
| `POST` | `/api/core-hub/departments` | Create academic department | Admin |
| `GET` | `/api/core-hub/classrooms` | List institutional facilities & capacities | Admin |
| `POST` | `/api/timetable/generate` | Run CSP Backtracking conflict-free timetable solver | Admin, HOD |
| `GET` | `/api/campus-pulse/current` | Real-time campus density & moving baseline anomaly | Admin, Faculty |
| `GET` | `/api/campus-pulse/forecast` | 1-3 hour forward spatial activity forecast | Admin, Faculty |
