"""
engine.py

Core rule-based logic for the Recommendation / Next-Best-Action module.

    weight(action) = w_s * score_norm + w_u * urgency + w_r * reply_factor
                   + w_dv * deal_value_norm + w_eo * email_open_norm
                   + w_mt * meeting_factor + w_rw * rep_workload_norm
                   + w_ct * contact_time_factor

    recommended_action = argmax( weight(action) )  over all actions valid
                          for the lead's current pipeline stage

The winning action's reason is generated from whichever single factor
contributed the most to its weight — so the explanation is read directly
off the math, never invented. This satisfies PULSE's "no black-box
scores or recommendations" design principle.
"""

from .models import LeadFeatures, RecommendationResponse, RecommendationResult
from .rules import actions_for_stage


def _normalize_inputs(features: LeadFeatures) -> dict[str, float]:
    """Convert raw features into the 0-1 normalized values the formula uses."""
    score_norm = features.current_score / 100
    urgency = min(features.days_since_last_activity / 7, 1.0)
    reply_factor = 1.0 if features.reply_received else 0.0

    # New feature normalizations
    deal_value_norm = 0.0
    if features.deal_value is not None and features.deal_value > 0:
        # Normalize: values up to $500k map to 0-1, beyond that saturates
        deal_value_norm = min(features.deal_value / 500000, 1.0)

    email_open_norm = min(features.email_open_count / 10, 1.0)  # 10+ opens = max engagement

    # Meeting attendance factor
    meeting_factor = 0.0
    if features.meeting_attendance_status == "ATTENDED":
        meeting_factor = 1.0
    elif features.meeting_attendance_status == "NO_SHOW":
        meeting_factor = 0.3
    elif features.meeting_attendance_status == "RESCHEDULED":
        meeting_factor = 0.5

    # Rep workload: inverse - more active actions means rep is busier
    rep_workload_norm = min(features.rep_active_action_count / 20, 1.0)

    # Contact time factor: preference for 10:00-12:00 and 14:00-16:00
    contact_time_factor = 0.0
    if features.best_contact_time_slot:
        preferred_slots = {"10:00-12:00": 1.0, "14:00-16:00": 0.9, "08:00-10:00": 0.7, "16:00-18:00": 0.5}
        contact_time_factor = preferred_slots.get(features.best_contact_time_slot, 0.5)

    return {
        "s": score_norm,
        "u": urgency,
        "r": reply_factor,
        "dv": deal_value_norm,
        "eo": email_open_norm,
        "mt": meeting_factor,
        "rw": rep_workload_norm,
        "ct": contact_time_factor,
    }


def _get_factor_value(normalized: dict[str, float], key: str, invert: bool) -> float:
    """Get the factor value, optionally inverted."""
    val = normalized.get(key, 0.0)
    return (1 - val) if invert else val


FACTOR_LABELS: dict[str, str] = {
    "s": "score",
    "u": "urgency",
    "r": "reply status",
    "dv": "deal value",
    "eo": "email engagement",
    "mt": "meeting attendance",
    "rw": "rep workload",
    "ct": "contact time",
}


def score_candidates(features: LeadFeatures) -> list[RecommendationResult]:
    """Score every action valid for this lead's stage, sorted best-first."""
    normalized = _normalize_inputs(features)
    candidates = actions_for_stage(features.current_stage)

    results: list[RecommendationResult] = []
    for rule in candidates:
        weight = 0.0
        top_factor = ""
        top_contribution = -1.0

        for key in rule.weights:
            invert = getattr(rule, f"invert_{key}", False)
            val = _get_factor_value(normalized, key, invert)
            contribution = rule.weights[key] * val
            weight += contribution
            if contribution > top_contribution:
                top_contribution = contribution
                top_factor = FACTOR_LABELS.get(key, key)

        results.append(
            RecommendationResult(action=rule.name, weight=round(weight, 4), top_factor=top_factor)
        )

    results.sort(key=lambda r: r.weight, reverse=True)
    return results


def _build_reason(features: LeadFeatures, top_factor: str) -> str:
    """Turn the winning action's top contributing factor into plain English."""
    factor_reasons = {
        "urgency": (
            f"No activity in {features.days_since_last_activity} days, "
            f"and the lead is still in the '{features.current_stage}' stage."
        ),
        "score": (
            f"Lead score is {features.current_score}/100, strong enough to "
            f"justify this action at the '{features.current_stage}' stage."
        ),
        "reply status": (
            "A reply was received" if features.reply_received else "No reply yet"
        ),
        "deal value": (
            f"Deal value of ${features.deal_value:,.0f} indicates high priority."
        ) if features.deal_value else "Deal value influences this recommendation.",
        "email engagement": (
            f"Lead has opened {features.email_open_count} email(s)"
        ),
        "meeting attendance": (
            f"Meeting status is '{features.meeting_attendance_status}'"
        ) if features.meeting_attendance_status else "Meeting attendance influences this recommendation.",
        "rep workload": (
            f"Representative has {features.rep_active_action_count} active actions, workload considered."
        ),
        "contact time": (
            f"Best contact time is {features.best_contact_time_slot}."
        ) if features.best_contact_time_slot else "Contact time optimized for engagement.",
    }

    if top_factor in factor_reasons:
        return factor_reasons[top_factor]

    reply_clause = "A reply was received" if features.reply_received else "No reply yet"
    return f"{reply_clause}, which shifted the recommendation at the '{features.current_stage}' stage."


def recommend(features: LeadFeatures) -> RecommendationResponse:
    """Main entry point: given a lead's features, return the full recommendation."""
    candidates = score_candidates(features)

    if not candidates:
        raise ValueError(f"No candidate actions defined for stage '{features.current_stage}'")

    top = candidates[0]
    reason = _build_reason(features, top.top_factor)

    return RecommendationResponse(
        lead_id=features.lead_id,
        recommended_action=top.action,
        reason=reason,
        current_score=features.current_score,
        current_stage=features.current_stage,
        all_candidates=candidates,
        deal_value=features.deal_value,
        email_open_count=features.email_open_count,
        email_opened_no_reply_flag=features.email_opened_no_reply_flag,
        meeting_attendance_status=features.meeting_attendance_status,
        rep_active_action_count=features.rep_active_action_count,
        best_contact_time_slot=features.best_contact_time_slot,
    )
