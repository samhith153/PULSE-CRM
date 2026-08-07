"""
Assessment Event Types

Each event determines what gets recomputed during lead assessment.
This avoids unnecessary recalculation and ensures the right scores
are updated for each type of change.
"""
from enum import Enum


class AssessmentEvent(str, Enum):
    """
    Supported assessment events.

    Each event maps to a specific recomputation path:
      - LEAD_CREATED: Fit → Overall (no engagement yet, no emails)
      - LEAD_UPDATED: Fit → Overall (data changed, recompute fit)
      - INBOUND_EMAIL: Intent → Engagement → Overall → Recommendation
      - STAGE_CHANGED: Stage → Engagement → Overall → Recommendation
      - DAILY_REFRESH: Full recomputation (decay, missed events)
    """
    LEAD_CREATED = "lead_created"
    LEAD_UPDATED = "lead_updated"
    INBOUND_EMAIL = "inbound_email"
    STAGE_CHANGED = "deal_stage_changed"
    DAILY_REFRESH = "daily_refresh"


# ── What each event computes ─────────────────────────────────────────
# True = recompute, False = skip

EVENT_COMPUTATION = {
    AssessmentEvent.LEAD_CREATED: {
        "fit": True,
        "engagement": False,       # No emails yet
        "overall": True,
        "recommendation": False,   # No engagement data yet
    },
    AssessmentEvent.LEAD_UPDATED: {
        "fit": True,
        "engagement": False,       # Lead data doesn't affect engagement
        "overall": True,
        "recommendation": False,
    },
    AssessmentEvent.INBOUND_EMAIL: {
        "fit": False,              # Emails don't affect fit
        "engagement": True,        # Intent changed
        "overall": True,
        "recommendation": True,
    },
    AssessmentEvent.STAGE_CHANGED: {
        "fit": False,              # Stage doesn't affect fit
        "engagement": True,        # Stage score changed
        "overall": True,
        "recommendation": True,
    },
    AssessmentEvent.DAILY_REFRESH: {
        "fit": True,               # Full recompute
        "engagement": True,        # Decay may have changed
        "overall": True,
        "recommendation": True,
    },
}
