from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.upload import FileUploadResponse
from app.services.upload_service import UploadService

router = APIRouter(dependencies=[Depends(require_permission("file:upload"))])


@router.post("/avatars", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_avatar(current_user: CurrentUser, db: DBSession, file: UploadFile = File(...)) -> FileUploadResponse:
    return await UploadService(db).store(current_user.organization_id, current_user, file, "avatars")


@router.post("/attachments", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(current_user: CurrentUser, db: DBSession, file: UploadFile = File(...)) -> FileUploadResponse:
    return await UploadService(db).store(current_user.organization_id, current_user, file, "attachments")
