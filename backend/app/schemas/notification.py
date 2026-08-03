"""
Notification Schemas (Pydantic V2)
"""
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: UUID
    type: str
    title: str
    message: Optional[str]
    entity_type: Optional[str]
    entity_id: Optional[UUID]
    payload: Optional[dict[str, Any]]
    is_read: bool
    read_at: Optional[datetime]
    is_dismissed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    unread_count: int


class UnreadCountResponse(BaseModel):
    unread_count: int
