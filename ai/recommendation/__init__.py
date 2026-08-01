"""
ai.recommendation — Next-Best-Action recommendation engine.

Public API:
    build_lead_features(lead, deal, emails, activities, rep_active_count) → LeadFeatures
    generate_recommendation(lead_dict) → dict
    STAGE_MAP, TERMINAL_STAGES

Usage from backend:
    from ai.recommendation import build_lead_features, generate_recommendation, is_terminal
"""

from ai.recommendation.feature_computer import (
    STAGE_MAP,
    TERMINAL_STAGES,
    build_lead_features,
    compute_contact_time,
    compute_email_features,
    compute_meeting_attendance,
    compute_urgency,
    get_stage,
    is_terminal,
)
from ai.recommendation.ai_recommendation_engine_enhanced import generate_recommendation

__all__ = [
    "build_lead_features",
    "generate_recommendation",
    "STAGE_MAP",
    "TERMINAL_STAGES",
    "get_stage",
    "is_terminal",
    "compute_email_features",
    "compute_urgency",
    "compute_contact_time",
    "compute_meeting_attendance",
]
