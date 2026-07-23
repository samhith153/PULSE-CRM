from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class EventType(str, Enum):
    EMAIL_RECEIVED = "EMAIL_RECEIVED"
    EMAIL_SENT = "EMAIL_SENT"
    EMAIL_READ = "EMAIL_READ"
    LEAD_CREATED = "LEAD_CREATED"
    LEAD_CONVERTED = "LEAD_CONVERTED"
    DEAL_CREATED = "DEAL_CREATED"
    DEAL_UPDATED = "DEAL_UPDATED"
    DEAL_WON = "DEAL_WON"
    DEAL_LOST = "DEAL_LOST"
    COMPANY_CREATED = "COMPANY_CREATED"
    CONTACT_CREATED = "CONTACT_CREATED"
    ACTIVITY_CREATED = "ACTIVITY_CREATED"


EVENT_TYPE_NAMES: dict[str, str] = {
    EventType.EMAIL_RECEIVED.value: "Email Received",
    EventType.EMAIL_SENT.value: "Email Sent",
    EventType.EMAIL_READ.value: "Email Read",
    EventType.LEAD_CREATED.value: "Lead Created",
    EventType.LEAD_CONVERTED.value: "Lead Converted",
    EventType.DEAL_CREATED.value: "Deal Created",
    EventType.DEAL_UPDATED.value: "Deal Updated",
    EventType.DEAL_WON.value: "Deal Won",
    EventType.DEAL_LOST.value: "Deal Lost",
    EventType.COMPANY_CREATED.value: "Company Created",
    EventType.CONTACT_CREATED.value: "Contact Created",
    EventType.ACTIVITY_CREATED.value: "Activity Created",
}


class EventBase(BaseModel):
    event_type: str = Field(..., max_length=100)
    aggregate_type: str | None = Field(default=None, max_length=100)
    aggregate_id: str | None = Field(default=None, max_length=64)
    organization_id: UUID | None = None
    actor_id: UUID | None = None
    source: str | None = Field(default=None, max_length=120)
    correlation_id: str | None = Field(default=None, max_length=120)
    payload: dict[str, Any] = Field(default_factory=dict)

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("event_type is required")
        return normalized

    @field_validator("payload")
    @classmethod
    def validate_payload(cls, value: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(value, dict):
            raise ValueError("payload must be a JSON object")
        return value


class EventCreate(EventBase):
    pass


class EventRead(EventBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    event_name: str
    occurred_at: datetime
    created_at: datetime


class EventListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[EventRead]
    total: int
    limit: int
    offset: int
