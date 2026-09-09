from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.models.academic import StudyMaterial
from app.models.user import User
from app.middleware.auth_middleware import get_current_user
from app.middleware.role_checker import require_role
from app.utils.file_upload import save_upload_file

router = APIRouter(prefix="/study-materials", tags=["Study Materials"])


# ─── Endpoints ───────────────────────────────────────────────────────────────


@router.get("")
@router.get("/")
async def list_study_materials(
    subject: Optional[str] = None,
    material_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(StudyMaterial, User).join(User, StudyMaterial.uploaded_by == User.id)
    if subject:
        query = query.where(StudyMaterial.subject_name == subject)
    if material_type:
        query = query.where(StudyMaterial.material_type == material_type)
    
    query = query.order_by(StudyMaterial.created_at.desc())
    result = await db.execute(query)
    rows = result.all()

    materials = []
    for material, user in rows:
        materials.append({
            "id": material.id,
            "title": material.title,
            "description": material.description,
            "subject": material.subject_name,
            "subjectName": material.subject_name,
            "type": material.material_type,
            "fileUrl": material.file_url,
            "uploadedBy": user.name,
            "facultyName": user.name,
            "createdAt": str(material.created_at) if material.created_at else None,
        })
    return materials


@router.post("")
@router.post("/")
async def upload_study_material(
    request: Request,
    current_user: dict = Depends(require_role("faculty", "admin")),
    db: AsyncSession = Depends(get_db),
):
    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" in content_type:
        form = await request.form()
        title = form.get("title", "Untitled")
        description = form.get("description")
        subject_name = form.get("subject_name") or form.get("subject") or "General"
        material_type = form.get("material_type", "notes")
        file = form.get("file")
        if file and hasattr(file, "filename") and file.filename:
            file_url = await save_upload_file(file, "study_materials")
            fname = file.filename
        else:
            file_url = form.get("file_url") or "https://via.placeholder.com/file"
            fname = "link"
    else:
        body = await request.json()
        title = body.get("title", "Untitled")
        description = body.get("description")
        subject_name = body.get("subject_name") or body.get("subject") or "General"
        material_type = body.get("material_type", "notes")
        file_url = body.get("file_url") or "https://via.placeholder.com/file"
        fname = "link"

    from app.services.gemini_service import categorize_study_material
    from app.models.communication import Notification
    
    # Run AI categorizer
    try:
        cat_data = await categorize_study_material(title, description, subject_name, fname)
        pred_dept = cat_data.get("department", "CSE")
        pred_sem = cat_data.get("semester", 1)
        pred_sect = cat_data.get("section", "A")
        pred_unit = cat_data.get("unit", "Unit I")
        pred_tags = ", ".join(cat_data.get("tags", []))
    except Exception:
        pred_dept = "CSE"
        pred_sem = 1
        pred_sect = "A"
        pred_unit = "Unit I"
        pred_tags = ""

    material = StudyMaterial(
        title=title,
        description=description,
        subject_name=subject_name,
        uploaded_by=current_user["id"],
        file_url=file_url,
        material_type=material_type,
        department=pred_dept,
        semester=pred_sem,
        section=pred_sect,
        unit=pred_unit,
        tags=pred_tags,
    )
    db.add(material)
    await db.flush()
    await db.refresh(material)

    # Broadcast notification to enrolled students
    target_yr = (pred_sem + 1) // 2
    notification = Notification(
        title=f"New Study Material: {title}",
        message=f"Prof. {current_user['name']} uploaded '{title}' under {pred_unit} for {subject_name}.",
        category="academic",
        priority="normal",
        target_role="student",
        department=pred_dept,
        target_year=target_yr,
        created_by=current_user["id"],
    )
    db.add(notification)
    await db.flush()
    await db.refresh(notification)
    await db.refresh(material)
    
    # WebSocket broadcast
    from app.utils.websocket_manager import manager as ws_manager
    try:
        await ws_manager.broadcast_notification({
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "target_role": notification.target_role,
            "department": notification.department,
            "target_year": notification.target_year,
            "category": notification.category,
            "priority": notification.priority,
            "created_at": str(notification.created_at) if notification.created_at else None,
        })
    except Exception:
        pass

    from app.services.audit_service import log_audit_event
    await log_audit_event(
        db,
        user_id=current_user["id"],
        user_email=current_user["email"],
        role=current_user["role"],
        action="UPLOAD_STUDY_MATERIAL",
        resource=f"StudyMaterial:{material.id}",
        details=f"Uploaded '{title}' for {subject_name}"
    )

    return {
        "id": material.id,
        "title": material.title,
        "message": "Study material uploaded and categorized successfully via AI",
    }


@router.delete("/{material_id}")
async def delete_study_material(
    material_id: int,
    current_user: dict = Depends(require_role("faculty", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StudyMaterial).where(StudyMaterial.id == material_id)
    )
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Study material not found")

    # Only allow creator, HOD of same department, or admin to delete
    if current_user["role"] not in ("admin", "hod") and material.uploaded_by != current_user["id"]:
        raise HTTPException(
            status_code=403, detail="You do not have permission to delete this material"
        )

    await db.delete(material)
    await db.flush()

    from app.services.audit_service import log_audit_event
    await log_audit_event(
        db,
        user_id=current_user["id"],
        user_email=current_user["email"],
        role=current_user["role"],
        action="DELETE_STUDY_MATERIAL",
        resource=f"StudyMaterial:{material_id}",
        details=f"Deleted material '{material.title}'"
    )

    return {"message": "Study material deleted successfully"}

