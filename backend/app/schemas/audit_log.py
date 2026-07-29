"""
Audit Log Schemas
Pydantic models for the Activities → Audit Logs endpoints.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── Icon mapping ──────────────────────────────────────────────────────────────

ACTIVITY_ICON_MAP: dict[str, str] = {
    # email
    "email": "email",
    "email_sent": "email",
    "email_received": "email",
    # meeting
    "meeting": "meeting",
    "meeting_scheduled": "meeting",
    "meeting_completed": "meeting",
    "meeting_cancelled": "meeting",
    # call
    "call": "call",
    "call_logged": "call",
    # task
    "task": "task",
    "task_created": "task",
    "task_completed": "task",
    # lead
    "lead_created": "lead",
    "lead_updated": "lead",
    "lead_deleted": "lead",
    "lead_assigned": "lead",
    "lead_converted": "lead",
    # deal
    "deal_created": "deal",
    "deal_updated": "deal",
    "deal_won": "deal",
    "deal_lost": "deal",
    "stage_changed": "deal",
    "created_from_lead": "deal",
    # company
    "company_created": "company",
    "company_updated": "company",
    # contact
    "contact_created": "contact",
    "contact_updated": "contact",
    # forecast / AI
    "forecast_updated": "forecast",
    "ai_recommendation_accepted": "forecast",
    "ai_recommendation_ignored": "forecast",
    # auth
    "login": "login",
    "logout": "logout",
    "password_changed": "login",
    # notes
    "note": "notes",
    "internal_note_added": "notes",
    "proposal_sent": "email",
    "quote_generated": "deal",
}


def _icon_for_action(action: str) -> str:
    return ACTIVITY_ICON_MAP.get(action.lower(), "notes")


# ── Relative time ──────────────────────────────────────────────────────────────

def _relative_time(created_at: datetime) -> str:
    """
    Dynamically calculates relative time label.
    e.g. '10 mins ago', '2 hours ago', 'Yesterday', '3 days ago', '1 week ago', '1 month ago'
    Never stored — always computed at response time.
    """
    now = datetime.now(tz=created_at.tzinfo or None)
    delta = now - created_at
    total_seconds = int(delta.total_seconds())

    if total_seconds < 60:
        return "just now"
    if total_seconds < 3600:
        mins = total_seconds // 60
        return f"{mins} min{'s' if mins > 1 else ''} ago"
    if total_seconds < 86400:
        hours = total_seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    if total_seconds < 172800:
        return "Yesterday"
    days = total_seconds // 86400
    if days < 7:
        return f"{days} days ago"
    if days < 14:
        return "1 week ago"
    if days < 30:
        weeks = days // 7
        return f"{weeks} weeks ago"
    if days < 60:
        return "1 month ago"
    months = days // 30
    return f"{months} months ago"


# ── Response models ────────────────────────────────────────────────────────────

class AuditLogEntry(BaseModel):
    """Single audit log entry as returned to the frontend timeline."""
    id: UUID
    activity_type: str          # raw action value
    icon: str                   # mapped icon key
    title: str
    description: Optional[str]
    entity_type: Optional[str]
    entity_id: Optional[UUID]
    performed_by: str           # user full_name or "System"
    performed_by_user_id: Optional[UUID]
    performed_by_avatar: Optional[str]
    created_at: datetime
    relative_time: str          # dynamically computed
    metadata: Optional[dict[str, Any]]

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "AuditLogEntry":
        created_at: datetime = row["created_at"]
        return cls(
            id=row["id"],
            activity_type=row["action"],
            icon=_icon_for_action(row["action"]),
            title=row["title"],
            description=row.get("description"),
            entity_type=row.get("entity_type"),
            entity_id=row.get("entity_id"),
            performed_by=row.get("performer_name") or "System",
            performed_by_user_id=row.get("created_by"),
            performed_by_avatar=row.get("performer_avatar"),
            created_at=created_at,
            relative_time=_relative_time(created_at),
            metadata=row.get("payload"),
        )

    model_config = {"populate_by_name": True}


class AuditLogListResponse(BaseModel):
    """Paginated audit log list — matches the response shape in the prompt."""
    total_records: int
    page: int
    page_size: int
    has_next: bool
    activities: list[AuditLogEntry] = Field(default_factory=list)


class AuditLogStatisticsResponse(BaseModel):
    """Activity statistics KPIs."""
    today_activities: int = Field(alias="todayActivities")
    week_activities: int = Field(alias="weekActivities")
    month_activities: int = Field(alias="monthActivities")
    emails: int
    calls: int
    meetings: int
    notes: int

    model_config = {"populate_by_name": True}
