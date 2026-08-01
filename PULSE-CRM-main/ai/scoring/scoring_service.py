"""
Scoring Service - Score leads with fit, engagement, and overall priority.

Returns:
- fit_score + fit_reasons
- engagement_score + engagement_reasons
- overall_score + tier + top_reasons (most influential factors)
"""

from .fit_engine import calculate_fit_score
from .engagement_engine import calculate_engagement_score
from .overall_engine import calculate_overall_score
from .reason_generator import get_fit_reasons, get_engagement_reasons


def get_top_reasons(fit_reasons, engagement_reasons, fit_score, engagement_score):
    """
    Extract top 3 most influential reasons from actual business factors.
    
    Picks the strongest reasons from fit and engagement based on scores.
    
    Args:
        fit_reasons: list of fit reason strings
        engagement_reasons: list of engagement reason strings
        fit_score: float (0-100)
        engagement_score: float (0-100)
    
    Returns:
        list of top 3 most influential reasons
    """
    
    top_reasons = []
    
    # Reason 1: Strongest fit factor (first reason usually captures main fit driver)
    if fit_score >= 70 and fit_reasons:
        top_reasons.append(fit_reasons[0])  # Usually the most important fit factor
    
    # Reason 2: Strongest engagement factor (first reason usually captures main engagement driver)
    if engagement_score >= 70 and engagement_reasons:
        top_reasons.append(engagement_reasons[0])  # Usually the most important engagement factor
    
    # Reason 3: Secondary factor (either fit or engagement, whichever is second strongest)
    if len(fit_reasons) > 1 and len(engagement_reasons) > 1:
        # If fit is slightly higher, use fit's second reason; otherwise engagement's second
        if fit_score >= engagement_score and len(fit_reasons) > 1:
            top_reasons.append(fit_reasons[1])
        elif len(engagement_reasons) > 1:
            top_reasons.append(engagement_reasons[1])
    elif len(fit_reasons) > 1:
        top_reasons.append(fit_reasons[1])
    elif len(engagement_reasons) > 1:
        top_reasons.append(engagement_reasons[1])
    
    return top_reasons[:3]  # Return max 3 reasons


def score_lead(fit_features, engagement_features):
    """
    Score a lead with fit, engagement, and overall priority.
    
    Args:
        fit_features: dict with fit feature values
        engagement_features: dict with engagement feature values
    
    Returns:
        dict with:
            - fit_score: float (0-100)
            - fit_reasons: list of reasons
            - engagement_score: float (0-100)
            - engagement_reasons: list of reasons
            - overall_score: dict with score, tier, raw_score
            - top_reasons: list of 3 most influential factors
    """
    
    # Calculate Fit Score
    fit_score = calculate_fit_score(fit_features)
    fit_reasons = get_fit_reasons(fit_features)
    
    # Calculate Engagement Score
    engagement_score = calculate_engagement_score(engagement_features)
    engagement_reasons = get_engagement_reasons(engagement_features)
    
    # Calculate Overall Score
    overall_result = calculate_overall_score(fit_score, engagement_score)
    
    # Get top influential reasons (from actual business factors, not score comparisons)
    top_reasons = get_top_reasons(fit_reasons, engagement_reasons, fit_score, engagement_score)
    
    return {
        "fit": {
            "score": round(fit_score, 2),
            "reasons": fit_reasons,
        },
        "engagement": {
            "score": round(engagement_score, 2),
            "reasons": engagement_reasons,
        },
        "overall": {
            "score": overall_result["overall_score"],
            "tier": overall_result["tier"],
            "raw_score": overall_result["raw_score"],
            "top_reasons": top_reasons,
        }
    }