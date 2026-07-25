"""
engine.py

Core rule-based logic for the Recommendation / Next-Best-Action module.

    weight(action) = w_s * score_norm + w_u * urgency + w_r * reply_factor
    recommended_action = argmax( weight(action) )  over all actions valid
                          for the lead's current pipeline stage

The winning action's reason is generated from whichever single factor
contributed the most to its weight — so the explanation is read directly
off the math, never invented. This satisfies PULSE's "no black-box
scores or recommendations" design principle.
"""

from .models import LeadFeatures, RecommendationResponse, RecommendationResult
from .rules import actions_for_stage


def _normalize_inputs(features: LeadFeatures) -> tuple[float, float, float]:
    """Convert raw features into the 0-1 normalized values the formula uses."""
    score_norm = features.current_score / 100
    urgency = min(features.days_since_last_activity / 7, 1.0)
    reply_factor = 1.0 if features.reply_received else 0.0
    return score_norm, urgency, reply_factor


def score_candidates(features: LeadFeatures) -> list[RecommendationResult]:
    """Score every action valid for this lead's stage, sorted best-first."""
    score_norm, urgency, reply_factor = _normalize_inputs(features)
    candidates = actions_for_stage(features.current_stage)

    results: list[RecommendationResult] = []
    for rule in candidates:
        s_val = (1 - score_norm) if rule.invert_s else score_norm
        u_val = (1 - urgency) if rule.invert_u else urgency
        r_val = (1 - reply_factor) if rule.invert_r else reply_factor

        weight = 0.0
        top_factor = ""
        top_contribution = -1.0

        if "s" in rule.weights:
            contribution = rule.weights["s"] * s_val
            weight += contribution
            if contribution > top_contribution:
                top_contribution, top_factor = contribution, "score"
        if "u" in rule.weights:
            contribution = rule.weights["u"] * u_val
            weight += contribution
            if contribution > top_contribution:
                top_contribution, top_factor = contribution, "urgency"
        if "r" in rule.weights:
            contribution = rule.weights["r"] * r_val
            weight += contribution
            if contribution > top_contribution:
                top_contribution, top_factor = contribution, "reply status"

        results.append(
            RecommendationResult(action=rule.name, weight=round(weight, 4), top_factor=top_factor)
        )

    results.sort(key=lambda r: r.weight, reverse=True)
    return results


def _build_reason(features: LeadFeatures, top_factor: str) -> str:
    """Turn the winning action's top contributing factor into plain English."""
    if top_factor == "urgency":
        return (
            f"No activity in {features.days_since_last_activity} days, "
            f"and the lead is still in the '{features.current_stage}' stage."
        )
    if top_factor == "score":
        return (
            f"Lead score is {features.current_score}/100, strong enough to "
            f"justify this action at the '{features.current_stage}' stage."
        )
    # top_factor == "reply status"
    reply_clause = "A reply was received" if features.reply_received else "No reply yet"
    return f"{reply_clause}, which shifted the recommendation at the '{features.current_stage}' stage."


def recommend(features: LeadFeatures) -> RecommendationResponse:
    """Main entry point: given a lead's features, return the full recommendation."""
    candidates = score_candidates(features)

    if not candidates:
        # No action rule is defined for this stage — fail loudly rather than guess.
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
    )
