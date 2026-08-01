"""
Activity Timeline Schemas (Pydantic V2)
"""
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ActivityTimelineCreateRequest(BaseModel):
    entity_type: str = Field(min_length=1, max_length=50)
    entity_id: UUID
    action: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    payload: dict[str, Any] = Field(default_factory=dict)


class ActivityTimelineResponse(BaseModel):
    id: UUID
    entity_type: str
    entity_id: UUID
    action: str
    title: str
    description: Optional[str]
    payload: Optional[dict]
    organization_id: UUID
    created_by: Optional[UUID]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
