"""
models.py

Request/response shapes for the Recommendation Engine API.
Matches the sample JSON in the PULSE Recommendation module requirements doc.
"""

from pydantic import BaseModel, Field


class LeadFeatures(BaseModel):
    """Input features needed to generate a recommendation for one lead."""

    lead_id: str
    current_score: int = Field(ge=0, le=100)
    current_stage: str
    days_since_last_activity: int = Field(ge=0)
    reply_received: bool


class RecommendationResult(BaseModel):
    """A single scored candidate action, before picking the winner."""

    action: str
    weight: float
    top_factor: str  # which factor ("score" | "urgency" | "reply status") drove this weight


class RecommendationResponse(BaseModel):
    """Final API response: the winning action + human-readable reason."""

    lead_id: str
    recommended_action: str
    reason: str
    current_score: int
    current_stage: str
    all_candidates: list[RecommendationResult]
