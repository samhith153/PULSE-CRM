from .weights import ENGAGEMENT_WEIGHTS

def calculate_engagement_score(features):
    """
    Calculate engagement score from features.
    
    Args:
        features: dict with keys:
            - intent_category_score
            - buying_stage_score
            - response_time_score
            - engagement_trend_score
            - customer_initiative_score
            - decay_penalty
    
    Returns:
        float: engagement score (0-100)
    """
    
    base_score = (
        features["intent_category_score"] * ENGAGEMENT_WEIGHTS["intent_category"]
        + features["buying_stage_score"] * ENGAGEMENT_WEIGHTS["buying_stage"]
        + features["response_time_score"] * ENGAGEMENT_WEIGHTS["response_time"]
        + features["engagement_trend_score"] * ENGAGEMENT_WEIGHTS["engagement_trend"]
        + features["customer_initiative_score"] * ENGAGEMENT_WEIGHTS["customer_initiative"]
    )
    
    final_score = base_score + features.get("decay_penalty", 0)
    return max(0, min(100, final_score))  # Clamp to 0-100