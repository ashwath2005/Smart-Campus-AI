import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from app.core.config import settings
from app.core.database import engine, Base, async_session
from app.core.security import decode_token
from app.api.router import api_router
from app.models.user import User
from app.middleware.rate_limiter import RateLimitMiddleware
from app.middleware.input_sanitizer import UploadSizeMiddleware
from app.utils.websocket_manager import manager as ws_manager
import app.models

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── Middleware Pipeline ───────────────────────────────────────────────────────
# Starlette onion architecture: last added middleware executes first on requests.
app.add_middleware(RateLimitMiddleware)
app.add_middleware(UploadSizeMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex="https?://localhost:\\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── API Routers (Dual Registration for Compatibility) ─────────────────────────
# Mounts routes on both /api and /api/v1 for standard client & test suite compatibility
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="/api/v1")

# ─── Static Media Mount ────────────────────────────────────────────────────────
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


# ─── Real-Time WebSocket Notification Gateway ─────────────────────────────────
@app.websocket("/ws/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: str = Query(...),
):
    await websocket.accept()
    try:
        payload = decode_token(token)
        user_id = payload.get("user_id") or payload.get("id")
        if not user_id:
            await websocket.close(code=4001, reason="Invalid token: user identity missing")
            return

        async with async_session() as db:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user:
                await websocket.close(code=4002, reason="User not found")
                return

            user_id = user.id
            role = user.role
            department = user.department
            semester = user.semester

        await ws_manager.connect(websocket, user_id, role, department, semester)

        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
        finally:
            ws_manager.disconnect(websocket, user_id)

    except Exception as e:
        try:
            await websocket.close(code=4000, reason=str(e))
        except Exception:
            pass


# ─── Application Lifespan / Startup Events ────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database Tables: All ORM entities verified successfully.")
    except Exception as e:
        print(f"Database Table Initialization Note: {e}")

    if settings.JWT_SECRET == "smartcampus_secret_key_2024":
        print("\n" + "=" * 80)
        print("SECURITY NOTE: Default JWT_SECRET is in use for development.")
        print("Configure a cryptographically secure JWT_SECRET in production environment.")
        print("=" * 80 + "\n")


# ─── Health Check Root ────────────────────────────────────────────────────────
@app.get("/")
async def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "api_v1": "/api/v1",
    }
