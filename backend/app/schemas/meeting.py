"""
Meeting schemas.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


MEETING_STATUSES = {"scheduled", "completed", "cancelled", "rescheduled", "missed", "in_progress"}


class MeetingCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    start_datetime: datetime
    end_datetime: datetime
    status: str = "scheduled"
    owner_id: Optional[UUID] = None
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    reminder_minutes: Optional[int] = Field(default=15, ge=0)
    related_lead_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None
    related_company_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None

    @model_validator(mode="after")
    def validate_payload(self) -> "MeetingCreateRequest":
        if self.end_datetime <= self.start_datetime:
            raise ValueError("end_datetime must be after start_datetime")
        if self.status not in MEETING_STATUSES:
            raise ValueError("invalid meeting status")
        return self


class MeetingUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    status: Optional[str] = None
    owner_id: Optional[UUID] = None
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    reminder_minutes: Optional[int] = Field(default=None, ge=0)
    related_lead_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None
    related_company_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None

    @model_validator(mode="after")
    def validate_payload(self) -> "MeetingUpdateRequest":
        if self.start_datetime and self.end_datetime and self.end_datetime <= self.start_datetime:
            raise ValueError("end_datetime must be after start_datetime")
        if self.status is not None and self.status not in MEETING_STATUSES:
            raise ValueError("invalid meeting status")
        return self


class MeetingResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    status: str
    start_datetime: datetime
    end_datetime: datetime
    owner_id: Optional[UUID]
    owner_name: Optional[str] = None
    meeting_link: Optional[str]
    location: Optional[str]
    reminder_minutes: Optional[int]
    related_lead_id: Optional[UUID]
    related_contact_id: Optional[UUID]
    related_company_id: Optional[UUID]
    related_deal_id: Optional[UUID]
    lead_name: Optional[str] = None
    contact_name: Optional[str] = None
    company_name: Optional[str] = None
    deal_name: Optional[str] = None
    organization_id: UUID
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MeetingListResponse(BaseModel):
    meetings: list[MeetingResponse] = Field(default_factory=list)
    total: int
