# Smart Campus AI Management System

> **An enterprise-grade, full-stack intelligent campus operations platform featuring automated CSP timetable scheduling, multi-tier digital gate pass lifecycle, real-time campus pulse density analytics, and personalized cognitive learning intelligence engines.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5.4.0-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00.svg?style=flat&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com)
[![Test Coverage](https://img.shields.io/badge/Tests-72%2F72%20Passing%20(100%25)-success.svg)](file:///d:/FInal%20Year/sci/backend/test_master_suite.py)

---

## 🏛️ System Architecture

```mermaid
graph TB
    subgraph Frontend ["Client Layer (React + Vite)"]
        UI["Modern UI / Responsive Dashboards"]
        Feat["Domain Features: Auth, Student, Faculty, Admin, GatePass, Timetable"]
        Router["React Router v6 + RBAC Route Guards"]
        WS["Real-Time WebSocket Notification Gateway"]
    end

    subgraph Backend ["Server Layer (FastAPI ASGI)"]
        Core["Core: Config, Database, Security, Dependencies"]
        API["API Layer: Central Router & v1 Versioning"]
        Services["Business Logic & Domain Orchestration"]
        Repos["Data Repositories & Async SQLAlchemy"]
    end

    subgraph Engines ["Mathematical Intelligence Suite"]
        CSP["CSP Backtracking Timetable Solver (0 Clashes)"]
        ALRA["ALRA Academic Latent Risk Assessor"]
        KDPA["KDPA Ebbinghaus Retention Decay Engine"]
        CLPA["CLPA Cognitive Learning Pathway Modeler"]
        DCRA["DCRA+ Dynamic Capacity & Resource Allocator"]
        DSEA["DSEA Domain Skill Evolution Matcher"]
        Pulse["Campus Pulse Real-time Density Anomaly Matrix"]
    end

    subgraph Storage ["Persistence Layer"]
        DB[(MySQL Database / Async Driver)]
        Files["Uploaded Study Handouts & Media"]
    end

    UI --> Router
    Router --> WS
    UI --> API
    API --> Core
    API --> Services
    Services --> Repos
    Services --> Engines
    Repos --> DB
    Services --> Files
```

---

## 🚀 Key Modules & Capabilities

| Module | Core Functionality | Primary Roles |
| :--- | :--- | :--- |
| **CSP Timetable Generator** | Constraint Satisfaction Backtracking algorithm producing zero faculty/room clash schedules. | Admin, HOD |
| **Multi-Tier Gate Pass** | AI exit-time recommendations, Warden approvals, signed QR cryptographic verification. | Student, Warden, Security |
| **Cognitive Intelligence (CLPA/KDPA)** | Multi-factor attention profiling & Ebbinghaus retention decay curves for spaced revision. | Student, Faculty |
| **Academic Risk Predictor (ALRA)** | Latent distress detection factoring attendance trajectories, backlogs, and internal marks. | Student, Faculty, HOD |
| **Campus Pulse Engine** | Real-time zone density matrix and 1-3 hour forward predictive activity forecasting. | Admin, Faculty |
| **Career Roadmap & DSEA** | ATS resume scoring, fuzzy Jaccard bigram skill gap analysis, and placement tracking. | Student, Admin |
| **Core Hub Management** | Institutional master data CRUD for departments, buildings, classrooms, and sections. | Admin |

---

## 📂 Production Repository Structure

```
project-root/
│
├── frontend/                          # React 18 + Vite Single Page Application
│   ├── src/
│   │   ├── app/                       # App.jsx, router guards, global providers
│   │   ├── features/                  # Domain modules: auth, student, faculty, admin, etc.
│   │   ├── components/                # Reusable UI primitives, charts, layouts, modals
│   │   ├── context/                   # AuthContext, NotificationContext, ThemeContext
│   │   ├── services/                  # Axios HTTP client, storage abstraction
│   │   └── styles/                    # Global CSS variables, themes, animations
│   ├── package.json
│   └── vite.config.js
│
├── backend/                           # FastAPI Asynchronous Application
│   ├── app/
│   │   ├── core/                      # Config, async database, security, dependencies
│   │   ├── api/                       # Central API router & v1 versioning
│   │   ├── models/                    # SQLAlchemy ORM entity models
│   │   ├── repositories/              # Database query repositories
│   │   ├── services/                  # Business logic services
│   │   ├── algorithms/                # ALRA, KDPA, CLPA, DCRA+, CSP, DSEA, ICQEA
│   │   ├── middleware/                # Rate limiter, input sanitizer, role checker
│   │   └── utils/                     # File upload, WebSocket notification manager
│   ├── tests/                         # Master 72-test validation suite & unit tests
│   └── requirements.txt
│
├── scripts/                           # Database seeding, migration, setup scripts
├── docs/                              # Architecture, algorithms, database, API specs
├── .env.example                       # Root environment configuration template
└── run_demo.bat                       # One-click dual-server launch script
```

---

## ⚡ Quick Start

### 1. Launch with One Command (Windows)
```cmd
run_demo.bat
```

### 2. Manual Server Execution
```powershell
# 1. Start FastAPI Backend (Port 8000)
cd "d:\FInal Year\sci\backend"
.\venv\Scripts\activate
$env:PYTHONUTF8="1"
uvicorn app.main:app --port 8000 --reload

# 2. Start Vite Frontend (Port 5174)
cd "d:\FInal Year\sci\frontend"
npm run dev
```

### 3. Run Automated Validation Test Suite
```powershell
cd "d:\FInal Year\sci\backend"
.\venv\Scripts\python.exe -u test_master_suite.py
```

---

## 👥 Pre-Configured Test Accounts

| Role | Email | Password | Primary Interface |
| :--- | :--- | :--- | :--- |
| **Student** | `student1@campus.com` | `password123` | Student Dashboard (`/dashboard`) |
| **Faculty** | `faculty1@campus.com` | `password123` | Faculty Portal (`/faculty`) |
| **Admin** | `admin@campus.com` | `password123` | Admin Core Hub (`/admin`) |
| **HOD** | `hod1@campus.com` | `password123` | Department Overview (`/hod`) |
| **Security** | `security1@campus.com` | `password123` | Gate Scanner (`/security/gate`) |
| **Guardian** | `guardian1@campus.com` | `password123` | Guardian Approvals (`/guardian/gate-pass`) |

---

## 📚 Technical Documentation

- [3D Campus Digital Twin Architecture](docs/THREE_JS_ARCHITECTURE.md)
- [System Architecture](docs/PROJECT_MASTER_DOCUMENTATION.md)
- [Algorithmic & Mathematical Formulations](complete_project_architecture_and_algorithms.md)
- [Database Schema & ER Model](docs/schema_details.md)
- [Test Cases & QA Validation Matrix](docs/TEST_CASES.md)

---

## 📜 License
Developed for Institutional Academic Management & Operations. All rights reserved.
