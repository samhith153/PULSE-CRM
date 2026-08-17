"""
Feature Computer — ported exactly from ai/recommendation/feature_computer.py.

Pure Python implementation for building lead features from CRM data.
Used by the Recommendation Engine (AI microservice).
"""

from datetime import datetime, timezone
from typing import Optional

STAGE_MAP = {
    "new": "New Lead",
    "new_lead": "New Lead",
    "contacted": "Contacted",
    "qualified": "Qualified",
    "proposal_sent": "Proposal Sent",
    "negotiation": "Negotiation",
    "won": "Closed Won",
    "closed_won": "Closed Won",
    "lost": "Closed Lost",
    "closed_lost": "Closed Lost",
    "converted": "Closed Won",
    "meeting_booked": "Meeting Booked",
    "meeting_done": "Meeting Done",
    "discovery_call": "Discovery Call",
    "decision": "Decision",
    "re_engaged": "Re-Engaged",
    "meeting_rescheduled": "Meeting Rescheduled",
    "proposal_viewed": "Proposal Viewed",
}


def compute_email_features(outbound_thread, inbound_thread):
    outbound_subject = outbound_thread[0] if outbound_thread else None
    inbound_subject = inbound_thread[0] if inbound_thread else None
    open_count = outbound_thread[1] if len(outbound_thread) > 1 else 0

    if open_count is None:
        open_count = 0
    elif isinstance(open_count, str):
        open_count = int(open_count.strip()) if open_count.strip() else 0

    if open_count > 50:
        open_count = 50

    return {
        "subject": inbound_subject,
        "open_count": open_count,
        "outbound_subject": outbound_subject,
    }


def compute_urgency(score, intent):
    urgency = 0.0

    if score is not None:
        urgency += score * 0.5

    intent = (intent or "").strip().lower()

    if intent in ("meeting_booked", "meeting_done", "decision"):
        urgency += 20
    elif intent in ("proposal_sent", "negotiation"):
        urgency += 10

    return urgency


def compute_contact_time(contact_time, now=None):
    now = now or datetime.now(timezone.utc)

    if not contact_time:
        return 0.0

    ct = contact_time
    if not ct.tzinfo:
        ct = ct.replace(tzinfo=timezone.utc)

    diff = (now - ct).total_seconds()

    if diff < 0:
        return 0.0

    if diff <= 10 * 60:
        return 1.0
    elif diff <= 3 * 60 * 60:
        return 0.75
    elif diff <= 24 * 60 * 60:
        return 0.5
    elif diff <= 7 * 24 * 60 * 60:
        return 0.25

    return 0.0


def compute_meeting_attendance(meetings_held, meetings_expected):
    if meetings_expected <= 0:
        return 0.0
    return meetings_held / meetings_expected


def get_stage(stage):
    return STAGE_MAP.get(stage, stage)


def is_terminal(stage):
    return get_stage(stage) in ("Closed Won", "Closed Lost")


def build_lead_features(lead, now=None):
    now = now or datetime.now(timezone.utc)

    last_outbound = lead.get("last_outbound_date")
    contact_time = lead.get("last_contact_time")
    if last_outbound and not contact_time:
        contact_time = last_outbound

    meetings_held = lead.get("meetings_held", 0)
    meetings_expected = lead.get("meetings_expected", 0)
    if meetings_expected is None:
        meetings_expected = 1
    if meetings_held is None:
        meetings_held = 0

    return {
        "contact_id": lead["contact_id"],
        "email": lead.get("email"),
        "contact_time": compute_contact_time(contact_time, now=now),
        "engagement_score": float(lead.get("score") or 0),
        "buying_stage": get_stage(lead.get("buying_stage") or lead.get("current_stage") or ""),
        "score_time": lead.get("score_updated_at") or lead.get("updated_at"),
        "meeting_attendance": compute_meeting_attendance(meetings_held, meetings_expected),
        "subject": (lead.get("outbound_thread") or [None])[0],
        "open_count": compute_email_features(lead.get("outbound_thread", []), lead.get("inbound_thread", []))["open_count"],
        "is_outbound": lead.get("is_outbound", False),
        "is_re_engaged": lead.get("status") == "re_engaged",
        "email_account": lead.get("email_account"),
        "owner_user_id": lead.get("owner_user_id"),
        "user_id": lead.get("user_id"),
        "rep_id": lead.get("rep_id"),
        "rep_workload": lead.get("rep_workload") if lead.get("rep_workload") is not None else 0.5,
        "company_name": lead.get("company_name"),
        "tags": lead.get("tags"),
        "deal_value": lead.get("deal_value"),
        "inbound_thread": lead.get("inbound_thread"),
        "outbound_thread": lead.get("outbound_thread"),
        "email_sentiment": lead.get("email_sentiment"),
        "email_intent": lead.get("email_intent"),
        "email_key_points": lead.get("email_key_points") or [],
        "email_follow_up_suggestion": lead.get("email_follow_up_suggestion"),
        "email_follow_up_timing": lead.get("email_follow_up_timing"),
        "email_action_items": lead.get("email_action_items") or [],
        "latest_email_subject": lead.get("latest_email_subject"),
        "latest_email_preview": lead.get("latest_email_preview"),
        "email_summaries": lead.get("email_summaries") or [],
    }
