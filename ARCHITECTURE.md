# System Architecture & Codebase Design

> **Smart Campus AI Management System**  
> An enterprise-grade, full-stack intelligent campus operations platform engineered for maintainability, security, and scalability.

---

## 1. Overview & Architectural Principles

The codebase is organized following a strict separation of concerns, decoupling UI presentation from state management, business logic, API communication, and persistence.

### Key Architectural Tenets:
1. **Unidirectional Data Flow**:
   $$\text{Component} \longrightarrow \text{Custom Hook} \longrightarrow \text{Domain Service} \longrightarrow \text{API Client} \longrightarrow \text{FastAPI Route} \longrightarrow \text{Backend Service} \longrightarrow \text{Repository} \longrightarrow \text{Database}$$
2. **Modular Domain Isolation**: Features are isolated into logical units containing their relevant hooks, services, sub-components, and utilities.
3. **Resilient Network & Authentication**: Centralized Axios client featuring request queueing, automatic JWT header injection, silent token refresh loops, and graceful fallback.
4. **Predictable State & Context**: Consolidated application provider pipeline ensuring unified initialization of Theme, Auth, Notification, and Route contexts.

---

## 2. Directory Structure

```text
d:\Final Year\
├── sci/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── algorithms/        # CSP Timetable solver, ML algorithms, ALRA, KDPA
│   │   │   ├── api/               # API versioning and routing definitions
│   │   │   ├── controllers/       # High-level domain controllers
│   │   │   ├── core/              # Config (pydantic Settings), DB engine, Security
│   │   │   ├── dtos/              # Request / Response Pydantic schemas
│   │   │   ├── middleware/        # Rate limiter, upload size sanitizer, CORS
│   │   │   ├── models/            # SQLAlchemy declarative ORM models
│   │   │   ├── repositories/      # Data access layer (async SQLAlchemy sessions)
│   │   │   ├── routes/            # FastAPI route handlers
│   │   │   ├── services/          # Business logic, Gemini AI, Auth, Key Manager
│   │   │   └── utils/             # WebSocket manager, hashing, string helpers
│   │   ├── scripts/               # DB creation, migrations, seed runners
│   │   ├── tests/
│   │   │   ├── integration/       # Domain workflow, verify, and API tests
│   │   │   └── run_tests.py       # Unified test runner
│   │   ├── requirements.txt
│   │   └── .env
│   │
│   └── frontend/
│       ├── src/
│       │   ├── app/
│       │   │   ├── App.jsx        # Root application orchestrator
│       │   │   ├── routes/        # Centralized routing, routeConfig, ProtectedRoute
│       │   │   ├── providers/     # AppProviders wrapper (Theme, Auth, Toast, Router)
│       │   │   └── config/        # Environment and app configuration
│       │   ├── components/
│       │   │   ├── ui/            # Reusable atomic design primitives (30+ components)
│       │   │   ├── charts/        # Recharts visual analytics components
│       │   │   ├── layout/        # Shell, Navbar, Sidebar, Breadcrumbs
│       │   │   └── feedback/      # ErrorBoundary, OfflineIndicator, PwaInstallPrompt
│       │   ├── constants/         # Roles, routes, permissions, and app constants
│       │   ├── features/          # Domain-driven feature packages (CampusPulse 3D)
│       │   ├── hooks/             # Reusable React hooks (useAuth, useTheme, useDebounce)
│       │   ├── pages/             # Route-level view modules (Student, Faculty, Admin)
│       │   ├── services/
│       │   │   ├── api/           # API client, endpoints, and domain service clients
│       │   │   └── storage/       # Safe token and session storage
│       │   ├── styles/            # Theme tokens, layout, typography, animations
│       │   └── utils/             # Formatting, date utilities, validators, helpers
│       ├── package.json
│       └── vite.config.js
```

---

## 3. Frontend Architecture

### 3.1 Routing & RBAC Guards
- **Route Definitions**: Located in [`src/constants/routes.js`](file:///d:/FInal%20Year/sci/frontend/src/constants/routes.js).
- **Route Configuration**: Centralized in [`src/app/routes/routeConfig.jsx`](file:///d:/FInal%20Year/sci/frontend/src/app/routes/routeConfig.jsx) with code splitting via `React.lazy` and dynamic chunk loading.
- **Access Guard**: [`src/app/routes/ProtectedRoute.jsx`](file:///d:/FInal%20Year/sci/frontend/src/app/routes/ProtectedRoute.jsx) inspects the session role against authorized roles and handles first-time student login redirection.

### 3.2 Centralized API Layer
API interactions are organized into domain-specific service objects in [`src/services/api/`](file:///d:/FInal%20Year/sci/frontend/src/services/api/):
- **Client**: [`src/services/api/client.js`](file:///d:/FInal%20Year/sci/frontend/src/services/api/client.js) manages request interception, token attachment, automatic refresh queuing on HTTP 401, and unified user feedback via toast notifications.
- **Endpoints**: Defined in [`src/services/api/endpoints.js`](file:///d:/FInal%20Year/sci/frontend/src/services/api/endpoints.js).
- **Services**: `authApi`, `studentApi`, `attendanceApi`, `timetableApi`, `facultyApi`, `gatePassApi`, `notificationApi`, `eventsApi`, `forumApi`, `placementApi`, and `aiApi`.

### 3.3 Constants & Utility Abstractions
- **Roles & Permissions**: Defined in [`src/constants/roles.js`](file:///d:/FInal%20Year/sci/frontend/src/constants/roles.js) and [`src/constants/permissions.js`](file:///d:/FInal%20Year/sci/frontend/src/constants/permissions.js).
- **Formatters & Date Helpers**: Centralized in [`src/utils/`](file:///d:/FInal%20Year/sci/frontend/src/utils/) using `date-fns` for internationalized and relative timestamp formatting.

---

## 4. Backend Architecture

### 4.1 Layered Backend Design
The backend is structured into clear layers:
- **Routes (`app/routes/`)**: FastAPI routers accepting incoming HTTP requests and WebSocket connections, validating inputs via DTO schemas, and invoking services.
- **Services (`app/services/`)**: Business logic orchestration, multi-key Gemini AI pool balancing, authentication and password hashing, and domain calculations.
- **Repositories (`app/repositories/`)**: Async SQLAlchemy database query encapsulation.
- **Database Engine (`app/core/database.py`)**: Async engine supporting both MySQL (primary) and SQLite (automatic local fallback) with connection health checks.

### 4.2 AI Multi-Key Rotation Pool
The platform incorporates an automatic multi-key rotation manager ([`app/services/api_key_manager.py`](file:///d:/FInal%20Year/sci/backend/app/services/api_key_manager.py)) supporting primary and secondary Gemini API keys with retry fallback and cooldown handling.

---

## 5. Development & Testing Commands

### Backend
```powershell
# Activate Virtual Environment
cd "d:\FInal Year\sci\backend"
.\venv\Scripts\Activate.ps1

# Run Unified Test Suite
python tests/run_tests.py

# Run Database Creation / Seed Scripts
python scripts/create_tables.py
python scripts/seed_data.py

# Launch FastAPI Development Server
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```powershell
cd "d:\FInal Year\sci\frontend"

# Production Build
npm run build

# Start Local Dev Server
npm run dev
```
