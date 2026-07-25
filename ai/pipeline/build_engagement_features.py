"""
Build Engagement Features

Generates numerical engagement-related features for each lead based on
communication history and CRM data.

Uses corrected functions aligned with PDF spec and Email schema.
"""

import pandas as pd
from datetime import datetime, timedelta

from engagement_features import (
    average_response_time,
    response_time_score,
    days_since_last_outbound,
    engagement_decay_penalty,
    ai_intent_category_score,
    buying_stage_score,
    customer_initiative_score,
    engagement_trend_score,
)


def build_engagement_features(leads, emails):
    """
    Build engagement feature vectors for all leads.
    
    Parameters
    ----------
    leads : pandas.DataFrame
        Lead information with columns:
        - lead_id (or external_entity_id)
        - buying_stage
        - intent_today (latest AI intent score)
        - intent_7_days_ago (historical AI intent score)
    
    emails : pandas.DataFrame
        Email activity with columns:
        - external_entity_id (links to lead)
        - direction ("inbound" or "outbound")
        - sent_at (datetime)
    
    Returns
    -------
    pandas.DataFrame
        Engagement features for all leads with 6 core features + decay penalty
    """
    
    engagement_rows = []
    
    for _, lead in leads.iterrows():
        
        lead_id = lead["lead_id"]
        
        # Filter emails for this lead
        # NOTE: Email model uses external_entity_id, not lead_id
        lead_emails = emails[emails["external_entity_id"] == lead_id]
        
        # ===========================
        # Feature 1: Average Response Time
        # ===========================
        avg_response_time_hours = average_response_time(lead_emails)
        response_time_score_val = response_time_score(avg_response_time_hours)
        
        # ===========================
        # Feature 2: Days Since Last Outbound + Decay Penalty
        # ===========================
        days_since_outbound = days_since_last_outbound(lead_emails)
        decay_penalty = engagement_decay_penalty(days_since_outbound)
        
        # ===========================
        # Feature 3: AI Intent Category Score
        # ===========================
        # This should come from LLM analysis of latest email
        # For now, use from lead data (to be populated by LLM pipeline)
        intent_today = lead.get("intent_today")  # Latest AI intent score
        intent_category_score = ai_intent_category_score(intent_today) if intent_today else 0
        
        # ===========================
        # Feature 4: Buying Stage Score
        # ===========================
        buying_stage = lead.get("buying_stage")
        buying_stage_score_val = buying_stage_score(buying_stage)
        
        # ===========================
        # Feature 5: Customer Initiative Score
        # ===========================
        customer_initiative_score_val = customer_initiative_score(lead_emails)
        
        # ===========================
        # Feature 6: Engagement Trend Score
        # ===========================
        intent_today_score = lead.get("intent_today")  # Latest
        intent_7_days_ago = lead.get("intent_7_days_ago")  # Historical
        trend_score = engagement_trend_score(intent_today_score, intent_7_days_ago)
        
        # ===========================
        # Store Feature Vector
        # ===========================
        
        engagement_rows.append({
            "lead_id": lead_id,
            "feature_version": "v1",
            "generated_at": datetime.now(),
            
            # ===== Raw Features =====
            "average_response_time_hours": avg_response_time_hours,
            "days_since_last_outbound": days_since_outbound,
            "buying_stage": buying_stage,
            "intent_today": intent_today,
            "intent_7_days_ago": intent_7_days_ago,
            
            # ===== Scored Features (0-100 or -100 to +100) =====
            "response_time_score": response_time_score_val,
            "intent_category_score": intent_category_score,
            "buying_stage_score": buying_stage_score_val,
            "customer_initiative_score": customer_initiative_score_val,
            "engagement_trend_score": trend_score,
            
            # ===== Decay Penalty =====
            "decay_penalty": decay_penalty,
        })
    
    return pd.DataFrame(engagement_rows)


def calculate_engagement_score(feature_row):
    """
    Calculate final engagement score from feature vector.
    
    Formula:
    base_score = (intent × 0.35) + (stage × 0.25) + (response × 0.15) + (trend × 0.15) + (initiative × 0.10)
    final_score = base_score + decay_penalty
    clamped = max(0, min(100, final_score))
    
    Parameters
    ----------
    feature_row : dict or pandas.Series
        Single row from engagement features DataFrame
    
    Returns
    -------
    dict
        {
            "lead_id": uuid,
            "engagement_score": float (0-100),
            "engagement_level": str ("Critical", "High", "Medium", "Low"),
            "base_score": float,
            "decay_penalty": int
        }
    """
    
    # Extract scores
    intent_score = feature_row.get("intent_category_score", 0)
    stage_score = feature_row.get("buying_stage_score", 0)
    response_score = feature_row.get("response_time_score", 0)
    trend_score = feature_row.get("engagement_trend_score", 50)
    initiative_score = feature_row.get("customer_initiative_score", 0)
    decay_penalty = feature_row.get("decay_penalty", 0)
    
    # Calculate base score with weights (all 0-100 scale)
    base_score = (
        intent_score * 0.35 +
        stage_score * 0.25 +
        response_score * 0.15 +
        trend_score * 0.15 +
        initiative_score * 0.10
    )
    
    # Apply decay penalty
    final_score = base_score + decay_penalty
    
    # Clamp to 0-100
    final_score = max(0, min(100, final_score))
    
    # Determine engagement level
    if final_score >= 70:
        level = "High"
    elif final_score >= 40:
        level = "Medium"
    elif final_score > 0:
        level = "Low"
    else:
        level = "Minimal"
    
    return {
        "lead_id": feature_row["lead_id"],
        "engagement_score": round(final_score, 2),
        "engagement_level": level,
        "base_score": round(base_score, 2),
        "decay_penalty": decay_penalty,
    }


if __name__ == "__main__":
    print("This module is intended to be imported into engagement pipeline")