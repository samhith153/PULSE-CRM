"""
Domain Event Schemas
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class DomainEventResponse(BaseModel):
    id: UUID
    aggregate_type: str
    aggregate_id: Optional[UUID]
    event_type: str
    topic: str
    title: str
    description: Optional[str]
    payload: Optional[dict]
    source: Optional[str]
    status: str
    organization_id: UUID
    created_by: Optional[UUID]
    processed_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
