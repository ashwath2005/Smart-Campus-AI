from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc
from typing import Optional
from app.database import get_db
from app.models.forum import ForumPost, ForumReply
from app.models.user import User
from app.middleware.auth_middleware import get_current_user
from app.middleware.input_sanitizer import SanitizedModel
from app.middleware.role_checker import require_role

router = APIRouter(prefix="/forum", tags=["Forum"])


# ─── Pydantic Schemas ────────────────────────────────────────────────────────


class CreatePostRequest(SanitizedModel):
    title: str
    body: Optional[str] = None
    content: Optional[str] = None
    course_tag: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None


class UpdatePostRequest(SanitizedModel):
    title: Optional[str] = None
    body: Optional[str] = None
    course_tag: Optional[str] = None


class CreateReplyRequest(SanitizedModel):
    body: Optional[str] = None
    content: Optional[str] = None
    parent_reply_id: Optional[int] = None


class UpdateReplyRequest(SanitizedModel):
    body: str


# ─── Helper Functions ─────────────────────────────────────────────────────────


def _can_modify(current_user: dict, author_id: int) -> bool:
    """Check if the current user can modify a resource (owner or moderator)."""
    if current_user["role"] in ("faculty", "admin"):
        return True
    return current_user["id"] == author_id


# ─── 4.3: GET /forum/posts — List posts with pagination ──────────────────────


@router.get("/posts")
async def list_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    course_tag: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List posts with pagination, optional course_tag filter, sorted by pinned first then most recent activity."""
    # Build query
    query = (
        select(
            ForumPost.id,
            ForumPost.title,
            ForumPost.body,
            ForumPost.course_tag,
            ForumPost.author_id,
            ForumPost.is_pinned,
            ForumPost.created_at,
            ForumPost.updated_at,
            User.name.label("author_name"),
            func.count(ForumReply.id).label("reply_count"),
        )
        .join(User, User.id == ForumPost.author_id)
        .outerjoin(ForumReply, ForumReply.post_id == ForumPost.id)
        .group_by(ForumPost.id, User.name)
    )

    if course_tag:
        query = query.where(ForumPost.course_tag == course_tag)

    # Sort: pinned posts first, then newest updated
    query = query.order_by(desc(ForumPost.is_pinned), desc(ForumPost.updated_at))

    # Pagination
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    posts = result.all()

    # Total count for pagination metadata
    count_query = select(func.count(ForumPost.id))
    if course_tag:
        count_query = count_query.where(ForumPost.course_tag == course_tag)
    total = (await db.execute(count_query)).scalar() or 0

    return {
        "posts": [
            {
                "id": post.id,
                "title": post.title,
                "body": post.body,
                "course_tag": post.course_tag,
                "author_id": post.author_id,
                "author_name": post.author_name,
                "is_pinned": post.is_pinned,
                "created_at": str(post.created_at) if post.created_at else None,
                "updated_at": str(post.updated_at) if post.updated_at else None,
                "reply_count": post.reply_count,
            }
            for post in posts
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ─── 4.4: POST /forum/posts — Create post ────────────────────────────────────


@router.post("/posts", status_code=status.HTTP_201_CREATED)
async def create_post(
    req: CreatePostRequest,
    current_user: dict = Depends(require_role("student", "faculty")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new forum post (requires student or faculty role)."""
    post_body = req.body or req.content or ""
    tag = req.course_tag or req.category or req.tags or "General"
    post = ForumPost(
        title=req.title,
        body=post_body,
        course_tag=tag,
        author_id=current_user["id"],
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)

    return {
        "id": post.id,
        "title": post.title,
        "body": post.body,
        "course_tag": post.course_tag,
        "author_id": post.author_id,
        "author_name": current_user["name"],
        "is_pinned": post.is_pinned,
        "created_at": str(post.created_at) if post.created_at else None,
        "updated_at": str(post.updated_at) if post.updated_at else None,
        "message": "Post created successfully",
    }


# ─── 4.5: GET /forum/posts/{id} — Get single post with replies ───────────────


@router.get("/posts/{post_id}")
async def get_post(
    post_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single post and all its replies."""
    post_query = (
        select(
            ForumPost.id,
            ForumPost.title,
            ForumPost.body,
            ForumPost.course_tag,
            ForumPost.author_id,
            ForumPost.is_pinned,
            ForumPost.created_at,
            ForumPost.updated_at,
            User.name.label("author_name"),
        )
        .join(User, User.id == ForumPost.author_id)
        .where(ForumPost.id == post_id)
    )
    post_result = await db.execute(post_query)
    post = post_result.first()

    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    replies_query = (
        select(
            ForumReply.id,
            ForumReply.post_id,
            ForumReply.parent_reply_id,
            ForumReply.body,
            ForumReply.author_id,
            ForumReply.created_at,
            ForumReply.updated_at,
            User.name.label("author_name"),
        )
        .join(User, User.id == ForumReply.author_id)
        .where(ForumReply.post_id == post_id)
        .order_by(ForumReply.created_at)
    )
    replies_result = await db.execute(replies_query)
    replies = replies_result.all()

    return {
        "id": post.id,
        "title": post.title,
        "body": post.body,
        "course_tag": post.course_tag,
        "author_id": post.author_id,
        "author_name": post.author_name,
        "is_pinned": post.is_pinned,
        "created_at": str(post.created_at) if post.created_at else None,
        "updated_at": str(post.updated_at) if post.updated_at else None,
        "replies": [
            {
                "id": reply.id,
                "post_id": reply.post_id,
                "parent_reply_id": reply.parent_reply_id,
                "body": reply.body,
                "author_id": reply.author_id,
                "author_name": reply.author_name,
                "created_at": str(reply.created_at) if reply.created_at else None,
                "updated_at": str(reply.updated_at) if reply.updated_at else None,
            }
            for reply in replies
        ],
    }


# ─── 4.6: PUT /forum/posts/{id} — Edit post ──────────────────────────────────


@router.put("/posts/{post_id}")
async def update_post(
    post_id: int,
    req: UpdatePostRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Edit a post (author only, or faculty/admin as moderator)."""
    result = await db.execute(select(ForumPost).where(ForumPost.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    if not _can_modify(current_user, post.author_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this post")

    if req.title is not None:
        post.title = req.title
    if req.body is not None:
        post.body = req.body
    if req.course_tag is not None:
        post.course_tag = req.course_tag

    await db.flush()
    await db.refresh(post)

    return {
        "id": post.id,
        "title": post.title,
        "body": post.body,
        "course_tag": post.course_tag,
        "author_id": post.author_id,
        "is_pinned": post.is_pinned,
        "created_at": str(post.created_at) if post.created_at else None,
        "updated_at": str(post.updated_at) if post.updated_at else None,
        "message": "Post updated successfully",
    }


# ─── DELETE /forum/posts/{id} — Delete post ──────────────────────────────────


@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a post (author only, or faculty/admin as moderator)."""
    result = await db.execute(select(ForumPost).where(ForumPost.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    if not _can_modify(current_user, post.author_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this post")

    # Delete associated replies first
    from sqlalchemy import delete as sql_delete
    await db.execute(sql_delete(ForumReply).where(ForumReply.post_id == post_id))

    await db.delete(post)
    await db.flush()

    return {"message": "Post deleted successfully"}


# ─── 4.7: POST /forum/posts/{id}/pin — Toggle pin status ─────────────────────


@router.post("/posts/{post_id}/pin")
async def toggle_pin(
    post_id: int,
    current_user: dict = Depends(require_role("faculty", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Toggle pin status (faculty/admin only)."""
    result = await db.execute(select(ForumPost).where(ForumPost.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    post.is_pinned = not post.is_pinned
    await db.flush()
    await db.refresh(post)

    return {
        "id": post.id,
        "is_pinned": post.is_pinned,
        "message": f"Post {'pinned' if post.is_pinned else 'unpinned'} successfully",
    }


# ─── 4.8: POST /forum/posts/{id}/replies — Add reply ─────────────────────────


@router.post("/posts/{post_id}/replies", status_code=status.HTTP_201_CREATED)
async def create_reply(
    post_id: int,
    req: CreateReplyRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a reply to a post."""
    # Verify post exists
    result = await db.execute(select(ForumPost).where(ForumPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # If parent_reply_id provided, verify parent exists and belongs to same post
    if req.parent_reply_id is not None:
        parent_result = await db.execute(
            select(ForumReply).where(
                ForumReply.id == req.parent_reply_id,
                ForumReply.post_id == post_id,
            )
        )
        if not parent_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent reply not found on this post",
            )

    reply_body = req.body or req.content or ""
    reply = ForumReply(
        post_id=post_id,
        author_id=current_user["id"],
        body=reply_body,
        parent_reply_id=req.parent_reply_id,
    )
    db.add(reply)
    await db.flush()
    await db.refresh(reply)

    # Update post's updated_at to reflect new activity
    from sqlalchemy import update
    await db.execute(
        update(ForumPost).where(ForumPost.id == post_id).values(updated_at=func.now())
    )

    return {
        "id": reply.id,
        "post_id": reply.post_id,
        "parent_reply_id": reply.parent_reply_id,
        "body": reply.body,
        "author_id": reply.author_id,
        "author_name": current_user["name"],
        "created_at": str(reply.created_at) if reply.created_at else None,
        "updated_at": str(reply.updated_at) if reply.updated_at else None,
        "message": "Reply created successfully",
    }


# ─── 4.9: PUT /forum/replies/{id} — Edit reply ───────────────────────────────


@router.put("/replies/{reply_id}")
async def update_reply(
    reply_id: int,
    req: UpdateReplyRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Edit a reply (author only, or faculty/admin as moderator)."""
    result = await db.execute(select(ForumReply).where(ForumReply.id == reply_id))
    reply = result.scalar_one_or_none()

    if not reply:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")

    if not _can_modify(current_user, reply.author_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this reply")

    reply.body = req.body
    await db.flush()
    await db.refresh(reply)

    return {
        "id": reply.id,
        "post_id": reply.post_id,
        "parent_reply_id": reply.parent_reply_id,
        "body": reply.body,
        "author_id": reply.author_id,
        "created_at": str(reply.created_at) if reply.created_at else None,
        "updated_at": str(reply.updated_at) if reply.updated_at else None,
        "message": "Reply updated successfully",
    }


# ─── 4.9: DELETE /forum/replies/{id} — Delete reply ──────────────────────────


@router.delete("/replies/{reply_id}")
async def delete_reply(
    reply_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a reply (author only, or faculty/admin as moderator)."""
    result = await db.execute(select(ForumReply).where(ForumReply.id == reply_id))
    reply = result.scalar_one_or_none()

    if not reply:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")

    if not _can_modify(current_user, reply.author_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this reply")

    await db.delete(reply)
    await db.flush()

    return {"message": "Reply deleted successfully"}


# ─── 4.10: GET /forum/search — Search posts and replies ───────────────────────


@router.get("/search")
async def search_forum(
    q: str = Query(..., min_length=1, max_length=200),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Search post titles, bodies, and reply bodies using LIKE."""
    search_term = f"%{q}%"

    # Search posts by title or body
    post_query = (
        select(
            ForumPost.id,
            ForumPost.title,
            ForumPost.body,
            ForumPost.course_tag,
            ForumPost.author_id,
            ForumPost.is_pinned,
            ForumPost.created_at,
            ForumPost.updated_at,
            User.name.label("author_name"),
        )
        .join(User, User.id == ForumPost.author_id)
        .where(
            or_(
                ForumPost.title.ilike(search_term),
                ForumPost.body.ilike(search_term),
            )
        )
    )

    # Also find posts that have matching replies
    posts_with_matching_replies = (
        select(ForumReply.post_id)
        .where(ForumReply.body.ilike(search_term))
        .distinct()
        .scalar_subquery()
    )

    combined_query = (
        select(
            ForumPost.id,
            ForumPost.title,
            ForumPost.body,
            ForumPost.course_tag,
            ForumPost.author_id,
            ForumPost.is_pinned,
            ForumPost.created_at,
            ForumPost.updated_at,
            User.name.label("author_name"),
        )
        .join(User, User.id == ForumPost.author_id)
        .where(
            or_(
                ForumPost.title.ilike(search_term),
                ForumPost.body.ilike(search_term),
                ForumPost.id.in_(posts_with_matching_replies),
            )
        )
        .order_by(desc(ForumPost.updated_at))
    )

    # Pagination
    offset = (page - 1) * page_size
    paginated_query = combined_query.offset(offset).limit(page_size)

    result = await db.execute(paginated_query)
    posts = result.all()

    # Total count
    count_query = (
        select(func.count(ForumPost.id))
        .where(
            or_(
                ForumPost.title.ilike(search_term),
                ForumPost.body.ilike(search_term),
                ForumPost.id.in_(posts_with_matching_replies),
            )
        )
    )
    total = (await db.execute(count_query)).scalar() or 0

    return {
        "posts": [
            {
                "id": post.id,
                "title": post.title,
                "body": post.body,
                "course_tag": post.course_tag,
                "author_id": post.author_id,
                "author_name": post.author_name,
                "is_pinned": post.is_pinned,
                "created_at": str(post.created_at) if post.created_at else None,
                "updated_at": str(post.updated_at) if post.updated_at else None,
            }
            for post in posts
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "query": q,
    }
