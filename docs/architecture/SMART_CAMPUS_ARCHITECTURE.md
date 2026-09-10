# Smart Campus AI Architecture

This diagram shows the deployed runtime architecture of the Smart Campus AI Management System. It reflects the implementation under `sci/frontend` and `sci/backend`.

```mermaid
flowchart LR
    subgraph Users["Campus Users"]
        Student["Student"]
        Faculty["Faculty / HOD"]
        Admin["Administrator"]
        Operations["Security / Warden / Guardian"]
    end

    subgraph Client["Client Layer | React 18 + Vite"]
        SPA["Responsive React SPA"]
        Features["Feature Modules\nAuth · Academics · Attendance\nGate Pass · Timetable · Placements\nCampus Pulse · Learning Intelligence"]
        State["Contexts & Route Guards\nAuth · Notifications · Theme · RBAC"]
        HTTP["Axios API Client"]
        WSClient["WebSocket Notification Client"]
    end

    subgraph Server["Server Layer | FastAPI + Uvicorn"]
        Middleware["Middleware\nCORS · Rate Limiting\nInput Sanitization · JWT/RBAC"]
        API["API Routes / Controllers\nREST endpoints and WebSocket endpoint"]
        Services["Application Services\nWorkflow orchestration · imports\nnotifications · file handling"]
        Repositories["Repositories + SQLAlchemy ORM\nAsync sessions and domain models"]
    end

    subgraph Intelligence["Domain Intelligence"]
        CSP["CSP Timetable Solver"]
        ALRA["ALRA Academic Risk"]
        CLPA["CLPA Learning Profile"]
        KDPA["KDPA Knowledge Decay"]
        DCRA["DCRA+ Resource Allocation"]
        DSEA["DSEA Skill-Gap Matcher"]
        Pulse["Campus Pulse Analytics"]
        ICQEA["ICQEA Learning Content / Quiz Engine"]
    end

    subgraph Persistence["Persistence and Files"]
        DB[("SQLite\nLocal default")]
        MySQL[("MySQL / MariaDB\nUSE_MYSQL=true")]
        Uploads[("Local Upload Storage\nStudy materials · imports · media")]
    end

    Gemini["Google Gemini API\nStructured generation · parsing\nAI categorization · resume review"]
    YouTube["YouTube\nExternal study video content"]

    Student --> SPA
    Faculty --> SPA
    Admin --> SPA
    Operations --> SPA

    SPA --> Features
    Features --> State
    Features --> HTTP
    State --> WSClient
    HTTP -->|HTTPS REST / JSON| Middleware
    WSClient -->|WebSocket| API

    Middleware --> API
    API --> Services
    API -->|authenticated real-time events| WSManager["WebSocket Manager"]
    Services --> Repositories
    Services --> Intelligence
    Services --> Uploads
    Repositories --> DB
    Repositories --> MySQL

    Services -->|prompts and validated responses| Gemini
    ICQEA -->|AI-assisted content| Gemini
    Features -->|study search / embed| YouTube

    classDef client fill:#e8f3ff,stroke:#2463a6,color:#12304f
    classDef server fill:#eaf7ef,stroke:#25834b,color:#123b24
    classDef intelligence fill:#fff3dc,stroke:#b56a00,color:#4d2d00
    classDef data fill:#f4eafd,stroke:#7441a8,color:#32184e
    classDef external fill:#fce8e8,stroke:#b44343,color:#4a1919

    class SPA,Features,State,HTTP,WSClient client
    class Middleware,API,Services,Repositories,WSManager server
    class CSP,ALRA,CLPA,KDPA,DCRA,DSEA,Pulse,ICQEA intelligence
    class DB,MySQL,Uploads data
    class Gemini,YouTube external
```

## Runtime Flow

1. A campus user interacts with the React SPA through a role-specific feature module.
2. Axios sends authenticated REST requests to the FastAPI middleware and route layer.
3. Middleware validates origins, request size, rate limits, JWT claims, and role permissions before dispatch.
4. Application services coordinate repositories, uploads, notifications, and the intelligence algorithms.
5. SQLAlchemy persists data in SQLite by default on local Windows development, or MySQL/MariaDB when `USE_MYSQL=true`.
6. WebSocket notifications are pushed through the backend WebSocket manager to connected clients.
7. Gemini is used only for AI-assisted operations such as structured study plans, document/timetable parsing, categorization, quizzes, and resume review.

## Main Architectural Decisions

- **Client-server separation:** the React client contains presentation and interaction flows; domain decisions remain in FastAPI services and algorithms.
- **Repository boundary:** database access is isolated behind SQLAlchemy repositories, allowing SQLite and MySQL configuration without changing feature flows.
- **Algorithm isolation:** scheduling, risk, learning, allocation, placement, and campus analytics engines are kept separate from transport concerns.
- **Dual communication modes:** REST handles request/response workflows, while WebSockets handle live notifications and operational updates.
- **Local file boundary:** uploaded materials and imports are stored outside relational tables and referenced by backend services.