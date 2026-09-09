import os
import uuid
from fastapi import UploadFile

# Resolve uploads directory relative to the backend root
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOADS_DIR = os.path.join(BACKEND_DIR, "uploads")


async def save_upload_file(file: UploadFile, folder: str) -> str:
    """Save an uploaded file to backend/uploads/{folder}/ with a unique filename.

    Args:
        file: The FastAPI UploadFile object.
        folder: Subfolder under uploads/ (e.g. 'resumes', 'materials').

    Returns:
        The relative path from the backend root, e.g. 'uploads/resumes/abc123.pdf'.
    """
    target_dir = os.path.join(UPLOADS_DIR, folder)
    os.makedirs(target_dir, exist_ok=True)

    # Generate unique filename preserving original extension
    ext = ""
    if file.filename:
        _, ext = os.path.splitext(file.filename)
    unique_name = f"{uuid.uuid4().hex}{ext}"

    file_path = os.path.join(target_dir, unique_name)
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    # Return relative path from backend root
    relative_path = f"uploads/{folder}/{unique_name}"
    return relative_path
