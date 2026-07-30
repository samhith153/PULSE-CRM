"""
test_engine.py

Basic tests for the rule-based recommendation engine.
Run with: pytest
"""

import pytest

from app.engine import recommend, score_candidates
from app.models import LeadFeatures


def make_features(**overrides) -> LeadFeatures:
    defaults = dict(
        lead_id="lead_test",
        current_score=62,
        current_stage="Contacted",
        days_since_last_activity=6,
        reply_received=False,
    )
    defaults.update(overrides)
    return LeadFeatures(**defaults)


def test_stale_lead_gets_follow_up_or_stale():
    """A lead untouched for a while, no reply, should trend toward follow-up/stale."""
    features = make_features(days_since_last_activity=10, current_score=40)
    result = recommend(features)
    assert result.recommended_action in {"Send follow-up", "Mark as stale"}
    assert "days" in result.reason or "score" in result.reason


def test_high_score_fresh_lead_gets_demo():
    """A strong, fresh lead in Qualified stage should lean toward scheduling a demo."""
    features = make_features(current_stage="Qualified", current_score=90, days_since_last_activity=1)
    result = recommend(features)
    assert result.recommended_action == "Schedule demo"


def test_negotiation_stage_only_offers_valid_actions():
    """Negotiation stage should never suggest 'Send follow-up' (not a valid candidate)."""
    features = make_features(current_stage="Negotiation", current_score=70, days_since_last_activity=2)
    candidates = score_candidates(features)
    action_names = {c.action for c in candidates}
    assert "Send follow-up" not in action_names
    assert action_names.issubset({"Send proposal", "Escalate to manager"})


def test_every_recommendation_has_a_reason():
    """Enforces the 'no black-box' principle — reason must never be empty."""
    features = make_features()
    result = recommend(features)
    assert result.reason and len(result.reason) > 10


def test_invalid_stage_raises():
    """A stage with no defined action rules should fail loudly, not silently guess."""
    features = make_features(current_stage="Nonexistent Stage")
    with pytest.raises(ValueError):
        recommend(features)
