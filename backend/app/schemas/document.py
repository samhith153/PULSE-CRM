from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class DocumentResponse(BaseModel):
    id: UUID
    organization_id: UUID
    uploaded_by: Optional[UUID]
    contact_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None
    company_id: Optional[UUID] = None
    file_name: str
    file_path: str
    file_type: str
    file_size_bytes: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)