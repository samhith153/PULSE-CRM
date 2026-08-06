"""Feature service.

Thin orchestration layer over ``app.rules.feature_rules``. All raw-data to
feature conversion rules live in the rules module; this service exists to keep
a stable import surface for callers and to host future workflow logic.
"""
from __future__ import annotations

from app.rules.feature_rules import (
    DEAL_STAGE_TO_ENGINE_STAGE,
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

__all__ = [
    "STAGE_MAP",
    "TERMINAL_STAGES",
    "DEAL_STAGE_TO_ENGINE_STAGE",
    "compute_email_features",
    "compute_urgency",
    "compute_contact_time",
    "compute_meeting_attendance",
    "get_stage",
    "is_terminal",
    "build_lead_features",
]
