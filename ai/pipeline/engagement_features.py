"""
Feature engineering functions for the Engagement Engine.
"""

import pandas as pd


from datetime import datetime
import pandas as pd


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

    days = (datetime.now() - latest).days

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
    Percentage of emails initiated by customer.
    """

    if emails.empty:
        return 0

    customer = emails["sender"].str.contains("customer", case=False).sum()

    total = len(emails)

    return round((customer / total) * 100)


def buying_stage_score(stage):
    """
    Buying stage mapping.
    """

    mapping = {
        "Awareness": 20,
        "Consideration": 40,
        "Qualified": 60,
        "Proposal": 80,
        "Negotiation": 100,
        "Closed Won": 100,
        "Closed Lost": 0
    }

    return mapping.get(stage, 0)


def intent_strength_score(stage):
    """
    Temporary intent score derived from buying stage.
    Replace with AI model later.
    """

    mapping = {
        "Awareness": 20,
        "Consideration": 40,
        "Qualified": 60,
        "Proposal": 80,
        "Negotiation": 100,
        "Closed Won": 100,
        "Closed Lost": 0
    }

    return mapping.get(stage, 0)