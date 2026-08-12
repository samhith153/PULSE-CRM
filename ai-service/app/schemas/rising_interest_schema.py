"""
Rising Interest request/response schemas.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class RisingInterestRequest(BaseModel):
    """Raw activity trend data — the AI service computes the score internally."""

    lead_id: str = Field(..., min_length=1)

    # ── Activity velocity ──────────────────────────────────────────────
    activity_count_recent: int = 0
    activity_count_prior: int = 0

    # ── Email engagement trend ─────────────────────────────────────────
    email_opens_recent: int = 0
    email_opens_prior: int = 0
    email_replies_recent: int = 0
    email_replies_prior: int = 0

    # ── Response time improvement ─────────────────────────────────────
    avg_response_time_recent_hours: Optional[float] = None
    avg_response_time_prior_hours: Optional[float] = None

    # ── Meeting momentum ───────────────────────────────────────────────
    meetings_attended_recent: int = 0
    meetings_scheduled_recent: int = 0
    meeting_no_show_recent: int = 0

    # ── Stage progression ──────────────────────────────────────────────
    stage_changed_recently: bool = False
    days_in_current_stage: int = 0
    stage_forward_progress: bool = False

    # ── Recency ────────────────────────────────────────────────────────
    days_since_last_activity: int = 999


class RisingInterestFactorItem(BaseModel):
    """Individual factor score breakdown for transparency."""
    activity_velocity: float
    email_engagement_trend: float
    response_time_improvement: float
    meeting_momentum: float
    stage_progression: float
    recency_amplifier: float


class RisingInterestResult(BaseModel):
    """Single lead's rising interest score with explanation."""
    lead_id: Optional[str] = None
    score: float
    trend: str                           # Surging | Rising | Stable | Declining
    factors: Dict[str, float] = Field(default_factory=dict)
    reasons: List[str] = Field(default_factory=list)


class BatchRisingInterestRequest(BaseModel):
    """Batch request for multiple leads."""
    leads: List[RisingInterestRequest] = Field(..., min_length=1, max_length=100)


class BatchRisingInterestResponse(BaseModel):
    """Batch response keyed by lead_id."""
    results: Dict[str, RisingInterestResult] = Field(default_factory=dict)
