from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FileUploadResponse(BaseModel):
    filename: str
    content_type: str
    size_bytes: int
    storage_provider: str
    storage_key: str
    url: str
    uploaded_by: UUID
    organization_id: UUID
    uploaded_at: datetime
