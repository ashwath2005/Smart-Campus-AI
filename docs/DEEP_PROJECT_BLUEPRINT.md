# SCME-AWN: Ultra-Deep Architectural & Technical Master Blueprint
## Detailed Internal Execution Breakdown & Code-Level Specification

---

## 1. End-to-End System Execution Lifecycle

When a user opens SCME-AWN in their browser, the following request-response lifecycle executes:

```
[User Browser]
      │
      │ 1. HTTP Request (e.g. GET /api/assignments/)
      ▼
[Vite Frontend / Axios Interceptor]
      │   Attaches Authorization: Bearer <JWT Token>
      ▼
[FastAPI Backend Server (Port 8000)]
      │
      ├─► [Input Sanitizer & Rate Limiter Middleware]
      │     Cleans SQL/XSS injections & checks rate limits (100 req/min)
      │
      ├─► [Auth Middleware & Role Checker]
      │     Decodes JWT token with HS256 secret key
      │     Verifies user role permissions (e.g., student vs faculty vs admin)
      │
      ├─► [Route Controller (e.g., app/routes/assignments.py)]
      │     Executes business logic using DB Dependency Injection
      │
      ├─► [Intelligence Engine (ALRA / CSP Scheduler / Gemini AI Cache)]
      │     Calculates mathematical scores or generates timetable schedules
      │
      ├─► [SQLAlchemy ORM & Database]
      │     Queries SQLite/PostgreSQL DB with session management
      │
      ▼
[JSON HTTP Response] ──► [React UI Component Renders with Framer Motion Animations]
```

---

## 2. Deep Dive: Backend Modules & Files (`sci/backend/app`)

### A. Core Initialization & Configuration (`app/config.py`, `app/database.py`, `app/main.py`)
- **`app/config.py`**: Reads `.env` variables (`SECRET_KEY`, `ALGORITHM = HS256`, `ACCESS_TOKEN_EXPIRE_MINUTES = 30`, `DATABASE_URL`, `GEMINI_API_KEY`).
- **`app/database.py`**: Initializes SQLAlchemy `create_engine` with connection pooling (`check_same_thread=False` for SQLite), `sessionmaker`, and `Base = declarative_base()`. Provides `get_db()` dependency for FastAPI route endpoints.
- **`app/main.py`**: The FastAPI application entrypoint.
  - Configures CORS middleware (`allow_origins=["*"]`, `allow_credentials=True`, `allow_methods=["*"]`).
  - Registers router blueprints: `auth.router`, `assignments.router`, `attendance.router`, `admin.router`, `ai.router`, `events.router`, `placements.router`, `forum.router`, `core_hub.router`, `faculty_locator.router`.

---

### B. Database Models & Schema Specifications (`app/models/`)

1. **User & Authentication (`app/models/user.py`, `app/models/token.py`)**:
   - `User`: `id` (PK), `email` (Unique), `hashed_password`, `full_name`, `role` (`student`, `faculty`, `admin`, `hod`), `department_id` (FK), `section_id` (FK), `roll_number`, `created_at`.
   - `RefreshToken`: `id`, `user_id` (FK), `token` (String, Unique), `expires_at`, `revoked` (Boolean).

2. **Academic Structure (`app/models/department.py`, `app/models/academic.py`)**:
   - `Department`: `id`, `name`, `code` (e.g., `CS`, `EC`, `ME`).
   - `Section`: `id`, `name` (e.g., `CSE-A`), `department_id` (FK), `year` (1..4).
   - `Subject`: `id`, `code` (e.g., `CS702`), `name`, `credits`, `department_id` (FK).
   - `Classroom`: `id`, `room_number` (e.g., `L-301`), `capacity` (e.g., `60`), `is_lab` (Boolean).

3. **Coursework & Evaluation (`app/models/assignment.py`, `app/models/attendance.py`)**:
   - `Assignment`: `id`, `title`, `subject`, `course_code`, `description`, `due_date`, `max_points`, `faculty_id` (FK), `section_id` (FK).
   - `AssignmentSubmission`: `id`, `assignment_id` (FK), `student_id` (FK), `file_url`, `submission_notes`, `score` (Float), `feedback` (Text), `status` (`pending`, `submitted`, `graded`), `submitted_at`.
   - `Attendance`: `id`, `student_id` (FK), `subject_id` (FK), `date`, `status` (`present`, `absent`, `od`, `leave`).

4. **Intelligence & Timetables (`app/models/ai_learning_engine.py`, `app/models/learning_intelligence.py`)**:
   - `TimetableSlot`: `id`, `section_id` (FK), `faculty_id` (FK), `subject_id` (FK), `classroom_id` (FK), `day_of_week` (`Monday`..`Friday`), `time_slot` (`09:00-10:00`..`16:00-17:00`).
   - `AILearningProfile`: `id`, `student_id` (FK), `alra_score`, `risk_level` (`low`, `moderate`, `critical`), `velocity_index`, `last_evaluated`.

---

### C. Artificial Intelligence & Algorithms (`app/algorithms/`)

#### 1. ALRA Service (`alra_service.py`) - Adaptive Learning Risk Assessment
Evaluates student risk by processing chronological assignment scores with exponential time decay and subject difficulty weighting.

**Algorithm Logic**:
```python
def calculate_alra_score(submissions, half_life_days=14.0):
    # lambda constant derived from half-life
    decay_lambda = 0.693147 / half_life_days
    current_time = datetime.now()
    
    total_weighted_score = 0.0
    total_weight = 0.0
    
    for sub in submissions:
        elapsed_days = (current_time - sub.submitted_at).days
        time_decay = math.exp(-decay_lambda * elapsed_days)
        difficulty_gamma = sub.subject_difficulty or 1.0
        
        normalized_score = sub.score / sub.max_points  # [0.0 to 1.0]
        weight = time_decay * difficulty_gamma
        
        total_weighted_score += normalized_score * weight
        total_weight += weight
        
    weighted_avg = total_weighted_score / total_weight if total_weight > 0 else 0.8
    risk_score = 1.0 - weighted_avg
    
    if risk_score < 0.25:
        risk_level = "low"
    elif risk_score < 0.55:
        risk_level = "moderate"
    else:
        risk_level = "critical"
        
    return {"risk_score": risk_score, "risk_level": risk_level}
```

#### 2. CSP Backtracking Scheduler (`backtracking_scheduler.py`)
Generates non-conflicting timetables across all sections, rooms, and faculty members.

**Algorithm Workflow**:
1. **Domain Definition**: Days = 5 (Mon-Fri), Slots = 7/day (Total 35 slots).
2. **Variable Formulation**: Each class session $V_{i} = (Section, Subject, Faculty, Duration)$.
3. **Constraint Validation Function**:
   - `check_faculty_clash(faculty_id, day, slot)`: Ensures faculty is free.
   - `check_room_clash(room_id, day, slot)`: Ensures classroom is unassigned.
   - `check_capacity(room_id, section_id)`: Room capacity $\ge$ Section student count.
4. **Recursive Backtracking with MRV (Minimum Remaining Values)**:
   - Select unassigned session with fewest remaining valid slots.
   - Try candidate slot. If valid, recurse. If downstream conflict occurs, backtrack (undo slot assignment) and try next candidate.

---

### D. Gemini AI & Multi-Turn Co-Pilot (`app/services/gemini_service.py`, `app/services/ai_cache.py`)
- Integrated with Google Gemini 1.5 Flash model API.
- Implements **Local Response Caching**: Queries are hashed using SHA-256 (`hashlib.sha256(prompt.strip().lower().encode()).hexdigest()`). If query exists in cache table, response is returned instantly in 2ms without consuming API tokens.
- Context injection: Inject student profile, upcoming deadlines, and academic performance into prompt context so Gemini acts as a personalized campus co-pilot.

---

## 3. Deep Dive: Frontend Client (`sci/frontend/src/`)

### A. Global State & Context Providers (`src/context/`)
1. **`AuthContext.jsx`**:
   - Manages `user` state, `accessToken`, and `refreshToken`.
   - Attaches Axios request interceptor: automatically adds `Authorization: Bearer ${token}` header to every outgoing API request.
   - Handles automatic logout and redirection to `/login` if token expires.

2. **`ThemeContext.jsx`**:
   - Toggles theme class (`light` / `dark`) on `<html>` document root.
   - Updates CSS custom properties (`--bg-primary`, `--text-primary`, `--accent-color`) dynamically.

3. **`NotificationContext.jsx`**:
   - Polls `/api/notifications/` every 30 seconds for unread alerts.
   - Updates alert bell badge counter in the top Navbar.

---

### B. Dynamic Page & Component Directory

| Page File | Primary Role & Purpose | Key Features |
| :--- | :--- | :--- |
| `LandingPage.jsx` | Public Showcase Portal | 3D Hero Mockup, Feature Matrix, Live AI Chat Simulator, Glass Navigation |
| `Login.jsx` | Authentication Entry | Quick Role Test Buttons (Student/Faculty/Admin), JWT token storage |
| `StudentDashboard.jsx` | Student Core Hub | Overall GPA, Attendance Gauge, Upcoming Deadlines Widget, ALRA Risk Indicator |
| `Assignments.jsx` | Academic Coursework | Coursework Cards, Search & Category Tabs, Attachments, Submit Modal |
| `Attendance.jsx` | Attendance Tracking | Subject-wise attendance breakdown, Safe Bunk / Shortage Margin calculator |
| `FacultyDashboard.jsx` | Faculty Control Panel | Today's Teaching Schedule, Attendance Logger, Coursework Grader |
| `FacultyLocator.jsx` | Live Faculty Finder | Real-time status tags (In Class L-302, Office Hours, On Leave) |
| `AdminCoreHub.jsx` | Administration Hub | Department & Section configuration, System Health Monitor |
| `AdminTimetableGenerator.jsx` | Schedule Automation | CSP Solver trigger, Constraint configuration, Conflict report viewer |
| `AIAssistant.jsx` | Gemini Campus Assistant | Interactive multi-turn chat, markdown rendering, prompt suggestions |

---

## 4. Step-by-Step Data Flow Scenarios

### Scenario 1: Student Submits an Assignment
1. Student navigates to `/assignments` and clicks **"Submit Solution"** on `Deep Neural Networks`.
2. `Assignments.jsx` opens `<Modal>` dialog. Student inputs Google Drive URL `https://drive.google.com/...` and implementation notes.
3. Form triggers `handleAssignmentSubmit(e)`.
4. Axios issues `POST /api/assignments/asg-101/submit` with JSON body `{ "file_url": "...", "notes": "..." }`.
5. FastAPI `app/routes/assignments.py` validates `student_id` from JWT token.
6. DB session writes record to `assignment_submissions` table with status `"submitted"`.
7. `ALRA` engine recalculates the student's risk profile score.
8. Frontend toast notification appears: `"Assignment submitted successfully!"`.
9. Card badge updates from `Pending` (Amber) to `Submitted` (Emerald) instantly via local React state update.

### Scenario 2: Admin Triggers Automated Timetable Generation
1. Admin opens `/admin/timetable-generator`.
2. Admin sets parameters: Max slots per day = 7, Working days = 5.
3. Clicks **"Run CSP Timetable Generator"**.
4. Axios issues `POST /api/admin/timetable/generate`.
5. Backend loads `sections`, `classrooms`, `subjects`, and `faculty` lists.
6. `backtracking_scheduler.py` runs recursive backtracking CSP search across 35 slots.
7. Output schedule matrix is written to `timetable_slots` database table.
8. Generated timetable returns as JSON array.
9. `AdminTimetableGenerator.jsx` renders interactive weekly schedule grid with room assignments and zero conflicts.

---

## 5. Security & Production Best Practices

- **Password Security**: Passwords hashed using `bcrypt` (12 salt rounds) via `passlib.context.CryptContext`.
- **JWT Protection**: Tokens signed using `HS256` with 256-bit secret key. Access tokens expire in 30 minutes; Refresh tokens stored in HTTP-Only, SameSite cookies.
- **SQL Injection Defense**: All database queries executed strictly via SQLAlchemy ORM parameter binding (no raw string formatting).
- **XSS Defense**: Inputs sanitized via `app/middleware/input_sanitizer.py` stripping malicious `<script>` tags.
