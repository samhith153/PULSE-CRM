"""
Lead feature builder.

Builds the feature payload (LeadFeatures) the AI service needs to generate a
recommendation. This logic was moved out of the `ai/` root package: the backend
owns database access, so it computes the features from ORM objects and sends the
resulting dict to the AI service over HTTP.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional


STAGE_MAP = {
    "new": "New Lead",
    "contacted": "Contacted",
    "qualified": "Qualified",
    "proposal_sent": "Proposal Sent",
    "negotiation": "Negotiation",
    "won": "Negotiation",
    "lost": "Contacted",
    "converted": "Qualified",
}

TERMINAL_STAGES = {"won", "lost", "converted"}

DEAL_STAGE_TO_ENGINE_STAGE = {
    "new": "New Lead",
    "qualified": "Qualified",
    "proposal": "Proposal Sent",
    "negotiation": "Negotiation",
    "won": "Won",
    "lost": "Lost",
}


def _aware(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None
    if getattr(value, "tzinfo", None) is None:
        try:
            return value.replace(tzinfo=timezone.utc)
        except AttributeError:
            return None
    return value


def compute_email_features(emails: list) -> dict:
    """Compute email-based features from a list of email ORM objects."""
    outbound_count = 0
    inbound_count = 0
    open_count = 0
    has_reply = False

    for email in emails:
        direction = getattr(email, "direction", None)
        is_read = getattr(email, "is_read", False)

        if direction == "outbound":
            outbound_count += 1
            if is_read:
                open_count += 1
        elif direction == "inbound":
            inbound_count += 1
            has_reply = True

    return {
        "email_open_count": open_count,
        "reply_received": has_reply,
        "email_opened_no_reply": open_count > 0 and not has_reply,
        "outbound_email_count": outbound_count,
        "inbound_email_count": inbound_count,
    }


def compute_urgency(activities: list, emails: list, lead) -> int:
    """Days since the last activity or email; falls back to lead creation date."""
    now = datetime.now(timezone.utc)
    latest = None

    for activity in activities:
        t = _aware(getattr(activity, "created_at", None))
        if t is not None and (latest is None or t > latest):
            latest = t

    for email in emails:
        t = _aware(getattr(email, "sent_at", None))
        if t is not None and (latest is None or t > latest):
            latest = t

    if latest is None:
        created = _aware(getattr(lead, "created_at", None))
        if created is not None:
            return max(0, (now - created).days)
        return 0

    return max(0, (now - latest).days)


def compute_contact_time(activities: list, emails: list) -> Optional[str]:
    """Best time slot to contact this lead based on historical activity."""
    hour_counts: dict[int, int] = {}

    for activity in activities or []:
        t = getattr(activity, "created_at", None)
        if t is not None:
            hour_counts[t.hour] = hour_counts.get(t.hour, 0) + 1

    for email in emails or []:
        t = getattr(email, "sent_at", None)
        if t is not None:
            hour_counts[t.hour] = hour_counts.get(t.hour, 0) + 1

    if not hour_counts:
        return None

    best_hour = max(hour_counts, key=hour_counts.get)
    if 8 <= best_hour < 10:
        return "08:00-10:00"
    elif 10 <= best_hour < 12:
        return "10:00-12:00"
    elif 14 <= best_hour < 16:
        return "14:00-16:00"
    elif 16 <= best_hour < 18:
        return "16:00-18:00"
    return "10:00-12:00"


def compute_meeting_attendance(activities: list) -> Optional[str]:
    """Most recent meeting attendance status from activity payloads."""
    for activity in (activities or [])[:50]:
        payload = getattr(activity, "payload", None)
        if payload and "meeting_attendance_status" in payload:
            status = payload["meeting_attendance_status"]
            if status in {"ATTENDED", "NO_SHOW", "RESCHEDULED"}:
                return status
    return None


def get_stage(lead_status: str) -> str:
    """Map a lead's status string to the engine stage name."""
    return STAGE_MAP.get(str(lead_status).lower(), "New Lead")


def is_terminal(lead_status: str) -> bool:
    """Check if a lead status is terminal (won/lost/converted)."""
    return str(lead_status).lower() in TERMINAL_STAGES


def build_lead_features(
    lead,
    deal,
    emails: list,
    activities: list,
    rep_active_count: int = 0,
) -> dict:
    """Build a LeadFeatures dict from raw ORM objects.

    The returned dict matches the AI service's `LeadFeatures` schema and is
    sent to the AI service over HTTP for recommendation generation.
    """
    current_score = 0.0
    if lead.lead_score and lead.lead_score.overall_score is not None:
        current_score = float(lead.lead_score.overall_score)

    current_stage = None
    if deal is not None:
        pipeline_stage = getattr(deal, "pipeline_stage", None)
        if pipeline_stage is not None:
            deal_stage_slug = getattr(pipeline_stage, "slug", None)
            if deal_stage_slug and deal_stage_slug in DEAL_STAGE_TO_ENGINE_STAGE:
                current_stage = DEAL_STAGE_TO_ENGINE_STAGE[deal_stage_slug]
    if not current_stage:
        current_stage = get_stage(lead.status)

    deal_value = None
    if deal is not None and deal.amount is not None:
        deal_value = float(deal.amount)
    elif lead.estimated_value is not None:
        deal_value = float(lead.estimated_value)

    email_features = compute_email_features(emails)
    days_since = compute_urgency(activities, emails, lead)
    meeting = compute_meeting_attendance(activities)
    best_time = compute_contact_time(activities, emails)

    return {
        "lead_id": str(lead.id),
        "current_score": current_score,
        "current_stage": current_stage,
        "days_since_last_activity": days_since,
        "reply_received": email_features["reply_received"],
        "deal_value": deal_value if deal_value and deal_value > 0 else None,
        "email_open_count": email_features["email_open_count"] if email_features["email_open_count"] > 0 else None,
        "email_opened_no_reply_flag": email_features["email_opened_no_reply"] or None,
        "meeting_attendance_status": meeting,
        "rep_active_action_count": rep_active_count if rep_active_count > 0 else None,
        "best_contact_time_slot": best_time,
        "outbound_email_count": email_features["outbound_email_count"],
        "inbound_email_count": email_features["inbound_email_count"],
    }
