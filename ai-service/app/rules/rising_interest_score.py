"""
Rising Interest Score Engine

Computes a dynamic 0-100 score from engagement *trends* (velocity), not
absolute values.  Replaces the previous hardcoded cutoff (lead_score >= 80).

Score Formula (0-100):
    Rising Interest = w1*activity_velocity
                    + w2*email_engagement_trend
                    + w3*response_time_improvement
                    + w4*meeting_momentum
                    + w5*stage_progression
                    + w6*recency_amplifier

This module is PURE — no database access, no API calls.
Input comes from the backend (gathered from CRM tables) and is sent
over HTTP to the AI service.

Usage:
    from app.rules.rising_interest_score import calculate_rising_interest

    result = calculate_rising_interest({
        "activity_count_recent": 6,
        "activity_count_prior": 1,
        ...
    })
    # result["score"] -> 91.0
    # result["trend"] -> "Surging"
    # result["reasons"] -> ["Activity up 1->6 ...", ...]
"""

from __future__ import annotations

import math
from typing import Any

# ── Weights (single source of truth) ─────────────────────────────────────────

RISING_INTEREST_WEIGHTS: dict[str, float] = {
    "activity_velocity":         0.25,
    "email_engagement_trend":    0.20,
    "response_time_improvement": 0.15,
    "meeting_momentum":          0.15,
    "stage_progression":         0.15,
    "recency_amplifier":         0.10,
}

TREND_SURGING   = "Surging"
TREND_RISING    = "Rising"
TREND_STABLE    = "Stable"
TREND_DECLINING = "Declining"


# ── Factor calculators (each returns 0-100) ──────────────────────────────────

def _activity_velocity_score(d: dict[str, Any]) -> float:
    recent = d.get("activity_count_recent", 0)
    prior  = d.get("activity_count_prior", 0)
    if prior == 0 and recent == 0:
        return 0.0
    if prior == 0:
        return min(recent / 5.0 * 100, 100.0)
    if recent == 0:
        return 0.0
    ratio = recent / prior
    return max(0.0, min(math.log(ratio + 0.5) / math.log(3.5) * 100, 100.0))


def _email_engagement_trend_score(d: dict[str, Any]) -> float:
    opens_r, opens_p   = d.get("email_opens_recent", 0), d.get("email_opens_prior", 0)
    replies_r, replies_p = d.get("email_replies_recent", 0), d.get("email_replies_prior", 0)
    total_r, total_p = opens_r + replies_r, opens_p + replies_p
    if total_p == 0 and total_r == 0:
        return 0.0
    if total_p == 0:
        return min(total_r / 5.0 * 100, 100.0)
    if total_r == 0:
        return 0.0
    ratio = total_r / total_p
    boost = min((replies_r - replies_p) * 10, 20.0) if replies_r > replies_p else 0.0
    return max(0.0, min(math.log(ratio + 0.5) / math.log(3.5) * 100 + boost, 100.0))


def _response_time_improvement_score(d: dict[str, Any]) -> float:
    recent = d.get("avg_response_time_recent_hours")
    prior  = d.get("avg_response_time_prior_hours")
    if recent is None and prior is None:
        return 25.0
    if prior is None and recent is not None:
        return 70.0 if recent <= 2 else (50.0 if recent <= 24 else 30.0)
    if recent is None and prior is not None:
        return 10.0
    if recent == 0 or prior == 0:
        return 50.0
    ratio = prior / recent
    if ratio >= 3.0:  return 100.0
    if ratio >= 2.0:  return 85.0
    if ratio >= 1.2:  return 65.0
    if ratio >= 0.8:  return 40.0
    return 15.0


def _meeting_momentum_score(d: dict[str, Any]) -> float:
    attended  = d.get("meetings_attended_recent", 0)
    scheduled = d.get("meetings_scheduled_recent", 0)
    no_show   = d.get("meeting_no_show_recent", 0)
    if scheduled == 0 and attended == 0:
        return 30.0
    base = min(attended * 35, 70.0) + min(scheduled * 15, 30.0) - min(no_show * 20, 30.0)
    return max(0.0, min(base, 100.0))


def _stage_progression_score(d: dict[str, Any]) -> float:
    changed  = d.get("stage_changed_recently", False)
    forward  = d.get("stage_forward_progress", False)
    dwell    = d.get("days_in_current_stage", 0)
    if changed and forward:
        return 90.0
    if changed and not forward:
        return 10.0
    if dwell <= 7:   return 50.0
    if dwell <= 14:  return 35.0
    if dwell <= 30:  return 20.0
    return 5.0


def _recency_amplifier_score(d: dict[str, Any]) -> float:
    days = d.get("days_since_last_activity", 999)
    if days <= 1:   return 100.0
    if days <= 3:   return 85.0
    if days <= 7:   return 60.0
    if days <= 14:  return 35.0
    if days <= 30:  return 15.0
    return 0.0


_FACTOR_CALCULATORS = {
    "activity_velocity":         _activity_velocity_score,
    "email_engagement_trend":    _email_engagement_trend_score,
    "response_time_improvement": _response_time_improvement_score,
    "meeting_momentum":          _meeting_momentum_score,
    "stage_progression":         _stage_progression_score,
    "recency_amplifier":         _recency_amplifier_score,
}


# ── Reason generator ─────────────────────────────────────────────────────────

def _generate_reasons(d: dict[str, Any], factors: dict[str, float]) -> list[str]:
    reasons: list[str] = []

    av = factors["activity_velocity"]
    if av >= 60:
        reasons.append(
            f"Activity up {d.get('activity_count_prior', 0)}->{d.get('activity_count_recent', 0)} "
            f"interactions in the last 7 days — engagement is accelerating."
        )
    elif av <= 20 and d.get("activity_count_prior", 0) > 0:
        reasons.append(
            f"Activity dropped {d.get('activity_count_prior', 0)}->{d.get('activity_count_recent', 0)} "
            f"— engagement is decelerating."
        )

    ee = factors["email_engagement_trend"]
    tr = (d.get("email_opens_recent", 0) or 0) + (d.get("email_replies_recent", 0) or 0)
    tp = (d.get("email_opens_prior", 0) or 0) + (d.get("email_replies_prior", 0) or 0)
    if ee >= 60:
        reasons.append(
            f"Email engagement rising ({tp}->{tr} opens+replies) — "
            f"including {d.get('email_replies_recent', 0)} reply/replies."
        )
    elif ee <= 20 and tp > 0:
        reasons.append(f"Email engagement declining ({tp}->{tr}) — lead is less responsive.")

    rt = factors["response_time_improvement"]
    rtr = d.get("avg_response_time_recent_hours")
    rtp = d.get("avg_response_time_prior_hours")
    if rt >= 65 and rtr is not None:
        if rtp is not None:
            reasons.append(f"Response time improved from {rtp:.1f}h to {rtr:.1f}h — replying faster.")
        else:
            reasons.append(f"Lead responded within {rtr:.1f}h recently — faster than expected.")

    mm = factors["meeting_momentum"]
    if mm >= 60:
        parts = []
        if d.get("meetings_attended_recent", 0):
            parts.append(f"{d['meetings_attended_recent']} attended")
        if d.get("meetings_scheduled_recent", 0):
            parts.append(f"{d['meetings_scheduled_recent']} scheduled")
        reasons.append(f"Meeting momentum strong ({', '.join(parts)}) — actively engaging.")
    elif d.get("meeting_no_show_recent", 0) > 0:
        reasons.append(f"{d['meeting_no_show_recent']} no-show(s) — engagement wavering.")

    sp = factors["stage_progression"]
    if sp >= 80:
        reasons.append("Pipeline stage advanced recently — deal is moving forward.")
    elif sp <= 20 and d.get("days_in_current_stage", 0) > 30:
        reasons.append(f"Stuck in current stage for {d['days_in_current_stage']} days — stagnating.")

    days = d.get("days_since_last_activity", 999)
    if days <= 1:
        reasons.append("Last activity within 24 hours — momentum is current.")
    elif days > 14:
        reasons.append(f"No activity for {days} days — trend signals may be stale.")

    if not reasons:
        reasons.append("Engagement signals are neutral — no strong rising or declining trend.")
    return reasons[:4]


# ── Main entry point ─────────────────────────────────────────────────────────

def calculate_rising_interest(data: dict[str, Any]) -> dict[str, Any]:
    """
    Calculate a dynamic rising-interest score from CRM activity trends.

    Args:
        data: dict with keys:
            activity_count_recent, activity_count_prior,
            email_opens_recent, email_opens_prior,
            email_replies_recent, email_replies_prior,
            avg_response_time_recent_hours, avg_response_time_prior_hours,
            meetings_attended_recent, meetings_scheduled_recent, meeting_no_show_recent,
            stage_changed_recently, days_in_current_stage, stage_forward_progress,
            days_since_last_activity

    Returns:
        dict with: score (float 0-100), trend (str), factors (dict), reasons (list[str])
    """
    factors: dict[str, float] = {}
    for name, calc in _FACTOR_CALCULATORS.items():
        factors[name] = round(calc(data), 2)

    total = sum(factors[n] * RISING_INTEREST_WEIGHTS[n] for n in RISING_INTEREST_WEIGHTS)
    total = max(0.0, min(100.0, round(total, 2)))

    if total >= 75:   trend = TREND_SURGING
    elif total >= 50: trend = TREND_RISING
    elif total >= 25: trend = TREND_STABLE
    else:             trend = TREND_DECLINING

    return {
        "lead_id": data.get("lead_id"),
        "score": total,
        "trend": trend,
        "factors": factors,
        "reasons": _generate_reasons(data, factors),
    }


def is_rising_interest(data: dict[str, Any]) -> bool:
    """Quick boolean — is this lead showing rising interest (score >= 50)?"""
    return calculate_rising_interest(data)["score"] >= 50.0
