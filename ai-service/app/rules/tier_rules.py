"""
Overall Engine — ported exactly from ai/scoring/overall_engine.py.

Formula:
1. Raw Score = 0.6 * Fit + 0.4 * Engagement
2. Assign Tier based on business rules
3. Final Score = Clamp Raw_Score to Tier boundaries
"""


# Tier definitions
TIERS = {
    "Critical": {"lower": 90, "upper": 100},
    "High": {"lower": 70, "upper": 89},
    "Medium": {"lower": 40, "upper": 69},
    "Low": {"lower": 0, "upper": 39},
}

# Weights for combining fit and engagement
OVERALL_WEIGHTS = {
    "fit": 0.6,
    "engagement": 0.4,
}


def calculate_raw_score(fit_score, engagement_score):
    raw_score = (
        fit_score * OVERALL_WEIGHTS["fit"] +
        engagement_score * OVERALL_WEIGHTS["engagement"]
    )
    return round(raw_score, 2)


def assign_tier(fit_score, engagement_score):
    # Critical: Both strong
    if fit_score >= 70 and engagement_score >= 70:
        return "Critical"
    # High: At least one strong, neither weak
    elif (fit_score >= 70 or engagement_score >= 70) and fit_score >= 40 and engagement_score >= 40:
        return "High"
    # Medium: Moderate signals
    elif fit_score >= 40 and engagement_score >= 20:
        return "Medium"
    elif fit_score >= 20 and engagement_score >= 40:
        return "Medium"
    # Low: Everything else
    else:
        return "Low"


def calculate_final_score(fit_score, engagement_score, tier):
    raw_score = calculate_raw_score(fit_score, engagement_score)
    tier_info = TIERS[tier]
    lower_bound = tier_info["lower"]
    upper_bound = tier_info["upper"]
    final_score = max(lower_bound, min(upper_bound, raw_score))
    return round(final_score, 2)


def calculate_overall_score(fit_score, engagement_score):
    raw_score = calculate_raw_score(fit_score, engagement_score)
    tier = assign_tier(fit_score, engagement_score)
    final_score = calculate_final_score(fit_score, engagement_score, tier)
    return {
        "overall_score": final_score,
        "tier": tier,
        "raw_score": raw_score,
        "fit_score": fit_score,
        "engagement_score": engagement_score,
    }
