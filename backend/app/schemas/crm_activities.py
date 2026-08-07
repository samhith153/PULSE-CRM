"""
CRM Activities Schemas (Pydantic V2)
Covers: Task, Call, Meeting (extended), Email (activity view), Note, plus
unified list / bulk / export schemas used by the Activities module.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, List, Literal, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


# ─────────────────────────────────────────────────────────────────────────────
# Shared enums (as validated string literals)
# ─────────────────────────────────────────────────────────────────────────────

ACTIVITY_TYPES   = {"task", "call", "meeting", "email", "note"}
TASK_STATUSES    = {"pending", "in_progress", "completed", "overdue"}
MEETING_STATUSES = {"scheduled", "completed", "cancelled", "rescheduled", "missed", "in_progress"}
CALL_STATUSES    = {"pending", "completed", "missed", "in_progress"}
NOTE_STATUSES    = {"completed"}
EMAIL_STATUSES   = {"pending", "completed", "in_progress"}
PRIORITIES       = {"urgent", "high", "medium", "low"}
ENTITY_TYPES     = {"lead", "contact", "company", "deal"}
CALL_TYPES       = {"inbound", "outbound"}


# ─────────────────────────────────────────────────────────────────────────────
# Shared related-entity sub-object
# ─────────────────────────────────────────────────────────────────────────────

class RelatedEntityInfo(BaseModel):
    id: UUID
    name: str
    entity_type: str  # lead | contact | company | deal

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────────────────────────
# TASK schemas
# ─────────────────────────────────────────────────────────────────────────────

class TaskCreateRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: str = Field(default="medium")
    status: str = Field(default="pending")
    owner_id: Optional[UUID] = None
    reminder_minutes: Optional[int] = Field(default=15, ge=0)
    related_entity_type: Optional[str] = None
    related_lead_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None
    related_company_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None

    @field_validator("priority")
    @classmethod
    def _validate_priority(cls, v: str) -> str:
        v = v.lower()
        if v not in PRIORITIES:
            raise ValueError(f"priority must be one of {PRIORITIES}")
        return v

    @field_validator("status")
    @classmethod
    def _validate_status(cls, v: str) -> str:
        v = v.lower()
        if v not in TASK_STATUSES:
            raise ValueError(f"status must be one of {TASK_STATUSES}")
        return v

    @field_validator("related_entity_type")
    @classmethod
    def _validate_entity_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.lower() not in ENTITY_TYPES:
            raise ValueError(f"related_entity_type must be one of {ENTITY_TYPES}")
        return v.lower() if v else v


class TaskUpdateRequest(BaseModel):
    subject: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[UUID] = None
    reminder_minutes: Optional[int] = Field(default=None, ge=0)
    related_entity_type: Optional[str] = None
    related_lead_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None
    related_company_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None

    @field_validator("priority")
    @classmethod
    def _validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.lower() not in PRIORITIES:
            raise ValueError(f"priority must be one of {PRIORITIES}")
        return v.lower() if v else v

    @field_validator("status")
    @classmethod
    def _validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.lower() not in TASK_STATUSES:
            raise ValueError(f"status must be one of {TASK_STATUSES}")
        return v.lower() if v else v


class TaskResponse(BaseModel):
    id: UUID
    activity_type: str = "task"
    subject: str
    description: Optional[str]
    status: str
    priority: str
    due_date: Optional[datetime]
    completed_at: Optional[datetime]
    reminder_minutes: Optional[int]
    owner_id: Optional[UUID]
    owner_name: Optional[str] = None
    related_entity_type: Optional[str]
    related_lead_id: Optional[UUID]
    related_contact_id: Optional[UUID]
    related_company_id: Optional[UUID]
    related_deal_id: Optional[UUID]
    related_record_name: Optional[str] = None
    organization_id: UUID
    created_by: Optional[UUID]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────────────────────────
# CALL schemas
# ─────────────────────────────────────────────────────────────────────────────

class CallCreateRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=255)
    contact_name: Optional[str] = None
    phone_number: Optional[str] = None
    call_type: str = Field(default="outbound")
    duration_minutes: Optional[int] = Field(default=None, ge=0)
    outcome: Optional[str] = None
    notes: Optional[str] = None
    priority: str = Field(default="medium")
    status: str = Field(default="completed")
    called_at: Optional[datetime] = None
    owner_id: Optional[UUID] = None
    related_entity_type: Optional[str] = None
    related_lead_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None
    related_company_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None

    @field_validator("call_type")
    @classmethod
    def _validate_call_type(cls, v: str) -> str:
        v = v.lower()
        if v not in CALL_TYPES:
            raise ValueError(f"call_type must be one of {CALL_TYPES}")
        return v

    @field_validator("priority")
    @classmethod
    def _validate_priority(cls, v: str) -> str:
        v = v.lower()
        if v not in PRIORITIES:
            raise ValueError(f"priority must be one of {PRIORITIES}")
        return v

    @field_validator("status")
    @classmethod
    def _validate_status(cls, v: str) -> str:
        v = v.lower()
        if v not in CALL_STATUSES:
            raise ValueError(f"status must be one of {CALL_STATUSES}")
        return v


class CallUpdateRequest(BaseModel):
    subject: Optional[str] = Field(default=None, min_length=1, max_length=255)
    contact_name: Optional[str] = None
    phone_number: Optional[str] = None
    call_type: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, ge=0)
    outcome: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    called_at: Optional[datetime] = None
    owner_id: Optional[UUID] = None
    related_entity_type: Optional[str] = None
    related_lead_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None
    related_company_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None

    @field_validator("priority")
    @classmethod
    def _validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.lower() not in PRIORITIES:
            raise ValueError(f"priority must be one of {PRIORITIES}")
        return v.lower() if v else v

    @field_validator("status")
    @classmethod
    def _validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.lower() not in CALL_STATUSES:
            raise ValueError(f"status must be one of {CALL_STATUSES}")
        return v.lower() if v else v


class CallResponse(BaseModel):
    id: UUID
    activity_type: str = "call"
    subject: str
    contact_name: Optional[str]
    phone_number: Optional[str]
    call_type: str
    duration_minutes: Optional[int]
    outcome: Optional[str]
    notes: Optional[str]
    status: str
    priority: str
    called_at: Optional[datetime]
    owner_id: Optional[UUID]
    owner_name: Optional[str] = None
    related_entity_type: Optional[str]
    related_lead_id: Optional[UUID]
    related_contact_id: Optional[UUID]
    related_company_id: Optional[UUID]
    related_deal_id: Optional[UUID]
    related_record_name: Optional[str] = None
    organization_id: UUID
    created_by: Optional[UUID]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────────────────────────
# NOTE schemas
# ─────────────────────────────────────────────────────────────────────────────

class NoteCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    body: Optional[str] = None
    owner_id: Optional[UUID] = None
    related_entity_type: Optional[str] = None
    related_lead_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None
    related_company_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None

    @field_validator("related_entity_type")
    @classmethod
    def _validate_entity_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.lower() not in ENTITY_TYPES:
            raise ValueError(f"related_entity_type must be one of {ENTITY_TYPES}")
        return v.lower() if v else v


class NoteUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    body: Optional[str] = None
    owner_id: Optional[UUID] = None
    related_entity_type: Optional[str] = None
    related_lead_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None
    related_company_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None


class NoteResponse(BaseModel):
    id: UUID
    activity_type: str = "note"
    title: str
    body: Optional[str]
    owner_id: Optional[UUID]
    owner_name: Optional[str] = None
    related_entity_type: Optional[str]
    related_lead_id: Optional[UUID]
    related_contact_id: Optional[UUID]
    related_company_id: Optional[UUID]
    related_deal_id: Optional[UUID]
    related_record_name: Optional[str] = None
    organization_id: UUID
    created_by: Optional[UUID]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────────────────────────
# EMAIL schemas (CRM email activity — user-created, not Gmail sync)
# ─────────────────────────────────────────────────────────────────────────────

EMAIL_DIRECTIONS = {"inbound", "outbound"}


class EmailCreateRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=255)
    body: Optional[str] = None
    direction: str = Field(default="outbound")
    recipient_email: Optional[str] = None
    recipient_name: Optional[str] = None
    status: str = Field(default="completed")
    priority: str = Field(default="medium")
    sent_at: Optional[datetime] = None
    owner_id: Optional[UUID] = None
    related_entity_type: Optional[str] = None
    related_lead_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None
    related_company_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None

    @field_validator("related_entity_type")
    @classmethod
    def _validate_entity_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.lower() not in ENTITY_TYPES:
            raise ValueError(f"related_entity_type must be one of {ENTITY_TYPES}")
        return v.lower() if v else v

    @field_validator("direction")
    @classmethod
    def _validate_direction(cls, v: str) -> str:
        if v.lower() not in EMAIL_DIRECTIONS:
            raise ValueError(f"direction must be one of {EMAIL_DIRECTIONS}")
        return v.lower()


class EmailUpdateRequest(BaseModel):
    subject: Optional[str] = Field(default=None, min_length=1, max_length=255)
    body: Optional[str] = None
    direction: Optional[str] = None
    recipient_email: Optional[str] = None
    recipient_name: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    sent_at: Optional[datetime] = None
    owner_id: Optional[UUID] = None
    related_entity_type: Optional[str] = None
    related_lead_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None
    related_company_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None


class EmailResponse(BaseModel):
    id: UUID
    activity_type: str = "email"
    subject: str
    body: Optional[str]
    direction: str
    recipient_email: Optional[str]
    recipient_name: Optional[str]
    status: str
    priority: str
    sent_at: Optional[datetime]
    owner_id: Optional[UUID]
    owner_name: Optional[str] = None
    related_entity_type: Optional[str]
    related_lead_id: Optional[UUID]
    related_contact_id: Optional[UUID]
    related_company_id: Optional[UUID]
    related_deal_id: Optional[UUID]
    related_record_name: Optional[str] = None
    organization_id: UUID
    created_by: Optional[UUID]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────────────────────────
# UNIFIED activity item — one shape for the Activities table / timeline
# ─────────────────────────────────────────────────────────────────────────────

class UnifiedActivityItem(BaseModel):
    """
    Normalised view of any activity type, suitable for the activities table
    and timeline feed in the frontend.
    """
    id: UUID
    activity_type: str          # task | call | meeting | email | note
    subject: str                # display title / subject
    status: str                 # pending | completed | overdue | scheduled …
    priority: str               # urgent | high | medium | low
    due_date: Optional[datetime]   # task due / meeting start / call time / email sent
    owner_id: Optional[UUID]
    owner_name: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_record_id: Optional[UUID] = None
    related_record_name: Optional[str] = None
    organization_id: UUID
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    # extra details stored as a generic dict (type-specific fields)
    details: dict[str, Any] = Field(default_factory=dict)

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────────────────────────
# Unified list / filter query params
# ─────────────────────────────────────────────────────────────────────────────

class ActivityListParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    view: Optional[str] = None          # timeline | task | call | meeting | email | note
    search: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    owner_id: Optional[UUID] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    quick_tab: Optional[str] = None     # all | today | upcoming | overdue
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")


# ─────────────────────────────────────────────────────────────────────────────
# Bulk operation schemas
# ─────────────────────────────────────────────────────────────────────────────

class BulkDeleteRequest(BaseModel):
    ids: List[UUID] = Field(min_length=1)
    activity_types: Optional[List[str]] = None
    # If omitted, the service infers type from DB. For safety, caller can supply.


class BulkStatusUpdateRequest(BaseModel):
    ids: List[UUID] = Field(min_length=1)
    status: str

    @field_validator("status")
    @classmethod
    def _validate_status(cls, v: str) -> str:
        allowed = TASK_STATUSES | CALL_STATUSES | MEETING_STATUSES | NOTE_STATUSES | EMAIL_STATUSES
        if v.lower() not in allowed:
            raise ValueError(f"status not recognised: {v}")
        return v.lower()


class BulkOwnerUpdateRequest(BaseModel):
    ids: List[UUID] = Field(min_length=1)
    owner_id: UUID


class BulkUpdateRequest(BaseModel):
    """Generic bulk update — supports status, owner, or archive in one call."""
    ids: List[UUID] = Field(min_length=1)
    status: Optional[str] = None
    owner_id: Optional[UUID] = None
    archive: Optional[bool] = None      # sets is_active=False


class BulkOperationResponse(BaseModel):
    affected: int
    message: str


# ─────────────────────────────────────────────────────────────────────────────
# Export query params
# ─────────────────────────────────────────────────────────────────────────────

class ExportFormat(str):
    CSV   = "csv"
    EXCEL = "xlsx"


class ActivityExportParams(BaseModel):
    format: str = Field(default="csv", pattern="^(csv|xlsx)$")
    view: Optional[str] = None
    search: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    owner_id: Optional[UUID] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    quick_tab: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# Owner list (for the Owner filter dropdown)
# ─────────────────────────────────────────────────────────────────────────────

class OwnerItem(BaseModel):
    id: UUID
    full_name: str
    email: str
    avatar_url: Optional[str] = None
