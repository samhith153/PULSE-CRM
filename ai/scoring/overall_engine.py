"""
Overall Engine - Combine Fit Score + Engagement Score with tier-based prioritization.

Formula:
1. Raw Score = 0.6 × Fit + 0.4 × Engagement
2. Assign Tier based on business rules
3. Final Score = Tier_Lower_Bound + |Raw_Score - Tier_Lower_Bound|
4. Clamp to Tier boundaries
"""


# Tier definitions
TIERS = {
    "Critical": {"lower": 90, "upper": 100},
    "High": {"lower": 75, "upper": 89},
    "Medium": {"lower": 50, "upper": 74},
    "Low": {"lower": 0, "upper": 49},
}


# Weights for combining fit and engagement
OVERALL_WEIGHTS = {
    "fit": 0.6,
    "engagement": 0.4,
}


def calculate_raw_score(fit_score, engagement_score):
    """
    Calculate raw score from fit and engagement.
    
    Args:
        fit_score: float (0-100)
        engagement_score: float (0-100)
    
    Returns:
        float: raw score (0-100)
    """
    
    raw_score = (
        fit_score * OVERALL_WEIGHTS["fit"] +
        engagement_score * OVERALL_WEIGHTS["engagement"]
    )
    
    return round(raw_score, 2)


def assign_tier(fit_score, engagement_score):
    """
    Tier assignment based on business quality.

    Business Rules:
    - Critical (90-100): High Fit AND High Engagement
    - High (70-89): Strong Fit OR Strong Engagement (but not both minimal)
    - Medium (40-69): Moderate signals
    - Low (0-39): Weak signals

    Args:
        fit_score: float (0-100)
        engagement_score: float (0-100)

    Returns:
        str: tier name ("Critical", "High", "Medium", "Low")
    """

    # Critical → Excellent fit + excellent engagement
    if fit_score >= 85 and engagement_score >= 85:
        return "Critical"

    # High → One score is excellent and the other is at least good
    elif fit_score >= 75 and engagement_score >= 60:
        return "High"
    elif engagement_score >= 75 and fit_score >= 60:
        return "High"

    # Medium → Both are average
    elif fit_score >= 50 and engagement_score >= 50:
        return "Medium"

    # Low → Everything else
    else:
        return "Low"

def calculate_final_score(fit_score, engagement_score, tier):
    """
    Calculate final score within tier boundaries.
    
    Formula:
    Final Score = Tier_Lower_Bound + |Raw_Score - Tier_Lower_Bound|
    Clamped to [Tier_Lower, Tier_Upper]
    
    Args:
        fit_score: float (0-100)
        engagement_score: float (0-100)
        tier: str (tier name)
    
    Returns:
        float: final score within tier range
    """
    
    # Calculate raw score
    raw_score = calculate_raw_score(fit_score, engagement_score)
    
    # Get tier bounds
    tier_info = TIERS[tier]
    lower_bound = tier_info["lower"]
    upper_bound = tier_info["upper"]
    
    # Apply tier formula: Lower_Bound + |Raw - Lower_Bound|
    final_score = lower_bound + abs(raw_score - lower_bound)
    
    # Clamp to tier bounds
    final_score = max(lower_bound, min(upper_bound, final_score))
    
    return round(final_score, 2)


def calculate_overall_score(fit_score, engagement_score):
    """
    Calculate overall priority score.
    
    Pipeline:
    1. Calculate raw score (0.6×Fit + 0.4×Engagement)
    2. Assign tier (Critical/High/Medium/Low)
    3. Calculate final score within tier bounds
    
    Args:
        fit_score: float (0-100)
        engagement_score: float (0-100)
    
    Returns:
        dict with:
            - overall_score: final score (0-100)
            - tier: priority tier
            - raw_score: before tier adjustment
    """
    
    # Step 1: Calculate raw score
    raw_score = calculate_raw_score(fit_score, engagement_score)
    
    # Step 2: Assign tier
    tier = assign_tier(fit_score, engagement_score)
    
    # Step 3: Calculate final score within tier
    final_score = calculate_final_score(fit_score, engagement_score, tier)
    
    return {
        "overall_score": final_score,
        "tier": tier,
        "raw_score": raw_score,
        "fit_score": fit_score,
        "engagement_score": engagement_score,
    }


# Tier definitions
TIERS = {
    "Critical": {"lower": 90, "upper": 100},
    "High": {"lower": 75, "upper": 89},
    "Medium": {"lower": 50, "upper": 74},
    "Low": {"lower": 0, "upper": 49},
}


# Weights for combining fit and engagement
OVERALL_WEIGHTS = {
    "fit": 0.6,
    "engagement": 0.4,
}


def calculate_raw_score(fit_score, engagement_score):
    """
    Calculate raw score from fit and engagement.
    
    Args:
        fit_score: float (0-100)
        engagement_score: float (0-100)
    
    Returns:
        float: raw score (0-100)
    """
    
    raw_score = (
        fit_score * OVERALL_WEIGHTS["fit"] +
        engagement_score * OVERALL_WEIGHTS["engagement"]
    )
    
    return round(raw_score, 2)


def assign_tier(fit_score, engagement_score):
    """
    Tier assignment based on business quality.

    Business Rules:
    - Critical (90-100): High Fit AND High Engagement
    - High (75-89): Strong Fit OR Strong Engagement (but not both minimal)
    - Medium (50-74): Moderate signals
    - Low (0-49): Weak signals

    Args:
        fit_score: float (0-100)
        engagement_score: float (0-100)

    Returns:
        str: tier name ("Critical", "High", "Medium", "Low")
    """

    # Critical → Excellent fit + excellent engagement
    if fit_score >= 85 and engagement_score >= 85:
        return "Critical"

    # High → One score is excellent and the other is at least good
    elif fit_score >= 75 and engagement_score >= 60:
        return "High"
    elif engagement_score >= 75 and fit_score >= 60:
        return "High"

    # Medium → Both are average
    elif fit_score >= 50 and engagement_score >= 50:
        return "Medium"

    # Low → Everything else
    else:
        return "Low"


def calculate_final_score(fit_score, engagement_score, tier):
    """
    Calculate final score within tier boundaries.
    
    Simply clamps raw score to tier range for within-tier differentiation.
    
    Args:
        fit_score: float (0-100)
        engagement_score: float (0-100)
        tier: str (tier name)
    
    Returns:
        float: final score within tier range
    """
    
    # Calculate raw score
    raw_score = calculate_raw_score(fit_score, engagement_score)
    
    # Get tier bounds
    tier_info = TIERS[tier]
    lower_bound = tier_info["lower"]
    upper_bound = tier_info["upper"]
    
    # Clamp raw score to tier bounds
    final_score = max(lower_bound, min(upper_bound, raw_score))
    
    return round(final_score, 2)


def calculate_overall_score(fit_score, engagement_score):
    """
    Calculate overall priority score.
    
    Pipeline:
    1. Calculate raw score (0.6×Fit + 0.4×Engagement)
    2. Assign tier (Critical/High/Medium/Low)
    3. Clamp final score to tier bounds
    
    Args:
        fit_score: float (0-100)
        engagement_score: float (0-100)
    
    Returns:
        dict with:
            - overall_score: final score (0-100)
            - tier: priority tier
            - raw_score: before tier adjustment
    """
    
    # Step 1: Calculate raw score
    raw_score = calculate_raw_score(fit_score, engagement_score)
    
    # Step 2: Assign tier
    tier = assign_tier(fit_score, engagement_score)
    
    # Step 3: Calculate final score within tier
    final_score = calculate_final_score(fit_score, engagement_score, tier)
    
    return {
        "overall_score": final_score,
        "tier": tier,
        "raw_score": raw_score,
        "fit_score": fit_score,
        "engagement_score": engagement_score,
    }


