import os
from datetime import datetime, timezone, timedelta
from uuid import UUID, uuid4

from fastapi import APIRouter, UploadFile, File, Form, status, HTTPException, Response, Query, Depends
from typing import Optional
from pydantic import BaseModel
from sqlalchemy import select
from supabase import create_client, Client

from app.api.deps import CurrentUser, DBSession, require_permission
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()

BUCKET_NAME = "documents"

SIGNED_URL_EXPIRY_SECONDS = 3600


def get_supabase() -> Client:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY."
        )
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


class SignedUrlResponse(BaseModel):
    url: str
    expires_at: str


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
    safe_filename = f"{current_user.organization_id}/{uuid4()}.{file_extension}"

    file_bytes = await file.read()

    try:
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
    "/{doc_id}/url",
    response_model=SignedUrlResponse,
    dependencies=[Depends(require_permission("document:read"))],
)
async def get_signed_url(doc_id: UUID, current_user: CurrentUser, db: DBSession):
    query = select(Document).where(
        Document.id == doc_id,
        Document.organization_id == current_user.organization_id
    )
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=SIGNED_URL_EXPIRY_SECONDS)
        signed = get_supabase().storage.from_(BUCKET_NAME).create_signed_url(
            path=doc.file_path,
            expires_in=SIGNED_URL_EXPIRY_SECONDS,
        )
        signed_url = signed.get("signedURL") or signed.get("signed_url") or signed.get("url", "")
        if not signed_url:
            raise HTTPException(status_code=500, detail="Failed to generate signed URL")
        return SignedUrlResponse(url=signed_url, expires_at=expires_at.isoformat())
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to create signed URL for document %s", doc_id)
        raise HTTPException(status_code=500, detail=f"Signed URL generation failed: {str(e)}")


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
        file_bytes = get_supabase().storage.from_(BUCKET_NAME).download(doc.file_path)
        return Response(
            content=file_bytes,
            media_type=doc.file_type,
            headers={
                "Content-Disposition": f'attachment; filename="{doc.file_name}"',
                "Content-Length": str(len(file_bytes)),
            },
        )
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
        get_supabase().storage.from_(BUCKET_NAME).remove([doc.file_path])
    except Exception as e:
        logger.warning("Failed to delete cloud file: %s", e)

    await db.delete(doc)
    await db.commit()
