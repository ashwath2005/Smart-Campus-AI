# Implementation Tasks

## Task 1: Rate Limiter Middleware

- [x] 1.1 Create `backend/app/middleware/rate_limiter.py` with `RateLimitStore` class using sliding window counters with deque of timestamps
- [x] 1.2 Implement `RateLimitMiddleware` class that extracts client IP from request, checks rate limit, and returns 429 with Retry-After header when exceeded
- [x] 1.3 Configure two rate limit tiers: strict (5 req/60s) for `/api/auth/*` endpoints and standard (60 req/60s) for all other endpoints
- [x] 1.4 Register the rate limiter middleware in `backend/app/main.py` before CORS middleware
- [x] 1.5 Add authenticated user ID extraction for rate limiting logged-in users by user_id instead of IP

## Task 2: Refresh Token Authentication

- [x] 2.1 Create `backend/app/models/token.py` with `RefreshToken` model (id, user_id, token_hash, device_id, expires_at, created_at, revoked)
- [x] 2.2 Create `backend/app/services/token_service.py` with functions: `create_refresh_token`, `validate_refresh_token`, `rotate_refresh_token`, `revoke_token`, `revoke_all_user_tokens`
- [x] 2.3 Modify `backend/app/services/auth_service.py` to issue short-lived access tokens (30 minutes) instead of 24-hour tokens
- [x] 2.4 Modify `backend/app/routes/auth.py` login endpoint to return access_token in body and set refresh_token as HTTP-only cookie
- [x] 2.5 Add `POST /api/auth/refresh` endpoint that validates refresh token cookie, rotates token, and returns new access_token
- [x] 2.6 Add `POST /api/auth/logout` endpoint that revokes the refresh token from the cookie
- [x] 2.7 Modify password change endpoints to call `revoke_all_user_tokens` for the user
- [x] 2.8 Update `backend/app/models/__init__.py` to export the RefreshToken model
- [x] 2.9 Modify `frontend/src/api/axios.ts` to add response interceptor that catches 401 errors and attempts token refresh before retrying
- [x] 2.10 Modify `frontend/src/context/AuthContext.tsx` to handle refresh token flow and update stored access tokens

## Task 3: Input Validation and Sanitization

- [x] 3.1 Create `backend/app/middleware/input_sanitizer.py` with `sanitize_text` function that strips script tags, iframes, event handlers, and javascript: URIs
- [x] 3.2 Add file upload size validation middleware that checks Content-Length and rejects uploads over 10MB with HTTP 413
- [x] 3.3 Create a Pydantic base model mixin `SanitizedModel` with field validators that auto-sanitize string fields and enforce max lengths (255 name, 1000 description, 50000 content)
- [x] 3.4 Update existing Pydantic request models in auth, assignments, announcements, and forum routes to inherit from `SanitizedModel`
- [x] 3.5 Register the upload size middleware in `backend/app/main.py`

## Task 4: Discussion Forum Backend

- [x] 4.1 Create `backend/app/models/forum.py` with `ForumPost` model (id, title, body, course_tag, author_id, is_pinned, created_at, updated_at) and `ForumReply` model (id, post_id, parent_reply_id, body, author_id, created_at, updated_at)
- [x] 4.2 Update `backend/app/models/__init__.py` to export ForumPost and ForumReply
- [x] 4.3 Create `backend/app/routes/forum.py` with GET `/api/forum/posts` endpoint supporting pagination (page, page_size=20), course_tag filter, and sorting by most recent activity with pinned posts first
- [x] 4.4 Add POST `/api/forum/posts` endpoint for creating posts (requires student or faculty role)
- [x] 4.5 Add GET `/api/forum/posts/{id}` endpoint returning post with nested replies
- [x] 4.6 Add PUT `/api/forum/posts/{id}` and DELETE `/api/forum/posts/{id}` with ownership check (author) or moderator override (faculty/admin)
- [x] 4.7 Add POST `/api/forum/posts/{id}/pin` endpoint restricted to faculty and admin roles
- [x] 4.8 Add POST `/api/forum/posts/{id}/replies` endpoint for adding replies with notification to post author
- [x] 4.9 Add PUT and DELETE endpoints for `/api/forum/replies/{id}` with same authorization logic
- [x] 4.10 Add GET `/api/forum/search?q=` endpoint that searches post titles, post bodies, and reply bodies
- [x] 4.11 Register forum router in `backend/app/main.py`

## Task 5: Discussion Forum Frontend

- [x] 5.1 Create `frontend/src/pages/Forum.tsx` with course tab filter, search bar, paginated post listing showing title, author, reply count, and time since last activity
- [x] 5.2 Create `frontend/src/pages/ForumPost.tsx` with full post view, nested reply thread, markdown rendering using react-markdown, and reply form
- [x] 5.3 Add create post modal/form with title, body (markdown editor), and course tag selector
- [x] 5.4 Add edit and delete functionality with confirmation modals, restricted by authorization rules
- [x] 5.5 Add pin/unpin button visible only to faculty and admin users
- [x] 5.6 Add forum routes to `frontend/src/App.tsx` accessible to student, faculty, and admin roles
- [x] 5.7 Add Forum link to sidebar navigation in `frontend/src/components/Sidebar.tsx`

## Task 6: AI Response Caching

- [x] 6.1 Create `backend/app/services/ai_cache.py` with `AICache` class implementing LRU eviction (max 500 entries), TTL-based expiry (24 hours), and SHA-256 cache key generation
- [x] 6.2 Create a `cached_ai_call` decorator/wrapper function that checks cache before calling the wrapped AI function and stores results on cache miss
- [x] 6.3 Integrate caching into `backend/app/services/gemini_service.py` for `summarize_pdf_text`, `generate_quiz`, `generate_study_plan`, `review_resume`, `analyze_skill_gap`, `generate_interview_questions`, and `career_recommendations`
- [x] 6.4 Add admin endpoint `DELETE /api/admin/ai-cache` to clear the cache and return confirmation
- [x] 6.5 Add cache hit/miss statistics to the admin dashboard data endpoint

## Task 7: Progressive Web App Support

- [x] 7.1 Create `frontend/public/manifest.json` with app name, short_name, icons (192px, 512px), theme_color, background_color, display: standalone, start_url
- [x] 7.2 Create PWA icon files (placeholder SVG-based PNGs) at `frontend/public/icons/icon-192.png` and `frontend/public/icons/icon-512.png`
- [x] 7.3 Create `frontend/public/sw.js` service worker with cache-first strategy for static assets and network-first for API calls with offline fallback
- [x] 7.4 Create `frontend/src/service-worker-registration.ts` with registration logic and update detection that prompts user to refresh
- [x] 7.5 Modify `frontend/index.html` to add manifest link, theme-color meta tag, apple-touch-icon, and service worker registration script
- [x] 7.6 Add offline indicator component that displays when navigator.onLine is false
- [x] 7.7 Install and configure `vite-plugin-pwa` in `vite.config.ts` for production build integration

## Task 8: Database Migration Infrastructure

- [x] 8.1 Add `alembic` to `backend/requirements.txt`
- [x] 8.2 Create `backend/alembic.ini` with script_location pointing to alembic directory
- [x] 8.3 Create `backend/alembic/env.py` configured for async SQLAlchemy, importing Base metadata from app.database, with SQLite/MySQL compatibility
- [x] 8.4 Create `backend/alembic/script.mako` template for migration file generation
- [x] 8.5 Generate initial migration from existing models using `alembic revision --autogenerate -m "initial_schema"`
- [x] 8.6 Add migration for new models: RefreshToken, ForumPost, ForumReply
- [x] 8.7 Update `backend/create_tables.py` to use Alembic upgrade instead of direct `create_all`
