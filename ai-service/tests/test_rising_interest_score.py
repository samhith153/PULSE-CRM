"""
Unit tests for the Rising Interest Score Engine (ai-service).

Validates that:
- Score changes when underlying CRM activity changes
- Different scenarios produce expected trend labels
- Factor scores are computed correctly
- Reasons are generated and readable
- Edge cases (no data, all-zero, saturated) are handled
"""

import sys
import os
import pytest

# Add the ai-service root to path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from app.rules.rising_interest_score import (
    calculate_rising_interest,
    is_rising_interest,
    RISING_INTEREST_WEIGHTS,
    TREND_SURGING,
    TREND_RISING,
    TREND_STABLE,
    TREND_DECLINING,
)


def _make_data(**kwargs) -> dict:
    """Create trend data with sensible defaults, overridden by kwargs."""
    defaults = dict(
        lead_id="test-lead",
        activity_count_recent=3,
        activity_count_prior=2,
        email_opens_recent=1,
        email_opens_prior=0,
        email_replies_recent=0,
        email_replies_prior=0,
        avg_response_time_recent_hours=None,
        avg_response_time_prior_hours=None,
        meetings_attended_recent=0,
        meetings_scheduled_recent=0,
        meeting_no_show_recent=0,
        stage_changed_recently=False,
        days_in_current_stage=10,
        stage_forward_progress=False,
        days_since_last_activity=3,
    )
    defaults.update(kwargs)
    return defaults


# ── 1. Score changes when activity changes ──────────────────────────────────

class TestScoreReactivity:

    def test_increasing_activity_raises_score(self):
        rising = _make_data(activity_count_recent=4, activity_count_prior=2)
        flat = _make_data(activity_count_recent=2, activity_count_prior=2)
        assert calculate_rising_interest(rising)["score"] > calculate_rising_interest(flat)["score"]

    def test_decreasing_activity_lowers_score(self):
        declining = _make_data(activity_count_recent=1, activity_count_prior=4)
        flat = _make_data(activity_count_recent=2, activity_count_prior=2)
        assert calculate_rising_interest(declining)["score"] < calculate_rising_interest(flat)["score"]

    def test_email_replies_increase_score(self):
        without = _make_data(email_replies_recent=0, email_opens_recent=1, email_opens_prior=1)
        with_replies = _make_data(email_replies_recent=2, email_opens_recent=3, email_opens_prior=1)
        assert calculate_rising_interest(with_replies)["score"] > calculate_rising_interest(without)["score"]

    def test_faster_response_time_increases_score(self):
        slow = _make_data(avg_response_time_recent_hours=48.0, avg_response_time_prior_hours=24.0)
        fast = _make_data(avg_response_time_recent_hours=2.0, avg_response_time_prior_hours=24.0)
        assert calculate_rising_interest(fast)["score"] > calculate_rising_interest(slow)["score"]

    def test_meeting_attended_increases_score(self):
        no_meeting = _make_data(meetings_attended_recent=0)
        with_meeting = _make_data(meetings_attended_recent=1)
        assert calculate_rising_interest(with_meeting)["score"] > calculate_rising_interest(no_meeting)["score"]

    def test_stage_advancement_increases_score(self):
        stagnant = _make_data(stage_changed_recently=False, days_in_current_stage=30)
        advanced = _make_data(stage_changed_recently=True, stage_forward_progress=True, days_in_current_stage=2)
        assert calculate_rising_interest(advanced)["score"] > calculate_rising_interest(stagnant)["score"]


# ── 2. Trend labels are correct ──────────────────────────────────────────────

class TestTrendLabels:

    def test_surging_lead(self):
        data = _make_data(
            activity_count_recent=8, activity_count_prior=1,
            email_opens_recent=4, email_opens_prior=0,
            email_replies_recent=2, email_replies_prior=0,
            avg_response_time_recent_hours=3.0, avg_response_time_prior_hours=24.0,
            meetings_attended_recent=1,
            stage_changed_recently=True, stage_forward_progress=True,
            days_in_current_stage=2, days_since_last_activity=1,
        )
        result = calculate_rising_interest(data)
        assert result["trend"] == TREND_SURGING
        assert result["score"] >= 75

    def test_declining_lead(self):
        data = _make_data(
            activity_count_recent=0, activity_count_prior=4,
            email_opens_recent=0, email_opens_prior=2,
            meetings_attended_recent=0,
            stage_changed_recently=False, days_in_current_stage=45,
            days_since_last_activity=30,
        )
        result = calculate_rising_interest(data)
        assert result["trend"] == TREND_DECLINING
        assert result["score"] < 25

    def test_stable_lead(self):
        data = _make_data(
            activity_count_recent=3, activity_count_prior=3,
            email_opens_recent=1, email_opens_prior=1,
            stage_changed_recently=False, days_in_current_stage=10,
            days_since_last_activity=5,
        )
        result = calculate_rising_interest(data)
        assert result["trend"] == TREND_STABLE
        assert 25 <= result["score"] < 50


# ── 3. Factor scores ─────────────────────────────────────────────────────────

class TestFactorScores:

    def test_all_factors_present(self):
        result = calculate_rising_interest(_make_data())
        expected = {
            "activity_velocity", "email_engagement_trend",
            "response_time_improvement", "meeting_momentum",
            "stage_progression", "recency_amplifier",
        }
        assert set(result["factors"].keys()) == expected

    def test_factor_scores_in_range(self):
        result = calculate_rising_interest(_make_data())
        for name, score in result["factors"].items():
            assert 0 <= score <= 100, f"Factor {name} score {score} out of range"

    def test_weights_sum_to_one(self):
        total = sum(RISING_INTEREST_WEIGHTS.values())
        assert abs(total - 1.0) < 0.01


# ── 4. Reasons ───────────────────────────────────────────────────────────────

class TestReasons:

    def test_reasons_are_generated(self):
        assert len(calculate_rising_interest(_make_data())["reasons"]) >= 1

    def test_reasons_are_strings(self):
        for reason in calculate_rising_interest(_make_data())["reasons"]:
            assert isinstance(reason, str) and len(reason) > 10

    def test_surging_lead_has_multiple_reasons(self):
        data = _make_data(
            activity_count_recent=8, activity_count_prior=1,
            email_opens_recent=4, email_replies_recent=2,
            avg_response_time_recent_hours=3.0, avg_response_time_prior_hours=24.0,
            meetings_attended_recent=1,
            stage_changed_recently=True, stage_forward_progress=True,
            days_in_current_stage=2, days_since_last_activity=1,
        )
        assert len(calculate_rising_interest(data)["reasons"]) >= 3

    def test_neutral_lead_has_fallback_reason(self):
        data = _make_data(
            activity_count_recent=0, activity_count_prior=0,
            email_opens_recent=0, email_opens_prior=0,
            email_replies_recent=0, email_replies_prior=0,
            meetings_attended_recent=0, meetings_scheduled_recent=0,
            stage_changed_recently=False, days_in_current_stage=5,
            days_since_last_activity=5,
        )
        result = calculate_rising_interest(data)
        assert len(result["reasons"]) >= 1
        assert "neutral" in result["reasons"][0].lower()


# ── 5. Edge cases ─────────────────────────────────────────────────────────────

class TestEdgeCases:

    def test_zero_everything(self):
        result = calculate_rising_interest({"lead_id": "empty"})
        assert 0 <= result["score"] < 30

    def test_no_prior_activity_but_recent(self):
        data = _make_data(activity_count_recent=3, activity_count_prior=0, email_opens_recent=2)
        assert calculate_rising_interest(data)["score"] > 30

    def test_no_recent_activity_but_prior(self):
        data = _make_data(activity_count_recent=0, activity_count_prior=3, days_since_last_activity=15)
        assert calculate_rising_interest(data)["score"] < 25

    def test_is_rising_interest_boolean(self):
        rising = _make_data(
            activity_count_recent=6, activity_count_prior=1,
            email_opens_recent=3, email_replies_recent=1,
            meetings_attended_recent=1, days_since_last_activity=1,
        )
        assert is_rising_interest(rising) is True

        declining = _make_data(activity_count_recent=0, activity_count_prior=3, days_since_last_activity=30)
        assert is_rising_interest(declining) is False

    def test_no_show_reduces_score(self):
        clean = calculate_rising_interest(_make_data(meetings_attended_recent=1, meeting_no_show_recent=0))
        no_show = calculate_rising_interest(_make_data(meetings_attended_recent=1, meeting_no_show_recent=1))
        assert no_show["factors"]["meeting_momentum"] < clean["factors"]["meeting_momentum"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
