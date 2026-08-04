"""
Feature engineering functions for the Engagement Engine.
Corrected based on Email schema and engagement requirements.

Uses:
- direction: "inbound" (customer) or "outbound" (sales)
- thread_id: Groups related emails in conversation
- sent_at: Timestamp of email
"""

import pandas as pd
from datetime import datetime


def average_response_time(emails):
    """
    Average response time in HOURS between sales emails and customer replies.
    
    ONLY counts actual customer replies (inbound) after sales emails (outbound).
    Ignores unanswered sales emails.
    
    Uses variables: total_response_time, response_count (no DB storage yet)
    
    Args:
        emails: DataFrame with columns [thread_id, direction, sent_at]
    
    Returns:
        float: Average response time in hours, or None if no replies
    """
    
    if emails.empty or len(emails) < 2:
        return None
    
    emails = emails.sort_values("sent_at").copy()
    emails["sent_at"] = pd.to_datetime(emails["sent_at"])
    
    response_times = []
    
    # Go through each email
    for i in range(len(emails)):
        
        # Check if THIS email is from customer (inbound = reply)
        if emails.iloc[i]["direction"] == "inbound":
            
            # Find PREVIOUS outbound email from sales
            for j in range(i-1, -1, -1):
                if emails.iloc[j]["direction"] == "outbound":
                    
                    # Calculate time difference in hours
                    time_diff_hours = (emails.iloc[i]["sent_at"] - emails.iloc[j]["sent_at"]).total_seconds() / 3600
                    response_times.append(time_diff_hours)
                    break
    
    # If no replies found, return None
    if not response_times:
        return None
    
    # Calculate average (stored in variables, not DB)
    total_response_time = sum(response_times)
    response_count = len(response_times)
    avg_hours = total_response_time / response_count
    
    return round(avg_hours, 2)


def response_time_score(avg_response_time_hours):
    """
    Convert average response time (hours) to engagement score (0-100).
    
    Mapping per PDF spec:
    - < 2 hours: 100 (very engaged)
    - 2-8 hours: 90
    - 8-24 hours: 75
    - 1-3 days: 55
    - 4-7 days: 30
    - > 7 days: 10
    - No history: 0
    
    Args:
        avg_response_time_hours: float or None
    
    Returns:
        int: Score 0-100
    """
    
    if avg_response_time_hours is None:
        return 0  # No response history
    
    if avg_response_time_hours < 2:
        return 100
    elif avg_response_time_hours < 8:
        return 90
    elif avg_response_time_hours < 24:
        return 75
    elif avg_response_time_hours < 72:  # 3 days
        return 55
    elif avg_response_time_hours < 168:  # 7 days
        return 30
    else:
        return 10


def days_since_last_outbound(emails):
    """
    Days since LAST OUTBOUND email (sales rep sent email).
    
    Measures: How long has this lead been idle without our action?
    
    Args:
        emails: DataFrame with columns [direction, sent_at]
    
    Returns:
        int: Number of days, or None if no outbound emails
    """
    
    if emails.empty:
        return None
    
    # Filter for outbound emails only (from sales rep)
    outbound_emails = emails[emails["direction"] == "outbound"]
    
    if outbound_emails.empty:
        return None
    
    # Get the latest outbound email
    latest_outbound = pd.to_datetime(outbound_emails["sent_at"]).max()
    days = (datetime.now() - latest_outbound).days
    
    return days


def engagement_decay_penalty(days_since_last_outbound):
    """
    Apply decay penalty based on days since last sales outbound email.
    
    Penalty table per PDF:
    - 0-3 days: 0 (no penalty)
    - 4-7 days: -2
    - 8-14 days: -5
    - 15-30 days: -10
    - 31-60 days: -20
    - 61+ days: -30
    
    Args:
        days_since_last_outbound: int or None
    
    Returns:
        int: Penalty (0 to -30)
    """
    
    if days_since_last_outbound is None:
        return 0  # No outbound emails, no penalty
    
    if days_since_last_outbound <= 3:
        return 0
    elif days_since_last_outbound <= 7:
        return -2
    elif days_since_last_outbound <= 14:
        return -5
    elif days_since_last_outbound <= 30:
        return -10
    elif days_since_last_outbound <= 60:
        return -20
    else:
        return -30


def ai_intent_category_score(intent_category):
    """
    AI Intent Category to engagement score mapping (0-100 normalized).
    
    This should be extracted from latest email via LLM API.
    
    Mapping per PDF spec:
    - contract_signed: 100
    - referral: 95
    - pricing_negotiation: 90
    - demo_request, urgent: 85
    - proposal: 80
    - budget: 75
    - meeting: 70
    - positive: 65
    - interested: 60
    - follow_up: 40
    - inquiry: 35
    - introduction: 30
    - thank_you: 20
    - neutral, support: 0
    - complaint: -50
    - negative: -70
    - lost: -100
    
    Args:
        intent_category: str (category name from LLM)
    
    Returns:
        int: Score (-100 to +100)
    """
    
    intent_mapping = {
        "contract_signed": 100,
        "referral": 95,
        "pricing_negotiation": 90,
        "demo_request": 85,
        "urgent": 85,
        "proposal": 80,
        "budget": 75,
        "meeting": 70,
        "positive": 65,
        "interested": 60,
        "follow_up": 40,
        "inquiry": 35,
        "introduction": 30,
        "thank_you": 20,
        "neutral": 0,
        "support": 0,
        "complaint": -50,
        "negative": -70,
        "lost": -100,
    }
    
    return intent_mapping.get(intent_category, 0)


def buying_stage_score(stage):
    """
    Current buying stage to engagement score mapping (0-100).
    
    Mapping per PDF spec:
    - New Lead: 10
    - Contacted: 20
    - Responded: 40
    - Meeting: 60
    - Demo: 75
    - Proposal: 85
    - Negotiation: 95
    - Won: 100
    - Lost: 0
    
    Args:
        stage: str (buying stage name)
    
    Returns:
        int: Score 0-100
    """
    
    mapping = {
        "New Lead": 10,
        "Contacted": 20,
        "Responded": 40,
        "Meeting": 60,
        "Demo": 75,
        "Proposal": 85,
        "Negotiation": 95,
        "Won": 100,
        "Lost": 0,
    }
    
    return mapping.get(stage, 0)


def customer_initiative_score(emails):
    """
    Score based on LATEST email direction in conversation.
    
    If latest email is from customer (inbound) = they're actively driving
    If latest email is from sales (outbound) = we're chasing them
    
    Args:
        emails: DataFrame with columns [direction, sent_at]
    
    Returns:
        int: 100 if customer initiated, 30 if sales initiated, 0 if no emails
    """
    
    if emails.empty:
        return 0
    
    # Get the latest email by sent_at
    latest_email = emails.sort_values("sent_at").iloc[-1]
    
    if latest_email["direction"] == "inbound":
        return 100  # Customer driving conversation ✅
    elif latest_email["direction"] == "outbound":
        return 30   # Sales chasing customer ❌
    else:
        return 0


def engagement_trend_score(intent_today, intent_7_days_ago):
    """
    Measure engagement TREND over past 7 days.
    
    Compares AI Intent scores: today vs 7 days ago
    
    Delta calculation:
    - +20 or more: 100 (strong positive trend)
    - +10 to +19: 75 (positive trend)
    - -10 to +10: 50 (stable)
    - -10 to -19: 25 (declining)
    - -20 or less: 0 (strong decline)
    - insufficient data: 50 (unknown)
    
    Args:
        intent_today: int (latest intent score) or None
        intent_7_days_ago: int (intent score from 7 days ago) or None
    
    Returns:
        int: Score 0-100
    """
    
    if intent_today is None or intent_7_days_ago is None:
        return 50  # Insufficient data = neutral
    
    delta = intent_today - intent_7_days_ago
    
    if delta >= 20:
        return 100  # Strong positive trend 🔥
    elif delta >= 10:
        return 75   # Positive trend ✅
    elif delta >= -10:
        return 50   # Stable ➡️
    elif delta >= -20:
        return 25   # Declining ⬇️
    else:
        return 0    # Strong decline 🔴