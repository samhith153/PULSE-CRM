"""
feature_computer.py

Computes LeadFeatures from raw data (emails, activities, lead, deal).
This lives in ai/recommendation/ so the backend just passes raw DB objects.

Usage from backend:
    from ai.recommendation.feature_computer import build_lead_features
    features = build_lead_features(lead, deal, emails, activities, rep_active_count)
"""

from datetime import datetime, timezone
from typing import Optional


# ── Stage mapping (LeadStatus enum → engine stage name) ──────────────────────

STAGE_MAP = {
    "new": "New Lead",
    "contacted": "Contacted",
    "qualified": "Qualified",
    "proposal_sent": "Proposal Sent",
    "negotiation": "Negotiation",
}

TERMINAL_STAGES = {"won", "lost", "converted"}

DEAL_STAGE_TO_ENGINE_STAGE = {
    "new": "New Lead",
    "qualified": "Qualified",
    "proposal": "Proposal Sent",
    "negotiation": "Negotiation",
}


# ── Email features ───────────────────────────────────────────────────────────

def compute_email_features(emails: list) -> dict:
    """
    Compute email-based features from a list of email objects.

    Returns dict with:
        email_open_count: outbound emails that were read
        reply_received: any inbound email exists
        email_opened_no_reply: opened but no reply
        outbound_email_count: total outbound emails
        inbound_email_count: total inbound emails
    """
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


# ── Engagement velocity ──────────────────────────────────────────────────────

def compute_engagement_velocity(activities: list, emails: list) -> float:
    """
    Compute engagement velocity: whether interest is increasing or decreasing.

    Compares activity in the last 7 days vs 7-30 days ago.
    Returns a value from -1.0 (declining) to 1.0 (increasing).
    0.0 means stable or no data.
    """
    now = datetime.now(timezone.utc)
    recent_cutoff = now - __import__('datetime').timedelta(days=7)
    older_cutoff = now - __import__('datetime').timedelta(days=30)

    recent_count = 0
    older_count = 0

    for activity in (activities or []):
        t = getattr(activity, "created_at", None)
        if t:
            if t.tzinfo is None:
                t = t.replace(tzinfo=timezone.utc)
            if t >= recent_cutoff:
                recent_count += 1
            elif t >= older_cutoff:
                older_count += 1

    for email in (emails or []):
        t = getattr(email, "sent_at", None)
        if t:
            if t.tzinfo is None:
                t = t.replace(tzinfo=timezone.utc)
            if t >= recent_cutoff:
                recent_count += 1
            elif t >= older_cutoff:
                older_count += 1

    # No data = neutral
    if recent_count == 0 and older_count == 0:
        return 0.0

    # If we have recent activity but no older activity, it's a new spike
    if older_count == 0 and recent_count > 0:
        return min(1.0, recent_count / 5)

    # Compare recent vs older rate (normalized to per-week)
    recent_weekly = recent_count  # already 1 week
    older_weekly = older_count / 3  # 3 weeks → per week

    if older_weekly == 0:
        return min(1.0, recent_weekly / 5)

    ratio = recent_weekly / older_weekly
    # Map ratio to -1..1: ratio=2 → velocity=1, ratio=0.5 → velocity=-1, ratio=1 → velocity=0
    velocity = max(-1.0, min(1.0, (ratio - 1)))
    return round(velocity, 2)


# ── Urgency (days since last activity) ───────────────────────────────────────

def compute_urgency(activities: list, emails: list, lead) -> int:
    """
    Compute days since the last activity (activity or email).

    For brand-new leads with no activities, computes from lead creation date
    instead of returning an arbitrary default.
    """
    now = datetime.now(timezone.utc)
    latest = None

    for activity in activities:
        t = getattr(activity, "created_at", None)
        if t:
            if t.tzinfo is None:
                t = t.replace(tzinfo=timezone.utc)
            if latest is None or t > latest:
                latest = t

    for email in emails:
        t = getattr(email, "sent_at", None)
        if t:
            if t.tzinfo is None:
                t = t.replace(tzinfo=timezone.utc)
            if latest is None or t > latest:
                latest = t

    if latest is None:
        # No activities at all — compute from lead creation date
        created = getattr(lead, "created_at", None)
        if created:
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            return max(0, (now - created).days)
        return 0

    return max(0, (now - latest).days)


# ── Best contact time ────────────────────────────────────────────────────────

def compute_contact_time(activities: list, emails: list) -> Optional[str]:
    """
    Compute the best time slot to contact this lead based on historical activity.
    """
    hour_counts: dict[int, int] = {}

    for activity in (activities or []):
        t = getattr(activity, "created_at", None)
        if t:
            hour_counts[t.hour] = hour_counts.get(t.hour, 0) + 1

    for email in (emails or []):
        t = getattr(email, "sent_at", None)
        if t:
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


# ── Meeting attendance ───────────────────────────────────────────────────────

def compute_meeting_attendance(activities: list) -> Optional[str]:
    """
    Extract the most recent meeting attendance status from activities.
    Checks up to 50 activities to avoid missing meeting events.
    """
    for activity in (activities or [])[:50]:
        payload = getattr(activity, "payload", None)
        if payload and "meeting_attendance_status" in payload:
            status = payload["meeting_attendance_status"]
            if status in {"ATTENDED", "NO_SHOW", "RESCHEDULED"}:
                return status
    return None


# ── Stage mapping ────────────────────────────────────────────────────────────

def get_stage(lead_status: str) -> str:
    """Map a lead's status string to the engine stage name."""
    return STAGE_MAP.get(str(lead_status).lower(), "New Lead")


def is_terminal(lead_status: str) -> bool:
    """Check if a lead status is terminal (won/lost/converted)."""
    return str(lead_status).lower() in TERMINAL_STAGES


# ── Build LeadFeatures from raw DB objects ───────────────────────────────────

def build_lead_features(lead, deal, emails: list, activities: list, rep_active_count: int = 0):
    """
    Build a LeadFeatures dataclass from raw database objects.

    Args:
        lead: Lead model instance (with .status, .lead_score, .estimated_value, .owner_id, .created_at)
        deal: Deal model instance or None (with .amount)
        emails: list of Email model instances
        activities: list of ActivityTimeline model instances
        rep_active_count: int — number of active recommendations for this rep

    Returns:
        LeadFeatures instance ready for the recommendation engine
    """
    from ai.recommendation.ai_recommendation_models import LeadFeatures

    # Score
    current_score = 0.0
    if lead.lead_score and lead.lead_score.overall_score is not None:
        current_score = float(lead.lead_score.overall_score)

    # Terminal leads (won/lost/converted) should not get recommendations
    lead_status = str(getattr(lead, "status", "")).lower()
    if is_terminal(lead_status):
        current_stage = "Closed"
    else:
        # Stage: prefer deal's pipeline stage over lead's static status
        # (lead.status becomes "converted" after deal creation, but the deal continues through the pipeline)
        current_stage = None
        if deal:
            pipeline_stage = getattr(deal, "pipeline_stage", None)
            if pipeline_stage:
                deal_stage_slug = getattr(pipeline_stage, "slug", None)
                if deal_stage_slug and deal_stage_slug in DEAL_STAGE_TO_ENGINE_STAGE:
                    current_stage = DEAL_STAGE_TO_ENGINE_STAGE[deal_stage_slug]
        if not current_stage:
            current_stage = get_stage(lead.status)

    # Deal value
    deal_value = None
    if deal and deal.amount is not None:
        deal_value = float(deal.amount)
    elif lead.estimated_value is not None:
        deal_value = float(lead.estimated_value)

    # Email features
    email_features = compute_email_features(emails)

    # Urgency
    days_since = compute_urgency(activities, emails, lead)

    # Meeting
    meeting = compute_meeting_attendance(activities)

    # Contact time
    best_time = compute_contact_time(activities, emails)

    # Engagement velocity
    ev = compute_engagement_velocity(activities, emails)

    return LeadFeatures(
        lead_id=str(lead.id),
        current_score=current_score,
        current_stage=current_stage,
        days_since_last_activity=days_since,
        reply_received=email_features["reply_received"],
        deal_value=deal_value if deal_value and deal_value > 0 else None,
        email_open_count=email_features["email_open_count"] if email_features["email_open_count"] > 0 else None,
        email_opened_no_reply_flag=email_features["email_opened_no_reply"] if email_features["email_opened_no_reply"] else None,
        meeting_attendance_status=meeting,
        rep_active_action_count=rep_active_count if rep_active_count > 0 else None,
        best_contact_time_slot=best_time,
        engagement_velocity=ev if ev != 0.0 else None,
        outbound_email_count=email_features["outbound_email_count"],
        inbound_email_count=email_features["inbound_email_count"],
    )
