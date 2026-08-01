"""
Reason Generator - Generate transparent reasons for fit and engagement scores.

Shows actual values (intent_today, buying_stage, response_time_hours, etc.)
+ human-readable interpretation.
"""


def get_fit_reasons(features):
    """
    Generate reasons for Fit Score with actual values shown.
    
    Args:
        features: dict with fit feature scores and raw values
        
    Returns:
        list of reason strings with actual data
    """
    
    reasons = []
    
    # Company Size
    company_size = features.get("company_size")
    company_size_score = features.get("company_size_score", 0)
    
    if company_size and company_size_score >= 70:
        reasons.append(f"🏢 Large organization - {company_size} employees → Higher CRM need")
    elif company_size and company_size_score >= 40:
        reasons.append(f"📊 Growing company - {company_size} employees → Coordination challenge")
    elif company_size:
        reasons.append(f"👥 Small company - {company_size} employees → Lower complexity")
    
    # Industry Complexity
    industry = features.get("industry")
    industry_score = features.get("industry_complexity_score", 0)
    
    if industry and industry_score >= 90:
        reasons.append(f"⚙️ Very complex industry - {industry} → Heavy workflows & regulations")
    elif industry and industry_score >= 75:
        reasons.append(f"📋 Complex industry - {industry} → Multiple teams & processes")
    elif industry and industry_score >= 50:
        reasons.append(f"🔧 Moderate complexity - {industry} → Some workflow needs")
    
    # Software Gap
    current_crm = features.get("current_crm")
    software_gap_score = features.get("software_gap_score", 0)
    
    if software_gap_score >= 95:
        reasons.append(f"❌ No CRM system - Using {current_crm or 'manual processes'} → Major pain point")
    elif software_gap_score >= 80:
        reasons.append(f"📧 Fragmented tools - Using {current_crm} → Needs consolidation")
    elif software_gap_score >= 60:
        reasons.append(f"⚠️ Basic CRM - Using {current_crm} → Room for improvement")
    elif software_gap_score >= 30:
        reasons.append(f"✅ Moderate CRM - Using {current_crm} → Limited gap")
    else:
        reasons.append(f"✔️ Good software - Using {current_crm} → May not need replacement")
    
    # Operational System
    operational_system = features.get("operational_system")
    operational_score = features.get("operational_system_score", 0)
    
    if operational_system and operational_score >= 80:
        reasons.append(f"📝 Manual processes - {operational_system} → Ready for automation")
    elif operational_system and operational_score >= 50:
        reasons.append(f"⚙️ Partial automation - {operational_system} → Can improve")
    elif operational_system and operational_score >= 20:
        reasons.append(f"✅ Structured system - {operational_system} → Already organized")
    
    # Customization Potential
    customization_score = features.get("customization_potential_score", 0)
    
    if customization_score >= 70:
        reasons.append(f"🎯 High customization potential - Will need tailored workflows")
    elif customization_score >= 40:
        reasons.append(f"🔧 Moderate customization - Some custom needs")
    else:
        reasons.append(f"📦 Standard solution likely sufficient")
    
    return reasons


def get_engagement_reasons(features):
    """
    Generate reasons for Engagement Score with actual values shown.
    
    Args:
        features: dict with engagement feature scores and raw values
        
    Returns:
        list of reason strings with actual data
    """
    
    reasons = []
    
    # AI Intent Category (Strongest Signal)
    intent_today = features.get("intent_today")  # e.g., "demo_request"
    intent_category_score = features.get("intent_category_score", 0)
    
    if intent_category_score >= 90:
        reasons.append(f"🔥 VERY HIGH INTENT - Lead said: '{intent_today}' (score: {intent_category_score})")
    elif intent_category_score >= 70:
        reasons.append(f"🟢 STRONG INTENT - Lead said: '{intent_today}' (score: {intent_category_score})")
    elif intent_category_score >= 50:
        reasons.append(f"🟡 MODERATE INTENT - Lead said: '{intent_today}' (score: {intent_category_score})")
    elif intent_category_score >= 20:
        reasons.append(f"🟠 WEAK INTENT - Lead said: '{intent_today}' (score: {intent_category_score})")
    elif intent_category_score == 0:
        reasons.append(f"⚪ NEUTRAL - Lead said: '{intent_today}' (unclear intent)")
    elif intent_category_score < 0:
        reasons.append(f"🔴 NEGATIVE - Lead said: '{intent_today}' (score: {intent_category_score})")
    
    # Buying Stage (Where they are)
    buying_stage = features.get("buying_stage")
    buying_stage_score = features.get("buying_stage_score", 0)
    
    if buying_stage and buying_stage_score >= 90:
        reasons.append(f"📈 FINAL STAGE - Pipeline: {buying_stage} → Close is near (score: {buying_stage_score})")
    elif buying_stage and buying_stage_score >= 75:
        reasons.append(f"📊 ADVANCED STAGE - Pipeline: {buying_stage} → Moving forward (score: {buying_stage_score})")
    elif buying_stage and buying_stage_score >= 50:
        reasons.append(f"📞 MID-STAGE - Pipeline: {buying_stage} → In progress (score: {buying_stage_score})")
    elif buying_stage and buying_stage_score >= 20:
        reasons.append(f"📧 EARLY STAGE - Pipeline: {buying_stage} → Just started (score: {buying_stage_score})")
    elif buying_stage and buying_stage_score == 0:
        reasons.append(f"❌ LOST/NO PROGRESS - Pipeline: {buying_stage}")
    
    # Average Response Time (How fast they reply)
    avg_response_hours = features.get("average_response_time_hours")
    response_time_score = features.get("response_time_score", 0)
    
    if response_time_score >= 90:
        if avg_response_hours:
            reasons.append(f"⚡ VERY RESPONSIVE - Average: {avg_response_hours}h → Highly engaged (score: {response_time_score})")
        else:
            reasons.append(f"⚡ VERY RESPONSIVE - Replies within 2 hours (score: {response_time_score})")
    elif response_time_score >= 75:
        if avg_response_hours:
            reasons.append(f"✅ RESPONSIVE - Average: {avg_response_hours}h → Good engagement (score: {response_time_score})")
        else:
            reasons.append(f"✅ RESPONSIVE - Replies within 24 hours (score: {response_time_score})")
    elif response_time_score >= 50:
        if avg_response_hours:
            reasons.append(f"⏱️ MODERATE - Average: {avg_response_hours}h → Reasonable pace (score: {response_time_score})")
        else:
            reasons.append(f"⏱️ MODERATE - Replies within 3 days (score: {response_time_score})")
    elif response_time_score >= 20:
        if avg_response_hours:
            reasons.append(f"🐢 SLOW - Average: {avg_response_hours}h → Takes time to respond (score: {response_time_score})")
        else:
            reasons.append(f"🐢 SLOW - Replies take days (score: {response_time_score})")
    elif response_time_score == 0:
        reasons.append(f"❌ NO RESPONSE - Never replied to our emails")
    
    # Engagement Trend (Are they heating up or cooling down?)
    intent_today_val = features.get("intent_today_score")
    intent_7days_ago = features.get("intent_7_days_ago_score")
    engagement_trend_score = features.get("engagement_trend_score", 50)
    
    if intent_today_val and intent_7days_ago:
        delta = intent_today_val - intent_7days_ago
        if engagement_trend_score >= 80:
            reasons.append(f"📈 INTEREST GROWING - Was {intent_7days_ago} → Now {intent_today_val} (↑{delta:.0f} points) - MOMENTUM!")
        elif engagement_trend_score >= 60:
            reasons.append(f"📈 IMPROVING - Was {intent_7days_ago} → Now {intent_today_val} (↑{delta:.0f} points)")
        elif engagement_trend_score >= 40:
            reasons.append(f"➡️ STABLE - Was {intent_7days_ago} → Now {intent_today_val} (Δ{delta:.0f} points)")
        elif engagement_trend_score >= 20:
            reasons.append(f"📉 DECLINING - Was {intent_7days_ago} → Now {intent_today_val} (↓{abs(delta):.0f} points) - Re-engage!")
        elif engagement_trend_score < 20:
            reasons.append(f"📉 COOLING - Was {intent_7days_ago} → Now {intent_today_val} (↓{abs(delta):.0f} points) - Lead going cold")
    else:
        if engagement_trend_score >= 60:
            reasons.append(f"📈 Interest improving over time")
        elif engagement_trend_score >= 40:
            reasons.append(f"➡️ Engagement stable")
        elif engagement_trend_score < 40:
            reasons.append(f"📉 Engagement declining")
    
    # Customer Initiative (Who's driving?)
    customer_initiative_score = features.get("customer_initiative_score", 0)
    
    if customer_initiative_score == 100:
        reasons.append(f"🎯 CUSTOMER DRIVEN - Latest email from CUSTOMER → They're actively engaged")
    elif customer_initiative_score == 60:
        reasons.append(f"🔄 MIXED - Both sides initiating → Healthy two-way conversation")
    elif customer_initiative_score == 30:
        reasons.append(f"📧 SALES DRIVEN - Latest email from US → We're chasing them")
    elif customer_initiative_score == 0:
        reasons.append(f"❌ NO CONTACT - No interaction history")
    
    # Days Since Last Activity
    days_since_outbound = features.get("days_since_last_outbound")
    decay_penalty = features.get("decay_penalty", 0)
    
    if days_since_outbound is not None:
        if days_since_outbound <= 3:
            reasons.append(f"✅ RECENT - Last contact: {days_since_outbound} days ago → Still hot")
        elif days_since_outbound <= 7:
            reasons.append(f"⏰ MODERATELY RECENT - Last contact: {days_since_outbound} days ago (penalty: {decay_penalty})")
        elif days_since_outbound <= 14:
            reasons.append(f"⚠️ GETTING OLD - Last contact: {days_since_outbound} days ago (penalty: {decay_penalty}) → Follow up soon")
        elif days_since_outbound <= 30:
            reasons.append(f"🔶 COOLING - Last contact: {days_since_outbound} days ago (penalty: {decay_penalty}) → Re-engage needed")
        elif days_since_outbound <= 60:
            reasons.append(f"🔴 COLD - Last contact: {days_since_outbound} days ago (penalty: {decay_penalty}) → Significant re-engagement effort needed")
        else:
            reasons.append(f"❄️ FROZEN - Last contact: {days_since_outbound} days ago (penalty: {decay_penalty}) → Lead may be lost")
    
    return reasons


def get_engagement_level(engagement_score):
    """
    Determine engagement level from score.
    
    Args:
        engagement_score: float (0-100)
    
    Returns:
        str: level name with emoji
    """
    
    if engagement_score >= 70:
        return "🔥 CRITICAL - Act immediately"
    elif engagement_score >= 50:
        return "✅ HIGH - Nurture actively"
    elif engagement_score >= 25:
        return "📊 MEDIUM - Regular follow-up"
    elif engagement_score > 0:
        return "🔄 LOW - Long-term nurture"
    else:
        return "⚪ MINIMAL - Inactive or lost"


if __name__ == "__main__":
    print("Reason Generator - Ready for import")