def get_fit_reasons(features):
    """Generate reasons for fit score."""
    reasons = []
    
    if features["company_size_score"] >= 70:
        reasons.append("Large company → high coordination needs")
    
    if features["industry_complexity_score"] >= 80:
        reasons.append("Complex industry → workflow-heavy")
    
    if features["software_gap_score"] >= 80:
        reasons.append("No CRM or manual processes → pain point")
    
    return reasons


def get_engagement_reasons(features):
    """Generate reasons for engagement score."""
    reasons = []
    
    if features["intent_category_score"] >= 80:
        reasons.append("🔥 Strong buying intent")
    
    if features["buying_stage_score"] >= 75:
        reasons.append("📈 Advanced pipeline stage")
    
    if features["response_time_score"] >= 90:
        reasons.append("⚡ Fast responses")
    
    if features["engagement_trend_score"] >= 75:
        reasons.append("📊 Interest increasing")
    
    if features["decay_penalty"] < -20:
        reasons.append("⏰ Inactive for long time")
    
    return reasons