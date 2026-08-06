"""
Scoring Service — orchestrates the full scoring pipeline.

  1. Compute features from fit_rules and engagement_rules
  2. Calculate fit score
  3. Calculate engagement score
  4. Combine into overall score/tier
  5. Generate reasons
"""

from app.rules.fit_score import calculate_fit_score
from app.rules.engagement_score import calculate_engagement_score
from app.rules.tier_rules import calculate_overall_score
from app.rules.reason_rules import get_fit_reasons, get_engagement_reasons, get_engagement_level
from app.rules.fit_score_rules import compute_fit_features
from app.rules.engagement_rules import compute_engagement_features


def _build_features(lead_data):
    fit = compute_fit_features(lead_data)
    engagement = compute_engagement_features(lead_data)

    features = {
        # Raw values for reason generation
        "company_size": lead_data.get("employees") or lead_data.get("company_size"),
        "industry": lead_data.get("industry"),
        "current_crm": lead_data.get("current_crm"),
        "operational_system": lead_data.get("operational_system"),
        "intent": lead_data.get("intent"),
        "current_stage": lead_data.get("current_stage") or lead_data.get("buying_stage"),
        "days_since_last_outbound": lead_data.get("days_since_last_outbound"),
        "is_outbound": lead_data.get("is_outbound"),
        # Scores from fit computation
        "company_size_score": fit["company_size_score"],
        "industry_complexity_score": fit["industry_complexity_score"],
        "software_gap_score": fit["software_gap_score"],
        "operational_system_score": fit["operational_system_score"],
        "customization_potential_score": fit["customization_potential_score"],
        # Scores from engagement computation
        "intent_score": engagement["intent_score"],
        "buying_stage_score": engagement["buying_stage_score"],
        "initiative_score": engagement["initiative_score"],
        "decay_penalty": engagement["decay_penalty"],
        "days_since_last_inbound": engagement["days_since_last_inbound"],
    }
    return features, fit, engagement


def score_lead(lead_data):
    features, fit, engagement = _build_features(lead_data)

    fit_score = calculate_fit_score(features)
    engagement_score = calculate_engagement_score(features)
    overall = calculate_overall_score(fit_score, engagement_score)

    fit_reasons = get_fit_reasons(features)
    engagement_reasons = get_engagement_reasons(features)
    engagement_level = get_engagement_level(engagement_score)

    return {
        "lead_id": lead_data.get("lead_id") or lead_data.get("contact_id") or lead_data.get("id"),
        "score": overall["overall_score"],
        "tier": overall["tier"],
        "fit_score": round(fit_score, 2),
        "engagement_score": round(engagement_score, 2),
        "fit_reasons": fit_reasons,
        "engagement_reasons": engagement_reasons,
        "engagement_level": engagement_level,
        "reasons": fit_reasons + engagement_reasons,
        "features": {
            "fit": fit,
            "engagement": engagement,
        },
    }


def get_top_reasons(reasons, n=5):
    return reasons[:n]
