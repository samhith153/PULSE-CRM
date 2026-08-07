"""
Activity Timeline Schemas — for the Details page Timeline History tab.
Reuses icon/relative-time helpers from audit_log.py.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.audit_log import _icon_for_action, _relative_time

# ── Icon colour mapping ────────────────────────────────────────────────────────

ACTION_COLOR_MAP: dict[str, str] = {
    # company
    "company_created":        "#7C3AED",
    "company_updated":        "#5B9BD5",
    "company_deleted":        "#E2604F",
    "company_owner_changed":  "#7C3AED",
    "company_industry_changed":"#E8A33D",
    "company_revenue_updated":"#E8A33D",
    "company_employees_updated":"#E8A33D",
    "company_status_changed": "#5B9BD5",
    "company_archived":       "#E2604F",
    "company_restored":       "#4FB477",
    "company_contact_linked": "#4FB477",
    "company_contact_removed":"#E2604F",
    "company_lead_linked":    "#4FB477",
    "company_lead_removed":   "#E2604F",
    "company_deal_linked":    "#4FB477",
    "company_deal_removed":   "#E2604F",
    "company_deal_won":       "#4FB477",
    "company_deal_lost":      "#E2604F",
    # task
    "task_created":       "#7C3AED",
    "task_updated":       "#5B9BD5",
    "task_completed":     "#4FB477",
    "task_deleted":       "#E2604F",
    "task_assigned":      "#7C3AED",
    "task_started":       "#5B9BD5",
    "task_status_changed":"#5B9BD5",
    "task_priority_changed":"#E8A33D",
    "task_due_date_changed":"#E8A33D",
    "task_owner_changed": "#7C3AED",
    "task_reopened":      "#E8A33D",
    "task_overdue":       "#E2604F",
    "task_restored":      "#4FB477",
    # call
    "call_logged":        "#4FB477",
    "call_updated":       "#5B9BD5",
    "call_deleted":       "#E2604F",
    "call_started":       "#4FB477",
    "call_completed":     "#4FB477",
    "call_missed":        "#E2604F",
    "call_duration_updated":"#5B9BD5",
    "call_outcome_updated":"#5B9BD5",
    "call_notes_added":   "#4FB477",
    # meeting
    "meeting_scheduled":  "#5B9BD5",
    "meeting_updated":    "#5B9BD5",
    "meeting_rescheduled":"#E8A33D",
    "meeting_started":    "#5B9BD5",
    "meeting_completed":  "#4FB477",
    "meeting_cancelled":  "#E2604F",
    "meeting_notes_added":"#5B9BD5",
    "meeting_deleted":    "#E2604F",
    "meeting_restored":   "#4FB477",
    # email
    "email_draft_created":"#E8A33D",
    "email_sent":         "#E8A33D",
    "email_delivered":    "#4FB477",
    "email_opened":       "#4FB477",
    "email_reply_received":"#E8A33D",
    "email_forwarded":    "#E8A33D",
    "email_deleted":      "#E2604F",
    "email_received":     "#E8A33D",
    "email":              "#E8A33D",
    # note
    "internal_note_added":"#10B981",
    "note_created":       "#10B981",
    "note_edited":        "#5B9BD5",
    "note_deleted":       "#E2604F",
    "note_restored":      "#4FB477",
}

DEFAULT_COLOR = "#6B7280"


def _color_for_action(action: str) -> str:
    return ACTION_COLOR_MAP.get(action.lower(), DEFAULT_COLOR)


# ── Response shapes ────────────────────────────────────────────────────────────

class TimelineEntry(BaseModel):
    """A single enriched timeline row for the Details page."""
    timeline_id: UUID
    organization_id: UUID
    entity_type: str
    entity_id: UUID
    activity_type: str          # the raw action string
    title: str
    description: Optional[str] = None
    performed_by: str           # full_name or "System"
    performed_by_user_id: Optional[UUID] = None
    performed_by_avatar: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    icon: str
    color: str
    created_at: datetime
    updated_at: datetime
    relative_time: str

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "TimelineEntry":
        created_at: datetime = row["created_at"]
        action: str = row["action"]
        return cls(
            timeline_id=row["id"],
            organization_id=row["organization_id"],
            entity_type=row["entity_type"],
            entity_id=row["entity_id"],
            activity_type=action,
            title=row["title"],
            description=row.get("description"),
            performed_by=row.get("performed_by_name") or "System",
            performed_by_user_id=row.get("created_by"),
            performed_by_avatar=row.get("performed_by_avatar"),
            metadata=row.get("payload"),
            icon=_icon_for_action(action),
            color=_color_for_action(action),
            created_at=created_at,
            updated_at=row.get("updated_at") or created_at,
            relative_time=_relative_time(created_at),
        )

    model_config = {"from_attributes": True}


class TimelineListResponse(BaseModel):
    """Paginated timeline list."""
    total_records: int
    page: int
    page_size: int
    has_next: bool
    has_prev: bool
    entries: list[TimelineEntry] = Field(default_factory=list)


class ActivitySummaryResponse(BaseModel):
    """Aggregate stats for an entity's activity panel."""
    total_events: int
    emails: int
    calls: int
    meetings: int
    tasks: int
    notes: int
    latest_activity: Optional[datetime] = None
    last_updated: Optional[datetime] = None
