import os
import shutil
from uuid import UUID, uuid4
from fastapi import APIRouter, UploadFile, File, status, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from app.api.deps import CurrentUser, DBSession
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.core.config import settings

router = APIRouter()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    current_user: CurrentUser,
    db: DBSession,
    file: UploadFile = File(...)
):  # <--- The syntax fix is right here!
    os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "bin"
    safe_filename = f"{uuid4()}.{file_extension}"
    file_location = os.path.join(settings.LOCAL_STORAGE_PATH, safe_filename)
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    file_size = os.path.getsize(file_location)
    new_doc = Document(
        organization_id=current_user.organization_id,
        uploaded_by=current_user.id,
        file_name=file.filename,
        file_path=f"/uploads/{safe_filename}",
        file_type=file.content_type or "application/octet-stream",
        file_size_bytes=file_size
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    return new_doc

@router.get("", response_model=list[DocumentResponse])
async def list_documents(current_user: CurrentUser, db: DBSession):
    """Fetch all documents for the current user's organization."""
    query = select(Document).where(
        Document.organization_id == current_user.organization_id
    ).order_by(Document.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{doc_id}/download")
async def download_document(doc_id: UUID, current_user: CurrentUser, db: DBSession):
    """Download a specific document."""
    query = select(Document).where(
        Document.id == doc_id, 
        Document.organization_id == current_user.organization_id
    )
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found in database")
        
    # Extract just the filename from the stored path
    filename = doc.file_path.split("/")[-1]
    file_location = os.path.join(settings.LOCAL_STORAGE_PATH, filename)
    
    if not os.path.exists(file_location):
        raise HTTPException(status_code=404, detail="Physical file missing from server")
        
    return FileResponse(
        path=file_location, 
        filename=doc.file_name,
        media_type=doc.file_type
    )