"""
Refresh Token Service

Manages refresh token lifecycle: creation, validation, rotation, and revocation.
Tokens are stored as SHA-256 hashes in the database for security.
"""

import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.token import RefreshToken


# Refresh token validity period
REFRESH_TOKEN_EXPIRY_DAYS = 7


def _hash_token(token: str) -> str:
    """Hash a raw token string using SHA-256."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def create_refresh_token(
    user_id: int, device_id: Optional[str], db: AsyncSession
) -> str:
    """
    Generate a new refresh token for a user.

    Creates a UUID4 token, hashes it with SHA-256, stores the hash in the
    database with a 7-day expiry, and returns the raw token string.

    Args:
        user_id: The ID of the user to create the token for.
        device_id: Optional device identifier for the session.
        db: The async database session.

    Returns:
        The raw UUID4 token string (to be sent to the client).
    """
    raw_token = str(uuid.uuid4())
    token_hash = _hash_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRY_DAYS)

    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        device_id=device_id,
        expires_at=expires_at,
    )

    db.add(refresh_token)
    await db.flush()

    return raw_token


async def validate_refresh_token(
    token_str: str, db: AsyncSession
) -> Optional[RefreshToken]:
    """
    Validate a refresh token string.

    Hashes the provided token, looks it up in the database, and checks
    that it is not revoked and not expired.

    Args:
        token_str: The raw token string to validate.
        db: The async database session.

    Returns:
        The RefreshToken record if valid, or None if invalid/expired/revoked.
    """
    token_hash = _hash_token(token_str)

    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    token_record = result.scalars().first()

    if token_record is None:
        return None

    # Check if revoked
    if token_record.revoked:
        return None

    # Check if expired
    if token_record.expires_at < datetime.utcnow():
        return None

    return token_record


async def rotate_refresh_token(
    old_token_str: str, db: AsyncSession
) -> Optional[str]:
    """
    Rotate a refresh token: validate the old one, revoke it, and issue a new one.

    Args:
        old_token_str: The current raw token string to rotate.
        db: The async database session.

    Returns:
        The new raw token string, or None if the old token was invalid.
    """
    old_token = await validate_refresh_token(old_token_str, db)

    if old_token is None:
        return None

    # Revoke the old token
    old_token.revoked = True
    await db.flush()

    # Create a new token for the same user and device
    new_token = await create_refresh_token(
        user_id=old_token.user_id,
        device_id=old_token.device_id,
        db=db,
    )

    return new_token


async def revoke_token(token_str: str, db: AsyncSession) -> bool:
    """
    Revoke a specific refresh token.

    Hashes the token and marks it as revoked in the database.

    Args:
        token_str: The raw token string to revoke.
        db: The async database session.

    Returns:
        True if the token was found and revoked, False otherwise.
    """
    token_hash = _hash_token(token_str)

    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    token_record = result.scalars().first()

    if token_record is None:
        return False

    token_record.revoked = True
    await db.flush()

    return True


async def revoke_all_user_tokens(user_id: int, db: AsyncSession) -> int:
    """
    Revoke all active refresh tokens for a user.

    Used when a user changes their password or an admin forces logout.

    Args:
        user_id: The ID of the user whose tokens should be revoked.
        db: The async database session.

    Returns:
        The number of tokens that were revoked.
    """
    result = await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked == False)
        .values(revoked=True)
    )

    await db.flush()

    return result.rowcount
