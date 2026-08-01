"""
Calendar Schemas — request / response models for the Calendar module.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


# ── Enums (as literals for validation) ───────────────────────────────────────

EVENT_TYPES = {
    "meeting", "call", "follow_up", "task", "demo",
    "reminder", "personal", "internal", "deadline",
}
EVENT_STATUSES = {
    "scheduled", "completed", "cancelled",
    "rescheduled", "missed", "in_progress",
}
EVENT_PRIORITIES = {"low", "medium", "high", "critical"}
CALENDAR_VIEWS = {"day", "week", "month"}


# ── Request models ────────────────────────────────────────────────────────────

class CalendarEventCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    event_type: str = Field(default="meeting")
    priority: str = Field(default="medium")
    start_datetime: datetime
    end_datetime: datetime
    is_all_day: bool = False
    location: Optional[str] = None
    meeting_url: Optional[str] = None
    owner_id: Optional[UUID] = None
    related_lead_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None
    related_company_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None
    reminder_minutes: Optional[int] = Field(default=15, ge=0)

    @model_validator(mode="after")
    def validate_times(self) -> "CalendarEventCreateRequest":
        if self.end_datetime <= self.start_datetime:
            raise ValueError("end_datetime must be after start_datetime")
        return self


class CalendarEventUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    event_type: Optional[str] = None
    priority: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    is_all_day: Optional[bool] = None
    location: Optional[str] = None
    meeting_url: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[UUID] = None
    related_lead_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None
    related_company_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None
    reminder_minutes: Optional[int] = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_times(self) -> "CalendarEventUpdateRequest":
        if self.start_datetime and self.end_datetime:
            if self.end_datetime <= self.start_datetime:
                raise ValueError("end_datetime must be after start_datetime")
        return self


# ── Response models ───────────────────────────────────────────────────────────

class CalendarEventResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    event_type: str
    status: str
    priority: str
    start_datetime: datetime
    end_datetime: datetime
    is_all_day: bool
    location: Optional[str]
    meeting_url: Optional[str]
    owner_id: Optional[UUID]
    owner_name: Optional[str] = None
    related_lead_id: Optional[UUID]
    related_contact_id: Optional[UUID]
    related_company_id: Optional[UUID]
    related_deal_id: Optional[UUID]
    reminder_minutes: Optional[int]
    organization_id: UUID
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    # enriched fields (populated by service)
    lead_name: Optional[str] = None
    contact_name: Optional[str] = None
    company_name: Optional[str] = None
    deal_name: Optional[str] = None
    duration_minutes: Optional[int] = None
    time_display: Optional[str] = None     # "10:00 AM"
    duration_display: Optional[str] = None  # "60 mins"

    model_config = {"from_attributes": True}


class DayAgendaEvent(BaseModel):
    """Compact event shown in the Day Agenda panel."""
    id: UUID
    title: str
    time: str               # "10:00 AM"
    duration: str           # "60 mins"
    type: str
    priority: str
    status: str
    lead: Optional[str] = None
    contact: Optional[str] = None
    company: Optional[str] = None
    owner: Optional[str] = None


class DayAgendaResponse(BaseModel):
    date: str               # "2026-07-29"
    events: list[DayAgendaEvent] = Field(default_factory=list)


class CalendarViewResponse(BaseModel):
    view: str               # day | week | month
    start_date: str
    end_date: str
    events: list[CalendarEventResponse] = Field(default_factory=list)
    agenda: list[DayAgendaEvent] = Field(default_factory=list)
    statistics: dict[str, Any] = Field(default_factory=dict)


class CalendarStatisticsResponse(BaseModel):
    today: int
    week: int
    month: int
    completed: int
    missed: int
    cancelled: int


class TodayScheduleResponse(BaseModel):
    meetings: int
    calls: int
    tasks: int
    follow_ups: int = Field(alias="followUps")

    model_config = {"populate_by_name": True}


class OverdueEventItem(BaseModel):
    id: UUID
    title: str
    overdue_hours: float = Field(alias="overdueHours")
    type: str
    priority: str
    owner: Optional[str] = None

    model_config = {"populate_by_name": True}


class ConflictCheckResponse(BaseModel):
    has_conflict: bool
    message: str
    conflicting_events: list[CalendarEventResponse] = Field(default_factory=list)


class ReminderItem(BaseModel):
    event_id: UUID
    title: str
    start_datetime: datetime
    reminder_minutes: int
    reminder_at: datetime
    owner_id: Optional[UUID]
