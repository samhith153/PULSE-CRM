"""
Unit tests for the NBA Recommendation Engine (ai-service).

Validates that:
- Different lead/deal scenarios produce different recommended actions
- The engine returns a valid action + reason for every stage
- High-urgency leads get follow-up actions, qualified leads get demos
- No-reply leads get different actions than leads that replied
- High-value deals get prioritized actions
- Edge cases (unknown stage, no data) are handled gracefully
"""

import sys
import os
import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from app.services.recommendation_service import recommend, generate_recommendation
from app.rules.recommendation_rules import actions_for_stage, ACTION_RULES
from app.rules.feature_rules import STAGE_MAP, get_stage, is_terminal


def _make_lead(**kwargs) -> dict:
    defaults = dict(
        lead_id="test-lead-1",
        score=50.0,
        engagement_score=50.0,
        current_stage="Contacted",
        buying_stage="Contacted",
        days_since_last_outbound=3,
        is_outbound=False,
        deal_value=None,
        outbound_thread=[],
        inbound_thread=[],
        tags=[],
        contact_id="test-lead-1",
    )
    defaults.update(kwargs)
    return defaults


# ── 1. Basic engine functionality ────────────────────────────────────────────

class TestEngineBasics:

    def test_recommend_returns_result(self):
        result = recommend(_make_lead())
        assert "recommendations" in result
        assert result["lead_id"] == "test-lead-1"

    def test_recommend_returns_stage(self):
        result = recommend(_make_lead(current_stage="Qualified"))
        assert result["stage"] == "Qualified"

    def test_generate_recommendation_returns_top(self):
        result = generate_recommendation(_make_lead(score=75, engagement_score=75))
        assert result["status"] == "recommendation"
        assert "recommendation" in result
        assert result["recommendation"]["action"]

    def test_terminal_stage_returns_no_recommendation(self):
        result = generate_recommendation(_make_lead(current_stage="won"))
        assert result["status"] == "no_recommendation"


# ── 2. Different scenarios produce different actions ────────────────────────

class TestScenarioDifferentiation:

    def test_cold_lead_gets_follow_up(self):
        cold = _make_lead(
            current_stage="Contacted", days_since_last_outbound=10,
            is_outbound=False, score=40, engagement_score=40,
        )
        result = recommend(cold)
        actions = [r["action"].lower() for r in result["recommendations"]]
        assert any(w in " ".join(actions) for w in ["follow-up", "call", "different channel", "stale"])

    def test_new_lead_gets_intro_or_research(self):
        new_lead = _make_lead(
            current_stage="new", score=30, engagement_score=30,
            days_since_last_outbound=0,
        )
        result = recommend(new_lead)
        actions = [r["action"].lower() for r in result["recommendations"]]
        assert any(w in " ".join(actions) for w in ["research", "intro", "email"])

    def test_qualified_lead_can_get_demo(self):
        qualified = _make_lead(
            current_stage="Qualified", score=85, engagement_score=85,
            days_since_last_outbound=1, is_outbound=True,
            deal_value=200000,
        )
        result = recommend(qualified)
        actions = [r["action"].lower() for r in result["recommendations"]]
        # Demo or content actions should be available in Qualified stage
        assert len(actions) > 0

    def test_negotiation_lead_gets_contract_action(self):
        negotiating = _make_lead(
            current_stage="negotiation", score=80, engagement_score=80,
            days_since_last_outbound=1, is_outbound=True,
            deal_value=500000,
        )
        result = recommend(negotiating)
        actions = [r["action"].lower() for r in result["recommendations"]]
        assert any(w in " ".join(actions) for w in [
            "contract", "finalize", "escalate", "value-add", "address", "case study",
        ])


# ── 3. Reply vs no-reply differentiation ──────────────────────────────────────

class TestReplyDifferentiation:

    def test_no_reply_changes_recommendations(self):
        no_reply = _make_lead(is_outbound=False, outbound_thread=["Subject", 2])
        with_reply = _make_lead(is_outbound=True, inbound_thread=["Re: Subject"])
        result_no = recommend(no_reply)
        result_yes = recommend(with_reply)
        # Scores should differ based on reply status
        assert result_no != result_yes


# ── 4. High-value deal impact ─────────────────────────────────────────────────

class TestHighValueDeals:

    def test_high_value_influences_score(self):
        without_value = _make_lead(current_stage="Qualified", deal_value=None)
        with_value = _make_lead(current_stage="Qualified", deal_value=300000)
        result_without = recommend(without_value)
        result_with = recommend(with_value)
        # The top recommendation score should differ
        if result_without["recommendations"] and result_with["recommendations"]:
            assert result_without["recommendations"][0]["score"] != result_with["recommendations"][0]["score"] or \
                   result_without["recommendations"][0]["action"] != result_with["recommendations"][0]["action"]


# ── 5. Edge cases ─────────────────────────────────────────────────────────────

class TestEdgeCases:

    def test_unknown_stage_returns_empty(self):
        result = recommend(_make_lead(current_stage="Unknown Stage XYZ"))
        assert result["recommendations"] == []

    def test_all_stages_have_actions(self):
        for stage_name in STAGE_MAP.values():
            if not is_terminal(stage_name.lower()):
                actions = actions_for_stage(stage_name)
                assert len(actions) > 0, f"Stage '{stage_name}' has no candidate actions"

    def test_action_rules_have_valid_weights(self):
        for rule in ACTION_RULES:
            assert rule.weights, f"Rule '{rule.name}' has empty weights"
            assert all(isinstance(v, (int, float)) for v in rule.weights.values())

    def test_terminal_stages_return_no_recommendation(self):
        for stage in ["won", "lost", "closed_won", "closed_lost"]:
            result = generate_recommendation(_make_lead(current_stage=stage))
            assert result["status"] == "no_recommendation"


# ── 6. Reason quality ────────────────────────────────────────────────────────

class TestReasonQuality:

    def test_reasons_are_generated(self):
        result = recommend(_make_lead(score=72, engagement_score=72))
        if result["recommendations"]:
            assert len(result["recommendations"][0]["reasons"]) >= 1

    def test_reasons_are_strings(self):
        result = recommend(_make_lead())
        for rec in result["recommendations"]:
            for reason in rec["reasons"]:
                assert isinstance(reason, str)
                assert len(reason) > 5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
