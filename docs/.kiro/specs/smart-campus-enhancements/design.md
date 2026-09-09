# Design Document

## Overview

This document details the technical design for enhancing the Smart Campus AI platform across security, features, performance, and developer experience. The design leverages the existing FastAPI + SQLAlchemy backend and React + TypeScript frontend, adding new middleware layers, database models, service modules, and frontend components.

## Architecture

### High-Level Architecture Changes

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend (PWA)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Auth Context │  │Forum Pages  │  │ Service Worker + Manifest│ │
│  │(Refresh Flow)│  │(Discussion) │  │ (Offline + Install)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                              │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │Rate Limiter│  │Input Sanitize│  │ Refresh Token Middleware │ │
│  │(Middleware) │  │(Middleware)  │  │ (Auth Enhancement)       │ │
│  └────────────┘  └─────────────┘  └──────────────────────────┘ │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │Forum Routes│  │AI Cache Svc │  │ Alembic Migrations       │ │
│  │(/api/forum)│  │(LRU + TTL)  │  │ (Schema Versioning)      │ │
│  └────────────┘  └─────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Database (SQLite dev / MySQL prod)                   │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐ │
│  │refresh_tokens│  │forum_posts    │  │alembic_version       │ │
│  │              │  │forum_replies  │  │                       │ │
│  └──────────────┘  └───────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### Component 1: Rate Limiter Middleware

**File:** `backend/app/middleware/rate_limiter.py`

**Purpose:** Enforce per-client request limits using an in-memory sliding window counter.

**Design:**
- Uses an in-memory dictionary with IP/user_id as keys and deque of timestamps as values
- Two tiers: strict (5 req/60s for auth endpoints) and standard (60 req/60s for general endpoints)
- Implements as FastAPI middleware that runs before route handlers
- Returns HTTP 429 with Retry-After header when limit exceeded
- Automatic cleanup of expired windows via background task

**Data Structure:**
```python
from collections import defaultdict, deque
from time import time

class RateLimitStore:
    def __init__(self):
        self.requests: dict[str, deque] = defaultdict(deque)
    
    def is_rate_limited(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
        now = time()
        window = self.requests[key]
        # Remove expired timestamps
        while window and window[0] <= now - window_seconds:
            window.popleft()
        if len(window) >= max_requests:
            retry_after = int(window[0] + window_seconds - now) + 1
            return True, retry_after
        window.append(now)
        return False, 0
```

**Integration:** Added as middleware in `main.py` before CORS middleware.

---

### Component 2: Refresh Token Service

**File:** `backend/app/services/token_service.py`

**Purpose:** Manage refresh token lifecycle including creation, rotation, validation, and revocation.

**Database Model — `RefreshToken`:**
```python
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False)
    device_id = Column(String(255), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    revoked = Column(Boolean, default=False)
```

**Token Flow:**
1. Login → generate access token (30min) + refresh token (7 days)
2. Refresh → validate refresh token hash, issue new pair, revoke old refresh token
3. Logout → revoke the session's refresh token
4. Password change → revoke all refresh tokens for user

**Access Token:** Short-lived JWT (30 minutes), contains user_id, email, role, name.
**Refresh Token:** UUID4 string, stored as SHA-256 hash in database.

---

### Component 3: Input Sanitizer Middleware

**File:** `backend/app/middleware/input_sanitizer.py`

**Purpose:** Validate request body sizes and strip dangerous HTML content from text fields.

**Design:**
- Pre-processing middleware that intercepts request bodies
- Uses Python's `html` module and regex to strip `<script>`, `<iframe>`, event handlers
- Enforces field length limits via Pydantic validators (added as base class mixin)
- File upload size check via `Content-Length` header inspection

**Sanitization Function:**
```python
import re

DANGEROUS_PATTERNS = [
    re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),
    re.compile(r'<iframe[^>]*>.*?</iframe>', re.IGNORECASE | re.DOTALL),
    re.compile(r'on\w+\s*=\s*"[^"]*"', re.IGNORECASE),
    re.compile(r'javascript:', re.IGNORECASE),
]

def sanitize_text(text: str) -> str:
    for pattern in DANGEROUS_PATTERNS:
        text = pattern.sub('', text)
    return text.strip()
```

---

### Component 4: Discussion Forum

**Files:**
- `backend/app/models/forum.py` — Database models
- `backend/app/routes/forum.py` — API endpoints
- `frontend/src/pages/Forum.tsx` — Forum listing page
- `frontend/src/pages/ForumPost.tsx` — Individual post/thread page

**Database Models:**

```python
class ForumPost(Base):
    __tablename__ = "forum_posts"
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    course_tag = Column(String(100), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ForumReply(Base):
    __tablename__ = "forum_replies"
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id"), nullable=False)
    parent_reply_id = Column(Integer, ForeignKey("forum_replies.id"), nullable=True)
    body = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/forum/posts` | List posts with pagination and course filter |
| POST | `/api/forum/posts` | Create a new forum post |
| GET | `/api/forum/posts/{id}` | Get post with replies |
| PUT | `/api/forum/posts/{id}` | Edit a post (author or moderator) |
| DELETE | `/api/forum/posts/{id}` | Delete a post (author or moderator) |
| POST | `/api/forum/posts/{id}/pin` | Pin/unpin a post (faculty/admin) |
| POST | `/api/forum/posts/{id}/replies` | Add a reply |
| PUT | `/api/forum/replies/{id}` | Edit a reply |
| DELETE | `/api/forum/replies/{id}` | Delete a reply |
| GET | `/api/forum/search` | Search posts and replies |

**Frontend Components:**
- `Forum.tsx`: Course-filtered listing with pagination, pinned posts at top, search bar
- `ForumPost.tsx`: Full thread view with nested replies, markdown rendering, reply form
- Uses existing UI components (Card, Button, Input, DataTable, Tabs)

---

### Component 5: AI Response Cache

**File:** `backend/app/services/ai_cache.py`

**Purpose:** Cache AI-generated responses to reduce Gemini API calls and improve response times.

**Design:**
- LRU cache with TTL using `OrderedDict` for O(1) operations
- Cache key generated via SHA-256 hash of (function_name + sorted JSON of parameters)
- 500 entry maximum with LRU eviction
- 24-hour TTL for all cached entries
- Thread-safe with asyncio Lock

```python
from collections import OrderedDict
from hashlib import sha256
import json
import time
import asyncio

class AICache:
    def __init__(self, max_size: int = 500, default_ttl: int = 86400):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache: OrderedDict[str, tuple[float, any]] = OrderedDict()
        self._lock = asyncio.Lock()
    
    def _make_key(self, func_name: str, params: dict) -> str:
        raw = f"{func_name}:{json.dumps(params, sort_keys=True)}"
        return sha256(raw.encode()).hexdigest()
    
    async def get(self, func_name: str, params: dict) -> any | None:
        async with self._lock:
            key = self._make_key(func_name, params)
            if key in self.cache:
                expiry, value = self.cache[key]
                if time.time() < expiry:
                    self.cache.move_to_end(key)
                    return value
                del self.cache[key]
            return None
    
    async def set(self, func_name: str, params: dict, value: any):
        async with self._lock:
            key = self._make_key(func_name, params)
            if key in self.cache:
                del self.cache[key]
            elif len(self.cache) >= self.max_size:
                self.cache.popitem(last=False)  # Remove LRU
            self.cache[key] = (time.time() + self.default_ttl, value)
    
    async def clear(self):
        async with self._lock:
            self.cache.clear()
```

**Integration:** Wraps existing `gemini_service.py` functions with cache check/store pattern via decorator.

---

### Component 6: PWA Infrastructure

**Files:**
- `frontend/public/manifest.json` — Web App Manifest
- `frontend/public/sw.js` — Service Worker
- `frontend/src/service-worker-registration.ts` — Registration logic
- `frontend/index.html` — Manifest link and SW registration script

**Manifest:**
```json
{
  "name": "Smart Campus AI",
  "short_name": "SmartCampus",
  "description": "AI-powered college management system",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Service Worker Strategy:**
- Cache-first for static assets (JS, CSS, images, fonts)
- Network-first for API calls with offline fallback message
- Stale-while-revalidate for HTML pages
- Version-based cache busting with `skipWaiting` + `clients.claim`

---

### Component 7: Database Migration Infrastructure

**Files:**
- `backend/alembic.ini` — Alembic configuration
- `backend/alembic/env.py` — Migration environment setup
- `backend/alembic/versions/` — Migration scripts directory

**Design:**
- Alembic initialized with async support using the existing `engine`
- `env.py` configured to detect SQLite vs MySQL and adjust dialect-specific DDL
- Initial migration auto-generates from existing models
- All new feature models (forum, refresh_tokens) included in migration generation

**Configuration:**
```ini
[alembic]
script_location = alembic
sqlalchemy.url = driver://user:pass@localhost/dbname  # overridden in env.py
```

The `env.py` will import `Base.metadata` from `app.database` and use the runtime `engine` for online migrations.

## Correctness Properties

### Property 1: Rate Limiter Boundary Enforcement
- **Type:** Invariant
- **Criteria:** 1.1, 1.2
- **Property:** For all request sequences of length N to a rate-limited endpoint with limit L, exactly min(N, L) requests succeed and max(0, N - L) requests receive HTTP 429
- **Test approach:** Generate random request counts (1-100), verify the exact split between successes and rejections matches the configured limit

### Property 2: Refresh Token Rotation Uniqueness
- **Type:** Round-trip / Invariant
- **Criteria:** 2.2, 2.3
- **Property:** For all valid refresh operations, the new refresh token is always different from the previous one, and using the old token after rotation always fails with 401
- **Test approach:** Generate sequences of refresh operations and verify token uniqueness and old-token invalidation

### Property 3: Input Sanitization Idempotence
- **Type:** Idempotence
- **Criteria:** 3.2
- **Property:** For all text inputs T, sanitize(sanitize(T)) == sanitize(T). Sanitizing already-clean text produces no change.
- **Test approach:** Generate strings with various HTML/script injections, verify double-sanitization produces same result as single pass

### Property 4: Cache Key Determinism
- **Type:** Round-trip / Invariant
- **Criteria:** 5.3
- **Property:** For all function names F and parameter sets P, make_key(F, P) always produces the same key, and make_key(F, P1) != make_key(F, P2) when P1 != P2
- **Test approach:** Generate parameter dictionaries and verify key stability and collision resistance

### Property 5: LRU Cache Size Invariant
- **Type:** Invariant
- **Criteria:** 5.5
- **Property:** For all sequences of cache operations, the cache size never exceeds max_size (500). After inserting N > max_size items, the least recently used items are evicted first.
- **Test approach:** Insert random sequences of entries, verify size constraint holds and eviction order matches LRU

### Property 6: Forum Post Ordering Invariant
- **Type:** Invariant
- **Criteria:** 4.3, 4.7
- **Property:** For all forum listings, pinned posts always appear before non-pinned posts, and within each group posts are ordered by most recent activity (descending)
- **Test approach:** Generate sets of posts with varying pin states and activity timestamps, verify ordering invariant

### Property 7: Forum Authorization Invariant
- **Type:** Invariant
- **Criteria:** 4.5, 4.6
- **Property:** For all (user, post) pairs where user.role == 'student' and post.author_id != user.id, edit and delete operations return HTTP 403
- **Test approach:** Generate user/post combinations and verify authorization decisions match ownership rules

### Property 8: Migration Reversibility
- **Type:** Round-trip
- **Criteria:** 7.2, 7.3, 7.4
- **Property:** For all migrations M, applying upgrade(M) then downgrade(M) returns the database schema to its pre-upgrade state
- **Test approach:** Apply each migration, capture schema, downgrade, capture schema, verify equality

## Dependencies

### Backend New Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| alembic | ^1.13.0 | Database migration management |
| bleach | ^6.1.0 | HTML sanitization |

### Frontend New Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| vite-plugin-pwa | ^0.19.0 | PWA build integration with Vite |
| workbox-precaching | ^7.0.0 | Service worker asset caching |

## File Structure Changes

```
backend/
├── alembic.ini                          (NEW)
├── alembic/
│   ├── env.py                           (NEW)
│   ├── script.mako                      (NEW)
│   └── versions/                        (NEW)
│       └── 001_initial_schema.py        (NEW)
├── app/
│   ├── middleware/
│   │   ├── rate_limiter.py              (NEW)
│   │   └── input_sanitizer.py           (NEW)
│   ├── models/
│   │   ├── forum.py                     (NEW)
│   │   ├── token.py                     (NEW)
│   │   └── __init__.py                  (MODIFIED - add new models)
│   ├── routes/
│   │   ├── auth.py                      (MODIFIED - refresh token flow)
│   │   └── forum.py                     (NEW)
│   ├── services/
│   │   ├── token_service.py             (NEW)
│   │   ├── ai_cache.py                  (NEW)
│   │   └── gemini_service.py            (MODIFIED - add cache integration)
│   └── main.py                          (MODIFIED - add middleware, forum router)

frontend/
├── public/
│   ├── manifest.json                    (NEW)
│   ├── sw.js                            (NEW)
│   └── icons/                           (NEW)
│       ├── icon-192.png                 (NEW)
│       └── icon-512.png                 (NEW)
├── src/
│   ├── pages/
│   │   ├── Forum.tsx                    (NEW)
│   │   └── ForumPost.tsx                (NEW)
│   ├── context/
│   │   └── AuthContext.tsx              (MODIFIED - refresh token handling)
│   ├── api/
│   │   └── axios.ts                     (MODIFIED - token refresh interceptor)
│   ├── service-worker-registration.ts   (NEW)
│   └── App.tsx                          (MODIFIED - add forum routes)
├── index.html                           (MODIFIED - manifest + SW registration)
└── vite.config.ts                       (MODIFIED - PWA plugin)
```

## API Changes

### New Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/refresh` | None (uses refresh token cookie) | Exchange refresh token for new token pair |
| POST | `/api/auth/revoke` | Bearer | Revoke a specific refresh token |
| GET | `/api/forum/posts` | Bearer | List forum posts (paginated) |
| POST | `/api/forum/posts` | Bearer (student/faculty) | Create forum post |
| GET | `/api/forum/posts/{id}` | Bearer | Get post with replies |
| PUT | `/api/forum/posts/{id}` | Bearer (author/moderator) | Edit post |
| DELETE | `/api/forum/posts/{id}` | Bearer (author/moderator) | Delete post |
| POST | `/api/forum/posts/{id}/pin` | Bearer (faculty/admin) | Toggle pin status |
| POST | `/api/forum/posts/{id}/replies` | Bearer | Add reply |
| PUT | `/api/forum/replies/{id}` | Bearer (author/moderator) | Edit reply |
| DELETE | `/api/forum/replies/{id}` | Bearer (author/moderator) | Delete reply |
| GET | `/api/forum/search` | Bearer | Search forum content |
| DELETE | `/api/admin/ai-cache` | Bearer (admin) | Clear AI cache |

### Modified Endpoints
| Method | Path | Change |
|--------|------|--------|
| POST | `/api/auth/login` | Returns access_token + sets refresh_token cookie |
| POST | `/api/auth/register` | Returns access_token + sets refresh_token cookie |
| POST | `/api/auth/logout` | New endpoint to revoke refresh token |

## Testing Strategy

- **Unit tests** for rate limiter store, sanitization functions, cache operations, token service
- **Property-based tests** for sanitization idempotence, cache key determinism, LRU invariant, forum ordering
- **Integration tests** for full auth flow with refresh tokens, forum CRUD with authorization, migration up/down cycles
- **Manual tests** for PWA installability, offline behavior, Lighthouse score validation
