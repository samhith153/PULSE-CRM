import os
from uuid import UUID, uuid4

from fastapi import APIRouter, UploadFile, File, Form, status, HTTPException, Response, Query
from typing import Optional
from sqlalchemy import select
from supabase import create_client, Client

from app.api.deps import CurrentUser, DBSession, require_permission
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
BUCKET_NAME = "documents"


def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY."
        )
    return create_client(SUPABASE_URL, SUPABASE_KEY)


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("file:upload"))],
)
async def upload_document(
    current_user: CurrentUser,
    db: DBSession,
    file: UploadFile = File(...),
    contact_id: Optional[UUID] = Form(None),
    deal_id: Optional[UUID] = Form(None),
    company_id: Optional[UUID] = Form(None)
):
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "bin"
    # Group files by organization ID in the cloud bucket for better security and organization
    safe_filename = f"{current_user.organization_id}/{uuid4()}.{file_extension}"
    
    file_bytes = await file.read()
    
    try:
        # Stream directly into Supabase Storage
        get_supabase().storage.from_(BUCKET_NAME).upload(
            path=safe_filename,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloud storage upload failed: {str(e)}")
        
    new_doc = Document(
        organization_id=current_user.organization_id,
        uploaded_by=current_user.id,
        contact_id=contact_id,
        deal_id=deal_id,
        company_id=company_id,
        file_name=file.filename,
        file_path=safe_filename,
        file_type=file.content_type or "application/octet-stream",
        file_size_bytes=len(file_bytes)
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    return new_doc


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    current_user: CurrentUser,
    db: DBSession,
    contact_id: Optional[UUID] = Query(None),
    deal_id: Optional[UUID] = Query(None),
    company_id: Optional[UUID] = Query(None)
):
    query = select(Document).where(
        Document.organization_id == current_user.organization_id
    )
    if contact_id:
        query = query.where(Document.contact_id == contact_id)
    if deal_id:
        query = query.where(Document.deal_id == deal_id)
    if company_id:
        query = query.where(Document.company_id == company_id)
        
    query = query.order_by(Document.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get(
    "/{doc_id}/download",
    dependencies=[Depends(require_permission("document:read"))],
)
async def download_document(doc_id: UUID, current_user: CurrentUser, db: DBSession):
    query = select(Document).where(
        Document.id == doc_id, 
        Document.organization_id == current_user.organization_id
    )
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found in database")
        
    try:
        # Fetch file bytes from cloud storage securely
        file_bytes = get_supabase().storage.from_(BUCKET_NAME).download(doc.file_path)
        return Response(content=file_bytes, media_type=doc.file_type)
    except Exception:
        raise HTTPException(status_code=404, detail="File missing from cloud storage")


@router.delete(
    "/{doc_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("document:delete"))],
)
async def delete_document(doc_id: UUID, current_user: CurrentUser, db: DBSession):
    query = select(Document).where(
        Document.id == doc_id, 
        Document.organization_id == current_user.organization_id
    )
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        # Delete from cloud storage bucket
        get_supabase().storage.from_(BUCKET_NAME).remove([doc.file_path])
    except Exception as e:
        logger.warning("Failed to delete cloud file: %s", e)
        
    await db.delete(doc)
    await db.commit()