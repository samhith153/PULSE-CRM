"""
models.py

Request/response shapes for the Recommendation Engine API.
Matches the sample JSON in the PULSE Recommendation module requirements doc.
"""

from typing import Optional

from pydantic import BaseModel, Field


class LeadFeatures(BaseModel):
    """Input features needed to generate a recommendation for one lead."""

    lead_id: str
    current_score: int = Field(ge=0, le=100)
    current_stage: str
    days_since_last_activity: int = Field(ge=0)
    reply_received: bool

    # New features for extended recommendation engine
    deal_value: Optional[float] = None
    email_open_count: int = 0
    email_opened_no_reply_flag: bool = False
    meeting_attendance_status: Optional[str] = None
    rep_active_action_count: int = 0
    best_contact_time_slot: Optional[str] = None


class RecommendationResult(BaseModel):
    """A single scored candidate action, before picking the winner."""

    action: str
    weight: float
    top_factor: str  # which factor ("score" | "urgency" | "reply status" | etc.) drove this weight

    model_config = {"extra": "allow"}


class RecommendationResponse(BaseModel):
    """Final API response: the winning action + human-readable reason."""

    lead_id: str
    recommended_action: str
    reason: str
    current_score: int
    current_stage: str
    all_candidates: list[RecommendationResult]

    # New response fields
    deal_value: Optional[float] = None
    email_open_count: int = 0
    email_opened_no_reply_flag: bool = False
    meeting_attendance_status: Optional[str] = None
    rep_active_action_count: int = 0
    best_contact_time_slot: Optional[str] = None
