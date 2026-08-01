from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl


class WebhookEndpointCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    target_url: HttpUrl
    event_types: list[str] = Field(default_factory=list)
    secret: str | None = Field(default=None, min_length=16)


class WebhookEndpointResponse(BaseModel):
    id: UUID
    name: str
    target_url: str
    event_types: list[str]
    max_attempts: int
    organization_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WebhookDeliveryResponse(BaseModel):
    id: UUID
    endpoint_id: UUID
    event_type: str
    payload: dict[str, Any]
    status: str
    attempts: int
    next_attempt_at: datetime | None
    last_status_code: int | None
    last_error: str | None
    delivered_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class WebhookDeliverRequest(BaseModel):
    event_type: str = Field(min_length=1, max_length=120)
    payload: dict[str, Any] = Field(default_factory=dict)
