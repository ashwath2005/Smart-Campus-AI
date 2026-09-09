# Master Replication Blueprint: Smart Campus Management Ecosystem (SCME)

This document provides a comprehensive technical blueprint for replicating the **Smart Campus Management Ecosystem (SCME)**. It serves as a master document detailing the core objectives, directory architectures, database schemas, server algorithms, AI context aggregation layers, and real-time push notification pipelines.

---

## 1. Project Overview & Objectives

Traditional college Enterprise Resource Planning (ERP) platforms function as passive data repositories, forcing students, faculty, and administrators to navigate multi-layered, rigid web forms to retrieve information. Additionally, they lack personalized academic support and hardware-free faculty tracking, while communication networks remain fragmented.

**SCME** resolves these limitations by:
1. **Centralizing Campus Operations**: Integrating attendance registers, timetables, course assignments, placement cell boards, and announcements into a single asynchronous database.
2. **Dynamic Context-Aware AI Assistance**: Implementing the **Generative AI Context Binding (GACB)** framework to pre-compile SQL snapshots and inject them directly into LLM prompts, enabling students to query live campus data via natural language.
3. **Deterministic Faculty Localization**: Deducing real-time instructor location (Room/Status) without physical GPS, RFID, or BLE hardware by intersecting active timetables and daily leave registers.
4. **Wearable Push Alerts**: Implementing a push notification system (via WebSockets and Firebase Cloud Messaging) that broadcasts critical warnings (such as low attendance margins or schedule shifts) directly to students' smartwatches.

---

## 2. Directory Folder Structure

```
smart-campus-management-ecosystem/
├── backend/
│   ├── app/
│   │   ├── middleware/        # JWT Authentication & Role authorization
│   │   ├── models/            # SQLAlchemy database models
│   │   ├── routes/            # FastAPI routers (auth, ai, faculty_locator, notifications)
│   │   ├── services/          # Gemini API integrations and PDF processing
│   │   ├── utils/             # WebSocket connections and helper classes
│   │   ├── config.py          # Environment variable configurations
│   │   └── main.py            # FastAPI main entrypoint
│   ├── create_tables.py       # Database schema creation script
│   ├── seed_data.py           # Database initial values seeding script
│   └── requirements.txt       # Python package list
└── frontend/
    ├── src/
    │   ├── api/               # Axios instance config
    │   ├── context/           # Session context providers
    │   ├── types/             # TypeScript types
    │   └── main.tsx           # React client root
    ├── package.json           # Frontend packages
    └── vite.config.ts         # Vite path configurations
```

---

## 3. Database Schema Specifications

The database layer runs on an asynchronous SQL interface using SQLAlchemy 2.0.

```
  ┌──────────────┐          ┌────────────────┐
  │    users     │ 1────o{  │ faculty_leaves │
  └──────┬───────┘          └────────────────┘
         │ 1
         ├──────────o{ [attendance]
         ├──────────o{ [assignments]
         ├──────────o{ [submissions]
         └──────────o{ [placement_applications]
```

### 3.1 User Table (`users`)
Holds identity and profile variables for all roles:
```python
# app/models/user.py
from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum("student", "faculty", "admin"), nullable=False)
    department = Column(String(100))
    roll_number = Column(String(20))
    employee_id = Column(String(50), unique=True, nullable=True)
    staff_room = Column(String(100), nullable=True)
    custom_status = Column(String(50), nullable=True)
    semester = Column(Integer, default=1, nullable=True)
    section = Column(String(10), default="A", nullable=True)
    phone_number = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=func.now())
```

### 3.2 Faculty Leave Table (`faculty_leaves`)
Tracks approved, pending, or rejected leaves:
```python
# app/models/user.py (continued)
from sqlalchemy import Date, ForeignKey, Text

class FacultyLeave(Base):
    __tablename__ = "faculty_leaves"

    id = Column(Integer, primary_key=True, autoincrement=True)
    faculty_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    leave_type = Column(String(100), nullable=False)  # "Casual Leave", "Sick Leave", "Duty Leave"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(20), default="Approved", nullable=False)  # "Pending", "Approved", "Rejected"
    reason = Column(Text, nullable=True)
```

### 3.3 Timetable tables (`timetables`, `timetable_entries`)
Defines department-year-section schedules:
```python
# app/models/user.py (continued)
from sqlalchemy import Time

class Timetable(Base):
    __tablename__ = "timetables"
    id = Column(Integer, primary_key=True, autoincrement=True)
    department = Column(String(100), nullable=False)
    year = Column(String(20), nullable=False)
    section = Column(String(10), default="A", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"
    id = Column(Integer, primary_key=True, autoincrement=True)
    timetable_id = Column(Integer, ForeignKey("timetables.id", ondelete="CASCADE"))
    subject = Column(String(100), nullable=False)
    faculty = Column(String(100), nullable=True)
    room = Column(String(50))
    day = Column(String(20), nullable=False)  # "Monday", "Tuesday", etc.
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
```

### 3.4 Attendance Table (`attendance`)
Stores daily present/absent logs:
```python
# app/models/attendance.py
from sqlalchemy import Column, Integer, String, Date, Enum, ForeignKey
from app.database import Base

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    faculty_id = Column(Integer, ForeignKey("users.id"))
    subject = Column(String(100), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(Enum("present", "absent"), nullable=False)
```

### 3.5 Assignment & Submission Tables (`assignments`, `submissions`)
Handles homework uploads, feedback, and score logs:
```python
# app/models/assignment.py
from sqlalchemy import Column, Integer, String, Date, Float, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    subject = Column(String(100), nullable=False)
    due_date = Column(Date, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("users.id"))
    file_path = Column(String(500), nullable=False)
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=func.now())
```

### 3.6 Placement Board Tables (`companies`, `placements`, `placement_applications`)
Manages corporate drives, eligibilities, and candidate tracking:
```python
# app/models/placement.py
from sqlalchemy import Column, Integer, String, ForeignKey, Text, Enum, Float, Date, Boolean
from app.database import Base

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    website = Column(String(300), nullable=True)

class Placement(Base):
    __tablename__ = "placements"
    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    title = Column(String(200), nullable=False)
    package_lpa = Column(Float, nullable=True)
    eligibility_criteria = Column(Text, nullable=True)
    deadline = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)

class PlacementApplication(Base):
    __tablename__ = "placement_applications"
    id = Column(Integer, primary_key=True, autoincrement=True)
    placement_id = Column(Integer, ForeignKey("placements.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum("applied", "shortlisted", "selected", "rejected"), default="applied")
```

### 3.7 Notification Tables (`notifications`, `notification_read`)
Backbone database storage for wearable push notifications:
```python
# app/models/communication.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)  # "academic", "attendance", "emergency"
    priority = Column(String(20), default="normal")  # "low", "normal", "high", "emergency"
    department = Column(String(50), nullable=True)
    target_role = Column(String(50), nullable=True)
    user_id = Column(Integer, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())

class NotificationRead(Base):
    __tablename__ = "notification_read"
    id = Column(Integer, primary_key=True, autoincrement=True)
    notification_id = Column(Integer, ForeignKey("notifications.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id"))
    read_at = Column(DateTime, default=func.now())
```

---

## 4. Key Server Algorithms

### 4.1 Asynchronous Database Engine Fallback
Initializes connections to MySQL. If port 3306 times out or fails, redirects program queries to SQLite automatically.
```python
# app/database.py
import pymysql
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import DATABASE_URL

use_mysql = False
try:
    conn = pymysql.connect(
        host=MYSQL_HOST, user=MYSQL_USER, password=MYSQL_PASSWORD,
        port=int(MYSQL_PORT), database=MYSQL_DATABASE, connect_timeout=2
    )
    conn.close()
    use_mysql = True
except Exception:
    use_mysql = False

if use_mysql:
    engine = create_async_engine(DATABASE_URL, echo=True)
else:
    engine = create_async_engine("sqlite+aiosqlite:///smartcampus.db", connect_args={"check_same_thread": False})

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
```

### 4.2 Deterministic Faculty Location Resolver
Computes the current whereabouts of a faculty member without hardware tags.
```python
# app/routes/faculty_locator.py
async def get_faculty_status_details(faculty: User, now_dt: datetime, db: AsyncSession) -> dict:
    current_date = now_dt.date()
    current_day = now_dt.strftime("%A")
    current_time = now_dt.time()

    # 1. Check approved leaves
    leave_q = select(FacultyLeave).where(
        FacultyLeave.faculty_id == faculty.id,
        FacultyLeave.status == "Approved",
        FacultyLeave.start_date <= current_date,
        FacultyLeave.end_date >= current_date
    )
    leave = (await db.execute(leave_q)).scalar_one_or_none()
    if leave:
        return {
            "status": "On Leave",
            "details": {
                "leave_type": leave.leave_type,
                "return_date": leave.end_date.strftime("%Y-%m-%d")
            }
        }

    # 2. Check active class timetable entries
    timetable_q = (
        select(TimetableEntry, Timetable)
        .join(Timetable)
        .where(
            Timetable.is_active == True,
            func.lower(TimetableEntry.faculty) == faculty.name.lower(),
            TimetableEntry.day == current_day,
            TimetableEntry.start_time <= current_time,
            TimetableEntry.end_time >= current_time
        )
    )
    class_now = (await db.execute(timetable_q)).first()
    if class_now:
        entry, timetable = class_now
        return {
            "status": "Teaching",
            "details": {
                "classroom": entry.room or "N/A",
                "subject": entry.subject,
                "class_end_time": entry.end_time.strftime("%H:%M")
            }
        }

    # 3. Default to custom checked-in status or Available
    return {
        "status": faculty.custom_status or "Available",
        "details": {
            "staff_room": faculty.staff_room or "N/A"
        }
    }
```

### 4.3 Generative AI Context Binding (GACB) Compiler
Pulls relational data snapshots, formats them as plain-text vectors, and injects them directly into the LLM system prompt.
```python
# app/routes/ai.py
async def get_ai_context(user: dict, db: AsyncSession) -> dict:
    user_id = user["id"]
    role = user["role"]
    context = {
        "name": user["name"],
        "role": role,
        "department": user.get("department", "N/A"),
        "semester": user.get("semester", 1),
    }

    if role == "student":
        # Pull attendance
        att_q = select(Attendance.subject, Attendance.status, func.count(Attendance.id)).where(
            Attendance.student_id == user_id
        ).group_by(Attendance.subject, Attendance.status)
        att_res = await db.execute(att_q)
        att_data = {}
        for subject, status, count in att_res.all():
            if subject not in att_data:
                att_data[subject] = {"present": 0, "total": 0}
            if status == "present":
                att_data[subject]["present"] += count
            att_data[subject]["total"] += count
        
        att_strings = []
        for sub, counts in att_data.items():
            pct = (counts["present"] / counts["total"] * 100) if counts["total"] > 0 else 100.0
            att_strings.append(f"{sub}: {counts['present']}/{counts['total']} ({pct:.1f}%)")
        context["attendance"] = ", ".join(att_strings)

        # Pull pending assignments
        sub_q = select(Submission.assignment_id).where(Submission.student_id == user_id)
        pending_q = select(Assignment).where(Assignment.id.not_in(sub_q))
        context["pending_assignments"] = ", ".join([a.title for a in (await db.execute(pending_q)).scalars().all()])

    return context
```

---

## 5. Wearable Push Notification & WebSocket Manager

Manages real-time message broadcasting and routes pushes via Capacitor adapters and watchOS/Wear OS haptic engines.

```
                  [FastAPI backend event]
                             │
                             ▼
                 [Notification Table Log]
                             │
                             ▼
                [WebSocket Manager Broadcast]
                             │
                     ┌───────┴───────┐
                     ▼ (Active App)  ▼ (Inactive App)
               [WebSockets]     [FCM Push Gate]
                     │               │
                     └───────┬───────┘
                             ▼
                 [Capacitor Native Bridge]
                             │
                             ▼
                 [Smartwatch Haptic Engine]
```

### 5.1 Connection Manager Logic
```python
# app/utils/websocket_manager.py
from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_json_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()
```

### 5.2 Wearable Alert Prioritization and Vibration Rules
Alerts dispatched to smartwatches trigger distinct vibration feedback patterns ($\mathcal{V}$) depending on priority:
* **Emergency Alerts**: Overrides local device Do-Not-Disturb (DND) registers. Triggers high-frequency continuous vibration ($\mathcal{V}_{high}$).
* **Critical Alerts** (Attendance warnings / schedule shifts): Standard double pulse vibration ($\mathcal{V}_{std}$) to prompt immediate action.
* **Standard Alerts**: Batch queued for delivery during low-activity windows to avoid distraction.

---

## 6. Gemini AI SDK Configurations

SCME uses the Google Generative AI SDK (model `gemini-2.5-flash`) coupled with Pydantic response schemas for structured JSON responses.

```python
# app/services/gemini_service.py
import google.generativeai as genai
import json
from pydantic import BaseModel, Field
from typing import List

genai.configure(api_key="YOUR_GEMINI_API_KEY")
model = genai.GenerativeModel("gemini-2.5-flash")

class StudyPlanDayResponse(BaseModel):
    day: int = Field(description="Day number starting from 1")
    title: str = Field(description="Core study topic")
    tasks: List[str] = Field(description="List of tasks to complete")
    duration: str = Field(description="Estimated study duration")

class StudyPlanResponse(BaseModel):
    subject: str = Field(description="The academic subject name")
    plan: List[StudyPlanDayResponse] = Field(description="Daily schedules")

async def generate_study_plan_async(subject: str, topics: str, days: int) -> dict:
    prompt = f"Create a study plan for {subject} covering these topics: {topics} over {days} days."
    response = await asyncio.to_thread(
        model.generate_content,
        prompt,
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": StudyPlanResponse
        }
    )
    return json.loads(response.text)
```

---

## 7. Setup & Run Guide

### 7.1 Installation Steps
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Build the python virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install package requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file inside the `backend/` folder:
   ```env
   MYSQL_USER=root
   MYSQL_PASSWORD=yourpassword
   MYSQL_HOST=127.0.0.1
   MYSQL_PORT=3306
   MYSQL_DATABASE=smartcampus
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   JWT_SECRET=your_jwt_secret_key_here
   ```
5. Initialize the database schema and inject seeded test credentials:
   ```bash
   python create_tables.py
   python seed_data.py
   ```
6. Spin up the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Access REST API documentation at `http://localhost:8000/docs`.
