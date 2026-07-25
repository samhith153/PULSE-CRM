"""
Feature engineering functions for the Engagement Engine.
"""

import pandas as pd
from datetime import datetime


def average_response_time(emails):
    """
    Average response time in hours between consecutive emails.
    """
    if emails.empty or len(emails) < 2:
        return None

    emails = emails.sort_values("sent_at").copy()
    emails["sent_at"] = pd.to_datetime(emails["sent_at"])

    diffs = emails["sent_at"].diff().dropna()
    avg_hours = diffs.dt.total_seconds().mean() / 3600

    return round(avg_hours, 2)


def reply_recency_score(emails):
    """
    Score based on latest email activity.
    """
    if emails.empty:
        return 0

    latest = pd.to_datetime(emails["sent_at"]).max()
    if latest.tzinfo is not None:
        now = pd.Timestamp.now(tz=latest.tzinfo)
    else:
        now = pd.Timestamp.now()

    days = (now - latest).days

    if days <= 1:
        return 100
    elif days <= 3:
        return 80
    elif days <= 7:
        return 60
    elif days <= 14:
        return 40
    else:
        return 20


def customer_initiative_score(emails):
    """
    Percentage of emails initiated by the customer (inbound direction).
    """
    if emails.empty:
        return 0

    customer = (emails["direction"] == "inbound").sum()
    total = len(emails)

    return round((customer / total) * 100)


# Real LeadStatus enum values from app/utils/enums.py:
# new, contacted, qualified, proposal_sent, negotiation, won, lost, converted
_STAGE_SCORE_MAP = {
    "new": 10,
    "contacted": 30,
    "qualified": 50,
    "proposal_sent": 70,
    "negotiation": 90,
    "won": 100,
    "lost": 0,
    "converted": 100,
}


def buying_stage_score(stage):
    """
    Buying stage mapping, based on real LeadStatus values.
    """
    if stage is None:
        return 0
    return _STAGE_SCORE_MAP.get(str(stage).lower(), 0)


def intent_strength_score(stage):
    """
    Temporary intent score derived from lead status.
    Replace with AI model later.
    """
    if stage is None:
        return 0
    return _STAGE_SCORE_MAP.get(str(stage).lower(), 0)