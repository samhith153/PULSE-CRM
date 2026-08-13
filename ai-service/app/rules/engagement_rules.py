"""
Engagement Feature Engineering

Purpose:
--------
Compute engagement feature values from the CURRENT lead state.

This module is PURE.
- No database access
- No API calls
- No email scanning
- No state updates

Input:
------
Current lead state received from backend.

Output:
-------
Feature values used by the scoring engine.
"""

from datetime import datetime, timezone

# ============================================================
# INTENT SCORE
# ============================================================

_INTENT_SCORE_MAP = {
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
    # Coarse summarizer intent vocabulary (TASK 4 in the summarization prompt)
    "buy": 85,
    "demo": 85,
    "negotiate": 90,
    "followup": 40,
    "decline": -70,
    "other": 0,
}


def intent_score(intent: str) -> int:
    if not intent:
        return 0

    return _INTENT_SCORE_MAP.get(intent.lower(), 0)


# ============================================================
# BUYING STAGE SCORE
# ============================================================

_STAGE_SCORE_MAP = {
    "new": 10,
    "contacted": 25,
    "qualified": 45,
    "proposal_sent": 80,
    "negotiation": 90,
    "won": 100,
    "lost": 0,
    "converted": 50,
}


def buying_stage_score(stage: str) -> int:
    if not stage:
        return 0

    return _STAGE_SCORE_MAP.get(stage.lower(), 0)


# ============================================================
# CUSTOMER INITIATIVE SCORE
# ============================================================

def initiative_score(
    inbound_count: int,
    initiated_count: int,
) -> float:
    """
    Measures how often the customer initiates conversations.

    Score = initiated / inbound, clamped to [0, 100].
    """

    if inbound_count <= 0:
        return 0

    ratio = min(initiated_count / inbound_count, 1.0)

    return round(ratio * 100, 2)


# ============================================================
# ENGAGEMENT DECAY
# ============================================================

def days_since_last_inbound(last_inbound_at) -> int | None:
    """
    Number of days since last customer reply.
    """

    if last_inbound_at is None:
        return None

    if isinstance(last_inbound_at, str):
        last_inbound_at = datetime.fromisoformat(
            last_inbound_at.replace("Z", "+00:00")
        )

    now = datetime.now(timezone.utc)

    if last_inbound_at.tzinfo is None:
        last_inbound_at = last_inbound_at.replace(
            tzinfo=timezone.utc
        )

    return (now - last_inbound_at).days


def decay_penalty(days: int | None) -> int:
    """
    Subtractive modifier applied AFTER the weighted composite.
    NOT a weighted peer feature.

    More inactive → larger penalty.
    """

    if days is None:
        return 0

    if days <= 3:
        return 0

    elif days <= 7:
        return -5

    elif days <= 14:
        return -10

    elif days <= 30:
        return -20

    else:
        return -30


# ============================================================
# FEATURE ORCHESTRATOR
# ============================================================

def compute_engagement_features(lead_state: dict) -> dict:
    """
    Parameters
    ----------
    lead_state : dict
        {
            "intent": "demo_request",
            "current_stage": "qualified",
            "inbound_count": 8,
            "initiated_count": 3,
            "last_inbound_at": "2026-08-05T12:00:00Z"
        }

    Returns
    -------
    Feature dictionary used by the scoring engine.
    """

    intent = lead_state.get("intent")
    stage = lead_state.get("current_stage")
    inbound_count = lead_state.get("inbound_count", 0)
    initiated_count = lead_state.get("initiated_count", 0)
    last_inbound_at = lead_state.get("last_inbound_at")

    days = days_since_last_inbound(last_inbound_at)

    return {
        "intent_score":
            intent_score(intent),

        "buying_stage_score":
            buying_stage_score(stage),

        "initiative_score":
            initiative_score(
                inbound_count,
                initiated_count,
            ),

        "decay_penalty":
            decay_penalty(days),

        "days_since_last_inbound":
            days,
    }


# ============================================================
# ENGAGEMENT TREND  (UI / analytics only — NOT a scoring feature)
# ============================================================

def engagement_trend(
    current_score: float,
    previous_score: float | None,
) -> dict:
    """
    Derived metric for dashboards and notifications ONLY.

    This function is intentionally separate from
    compute_engagement_features() and must NEVER be fed back
    into the engagement score calculation — doing so creates
    a feedback loop that makes the score unstable over time.

    Parameters
    ----------
    current_score : float
        The engagement score just computed for this lead.

    previous_score : float | None
        The engagement score stored from the previous compute cycle.
        None means this is the first time the lead has been scored
        (no history yet).

    Returns
    -------
    dict
        {
            "delta": float | None,
            "direction": "up" | "down" | "stable" | "unknown",
            "label": str
        }

    Backend responsibility
    ----------------------
    Before calling the scoring engine each cycle, the backend must:

        1. Read the current stored engagement_score from the lead row.
        2. Pass it here as previous_score.
        3. After scoring, overwrite engagement_score with the new value.

    This ensures previous_score always reflects the score from the
    last compute cycle, not the current one.

    Threshold (±5 points treated as stable)
    ----------------------------------------
    A ±5 point buffer prevents the direction label from flipping
    on minor float fluctuations when nothing meaningful has changed
    (e.g. decay ticking by one day). Adjust if too sensitive or
    too coarse for your UI.
    """

    if previous_score is None:
        return {
            "delta": None,
            "direction": "unknown",
            "label": "No history yet",
        }

    delta = round(current_score - previous_score, 2)

    if delta > 5:
        direction = "up"
        label = f"↑ Improving (+{delta})"
    elif delta < -5:
        direction = "down"
        label = f"↓ Declining ({delta})"
    else:
        direction = "stable"
        label = f"→ Stable ({'+' if delta >= 0 else ''}{delta})"

    return {
        "delta": delta,
        "direction": direction,
        "label": label,
    }