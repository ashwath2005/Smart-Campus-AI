from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.services.auth_service import hash_password, verify_password, create_token, decode_token
from app.services.token_service import (
    create_refresh_token,
    rotate_refresh_token,
    validate_refresh_token,
    revoke_token,
    revoke_all_user_tokens,
)
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    department: Optional[str] = None
    roll_number: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = "A"


class LoginRequest(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    roll_number: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None


@router.post("/register")
async def register(req: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == req.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Hash password and create user
    hashed = hash_password(req.password)
    new_user = User(
        name=req.name,
        email=req.email,
        password=hashed,
        role=req.role,
        department=req.department,
        roll_number=req.roll_number,
        semester=req.semester,
        section=req.section,
    )
    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)

    # Create JWT access token
    token = create_token(
        {
            "user_id": new_user.id,
            "email": new_user.email,
            "role": new_user.role,
            "name": new_user.name,
        }
    )

    # Create refresh token and set as HTTP-only cookie
    raw_refresh_token = await create_refresh_token(
        user_id=new_user.id, device_id=None, db=db
    )
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh_token,
        httponly=True,
        secure=False,  # Set to True in production (HTTPS)
        samesite="lax",
        path="/api/auth",
        max_age=7 * 24 * 60 * 60,  # 7 days
    )

    return {
        "token": token,
        "access_token": token,
        "token_type": "bearer",
        "role": new_user.role,
        "name": new_user.name,
        "user_id": new_user.id,
        "section": new_user.section,
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "department": new_user.department,
            "section": new_user.section,
        },
    }


@router.post("/login")
async def login(req: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    # Find user by email or roll number (case-insensitive and stripped)
    search_term = req.email.strip().lower()
    result = await db.execute(
        select(User).where(
            (func.lower(User.email) == search_term) | 
            (func.lower(User.roll_number) == search_term)
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/roll number or password",
        )

    # Verify password
    if not verify_password(req.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/roll number or password",
        )

    # Create JWT access token
    token = create_token(
        {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.name,
        }
    )

    # Create refresh token and set as HTTP-only cookie
    raw_refresh_token = await create_refresh_token(
        user_id=user.id, device_id=None, db=db
    )
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh_token,
        httponly=True,
        secure=False,  # Set to True in production (HTTPS)
        samesite="lax",
        path="/api/auth",
        max_age=7 * 24 * 60 * 60,  # 7 days
    )

    return {
        "token": token,
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "user_id": user.id,
        "section": user.section,
        "is_first_login": user.is_first_login,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "department": user.department,
            "section": user.section,
        },
    }


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    # Simulated password reset email request. Check if user exists first.
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email does not exist",
        )
    return {"message": "Password reset token sent to your email (simulated)"}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    # Simulated token verify and password change
    # In a real app we would decode the password reset token, get user email, and update the password.
    # For simulation, we will reset the password for a dummy user or return success.
    # To keep it semi-functional, we will just say password changed successfully.
    return {"message": "Password reset successfully (simulated)"}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "department": current_user["department"],
        "roll_number": current_user["roll_number"],
        "semester": current_user.get("semester"),
        "section": current_user.get("section"),
    }


@router.put("/profile")
async def update_profile(
    req: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == current_user["id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if req.name is not None:
        user.name = req.name
    if req.department is not None:
        user.department = req.department
    if req.roll_number is not None:
        user.roll_number = req.roll_number
    if req.semester is not None:
        user.semester = req.semester
    if req.section is not None:
        user.section = req.section

    await db.flush()
    await db.refresh(user)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department": user.department,
        "roll_number": user.roll_number,
        "semester": user.semester,
        "section": user.section,
        "message": "Profile updated successfully",
    }


class ChangeFirstPasswordRequest(BaseModel):
    new_password: str


@router.post("/change-first-password")
async def change_first_password(
    req: ChangeFirstPasswordRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == current_user["id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password = hash_password(req.new_password)
    user.is_first_login = False
    user.password_changed = True

    await db.flush()

    # Revoke all existing refresh tokens so user must re-authenticate
    await revoke_all_user_tokens(current_user["id"], db)

    return {"message": "Password updated successfully. You now have full portal access."}


@router.post("/skip-password-change")
async def skip_password_change(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == current_user["id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_first_login = False

    await db.flush()
    return {"message": "Default password kept. You can change it later from settings."}



@router.post("/refresh")
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Rotate refresh token and issue a new access token."""
    old_token = request.cookies.get("refresh_token")
    if not old_token:
        # Check if Authorization Bearer token was supplied
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            raw_token = auth_header.split(" ")[1]
            try:
                payload = decode_token(raw_token)
                uid = payload.get("user_id") or payload.get("id")
                if uid:
                    user = await db.get(User, uid)
                    if user:
                        new_access_token = create_token({
                            "user_id": user.id,
                            "email": user.email,
                            "role": user.role,
                            "name": user.name,
                        })
                        return {"access_token": new_access_token, "token": new_access_token}
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    # Rotate: validate old token, revoke it, issue new one
    new_refresh_token = await rotate_refresh_token(old_token, db)
    if new_refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Get the user associated with the old token to create a new access token
    token_record = await validate_refresh_token(new_refresh_token, db)
    if token_record is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate new token",
        )

    result = await db.execute(select(User).where(User.id == token_record.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Create new access token
    access_token = create_token(
        {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.name,
        }
    )

    # Set new refresh token as HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,  # Set to True in production (HTTPS)
        samesite="lax",
        path="/api/auth",
        max_age=7 * 24 * 60 * 60,  # 7 days
    )

    return {"access_token": access_token}


@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Revoke the refresh token and clear the cookie."""
    token_str = request.cookies.get("refresh_token")
    if token_str:
        await revoke_token(token_str, db)

    # Delete the refresh token cookie
    response.delete_cookie(
        key="refresh_token",
        path="/api/auth",
    )

    return {"message": "Logged out successfully"}
