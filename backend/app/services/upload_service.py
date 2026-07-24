from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ValidationException
from app.models.user import User
from app.schemas.upload import FileUploadResponse


class UploadService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.root = Path(settings.LOCAL_STORAGE_PATH)

    async def store(self, organization_id: UUID, user: User, file: UploadFile, category: str) -> FileUploadResponse:
        content_type = file.content_type or "application/octet-stream"
        allowed = settings.allowed_upload_content_types_list
        if content_type not in allowed:
            raise ValidationException("Unsupported file content type.", {"content_type": content_type})
        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise ValidationException("File exceeds maximum allowed size.", {"max_size_bytes": settings.MAX_UPLOAD_SIZE_BYTES})
        safe_name = self._safe_filename(file.filename or "upload")
        storage_key = f"{organization_id}/{category}/{uuid4()}-{safe_name}"
        target = self.root / storage_key
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        url = f"/{settings.LOCAL_STORAGE_PATH.strip('/').replace('\\', '/')}/{storage_key.replace('\\', '/')}"
        if category == "avatars":
            user.avatar_url = url
            await self.db.flush()
        return FileUploadResponse(
            filename=safe_name,
            content_type=content_type,
            size_bytes=len(content),
            storage_provider=settings.STORAGE_PROVIDER,
            storage_key=storage_key.replace("\\", "/"),
            url=url,
            uploaded_by=user.id,
            organization_id=organization_id,
            uploaded_at=datetime.now(timezone.utc),
        )

    def _safe_filename(self, filename: str) -> str:
        return re.sub(r"[^A-Za-z0-9._-]", "_", Path(filename).name)[:160]
