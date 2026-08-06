"""
models.py

Data classes for the Recommendation Engine.
These define the input and output shapes that the engine expects/returns.
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class LeadFeatures:
    """
    Input: All the lead data needed to generate a recommendation.

    This is what you pass to the recommend() function.
    """

    lead_id: str
    current_score: float  # 0-100, from lead_score
    current_stage: str  # "Contacted", "Qualified", "Demo Scheduled", etc.

    # Engagement metrics
    days_since_last_activity: int  # 0 = today, 7 = week ago
    reply_received: bool  # Did customer reply to last email?

    # Optional factors (can be None)
    deal_value: Optional[float] = None  # Dollar amount
    email_open_count: Optional[int] = None  # How many outbound emails were read?
    email_opened_no_reply_flag: Optional[bool] = None  # Opened but no reply?
    meeting_attendance_status: Optional[str] = None  # "ATTENDED", "NO_SHOW", "RESCHEDULED"
    rep_active_action_count: Optional[int] = None  # How many tasks this rep has?
    best_contact_time_slot: Optional[str] = None  # "10:00-12:00", "14:00-16:00", etc.
    engagement_velocity: Optional[float] = None  # -1.0 to 1.0: declining to increasing engagement

    # Email direction counts (for reason building)
    outbound_email_count: int = 0
    inbound_email_count: int = 0


@dataclass
class RecommendationResult:
    """
    One candidate action with its score and reason.
    """

    action: str  # "Send follow-up", "Schedule demo", etc.
    weight: float  # 0-1 score
    top_factor: str  # Which factor contributed most? "urgency", "score", etc.


@dataclass
class RecommendationResponse:
    """
    Output: The complete recommendation response.

    This is what the recommend() function returns.
    """

    lead_id: str
    recommended_action: str  # The winning action
    reason: str  # Plain English explanation
    current_score: float  # Lead's score (for context)
    current_stage: str  # Lead's pipeline stage (for context)
    all_candidates: list[RecommendationResult]  # All actions scored, ranked

    # Optional context fields (same as input)
    deal_value: Optional[float] = None
    email_open_count: Optional[int] = None
    email_opened_no_reply_flag: Optional[bool] = None
    meeting_attendance_status: Optional[str] = None
    rep_active_action_count: Optional[int] = None
    best_contact_time_slot: Optional[str] = None
    engagement_velocity: Optional[float] = None
