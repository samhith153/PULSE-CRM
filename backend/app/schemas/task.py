"""Task schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

TASK_STATUSES = {"open", "in_progress", "completed", "cancelled"}
TASK_PRIORITIES = {"low", "medium", "high", "critical"}


class TaskCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    status: str = "open"
    priority: str = "medium"
    due_date: Optional[datetime] = None
    owner_id: Optional[UUID] = None
    related_lead_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None
    related_company_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None

    @model_validator(mode="after")
    def validate_payload(self) -> "TaskCreateRequest":
        if self.status not in TASK_STATUSES:
            raise ValueError("invalid task status")
        if self.priority not in TASK_PRIORITIES:
            raise ValueError("invalid task priority")
        return self


class TaskUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    owner_id: Optional[UUID] = None
    related_lead_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None
    related_company_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None

    @model_validator(mode="after")
    def validate_payload(self) -> "TaskUpdateRequest":
        if self.status is not None and self.status not in TASK_STATUSES:
            raise ValueError("invalid task status")
        if self.priority is not None and self.priority not in TASK_PRIORITIES:
            raise ValueError("invalid task priority")
        return self


class TaskResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    status: str
    priority: str
    due_date: Optional[datetime]
    completed_at: Optional[datetime]
    owner_id: Optional[UUID]
    related_lead_id: Optional[UUID]
    related_deal_id: Optional[UUID]
    related_company_id: Optional[UUID]
    related_contact_id: Optional[UUID]
    organization_id: UUID
    created_by: Optional[UUID]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
