"""
Reason Generator — ported exactly from ai/scoring/reason_generator.py.

Generate transparent reasons for fit and engagement scores.
Shows actual values (intent_today, buying_stage, response_time_hours, etc.)
+ human-readable interpretation.
"""


def get_fit_reasons(features):
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

"""
Engagement Explainability

Purpose:
--------
Human-readable reasons and level labels for the engagement score.
Used by the UI / dashboard only.

Input:
------
features  : output of compute_engagement_features() from engagement_features.py
score     : output of calculate_engagement_score() from engagement_engine.py

These are kept as separate parameters intentionally —
this module does not recompute anything, it only formats
what the scoring layer already produced.
"""


# ============================================================
# ENGAGEMENT REASONS  (one line per feature, for the UI)
# ============================================================

def get_engagement_reasons(features: dict) -> list[str]:
    """
    Parameters
    ----------
    features : dict
        Output of compute_engagement_features().
        Keys used:
            intent_score              int
            buying_stage_score        int
            initiative_score          float
            decay_penalty             int
            days_since_last_inbound   int | None

    Returns
    -------
    list of human-readable reason strings, one per feature.
    """

    reasons = []

    # ----------------------------------------------------------
    # 1. INTENT  — what is the lead saying?
    # ----------------------------------------------------------
    intent_score = features.get("intent_score", 0)

    if intent_score >= 90:
        reasons.append(f"🔥 VERY HIGH INTENT — Lead is at the strongest buying signal (score: {intent_score})")
    elif intent_score >= 70:
        reasons.append(f"🟢 STRONG INTENT — Lead is clearly interested (score: {intent_score})")
    elif intent_score >= 50:
        reasons.append(f"🟡 MODERATE INTENT — Lead is showing interest (score: {intent_score})")
    elif intent_score >= 20:
        reasons.append(f"🟠 WEAK INTENT — Lead is engaging but not strongly (score: {intent_score})")
    elif intent_score == 0:
        reasons.append(f"⚪ NEUTRAL — No clear buying signal from lead")
    elif intent_score < 0:
        reasons.append(f"🔴 NEGATIVE SIGNAL — Lead has expressed disinterest or complaint (score: {intent_score})")

    # ----------------------------------------------------------
    # 2. BUYING STAGE  — where are they in the funnel?
    # ----------------------------------------------------------
    buying_stage_score = features.get("buying_stage_score", 0)

    if buying_stage_score >= 90:
        reasons.append(f"📈 FINAL STAGE — Close is near (score: {buying_stage_score})")
    elif buying_stage_score >= 65:
        reasons.append(f"📊 ADVANCED STAGE — Moving forward in the pipeline (score: {buying_stage_score})")
    elif buying_stage_score >= 40:
        reasons.append(f"📞 MID-STAGE — Conversation is in progress (score: {buying_stage_score})")
    elif buying_stage_score >= 10:
        reasons.append(f"📧 EARLY STAGE — Just getting started (score: {buying_stage_score})")
    else:
        reasons.append(f"❌ LOST / NO PROGRESS — Lead is not advancing (score: {buying_stage_score})")

    # ----------------------------------------------------------
    # 3. CUSTOMER INITIATIVE  — who is driving the conversation?
    # ----------------------------------------------------------
    initiative_score = features.get("initiative_score", 0)

    if initiative_score >= 70:
        reasons.append(f"🎯 CUSTOMER DRIVEN — Lead frequently initiates contact unprompted ({initiative_score:.0f}% initiative)")
    elif initiative_score >= 40:
        reasons.append(f"🤝 BALANCED — Mix of lead and sales outreach ({initiative_score:.0f}% initiative)")
    elif initiative_score >= 10:
        reasons.append(f"📧 SALES DRIVEN — Lead rarely reaches out first ({initiative_score:.0f}% initiative)")
    else:
        reasons.append(f"❌ NO INITIATIVE — Lead has never initiated contact")

    # ----------------------------------------------------------
    # 4. DECAY  — how recently has the lead engaged?
    # ----------------------------------------------------------
    days = features.get("days_since_last_inbound")
    penalty = features.get("decay_penalty", 0)

    if days is None:
        reasons.append(f"⚪ NO INBOUND YET — Lead has not replied to any outreach")
    elif days <= 3:
        reasons.append(f"✅ VERY RECENT — Last reply: {days} day(s) ago → Still active")
    elif days <= 7:
        reasons.append(f"⏰ RECENT — Last reply: {days} days ago (penalty: {penalty})")
    elif days <= 14:
        reasons.append(f"⚠️ GETTING STALE — Last reply: {days} days ago (penalty: {penalty}) → Follow up soon")
    elif days <= 30:
        reasons.append(f"🔶 COOLING — Last reply: {days} days ago (penalty: {penalty}) → Re-engage needed")
    else:
        reasons.append(f"❄️ COLD — Last reply: {days} days ago (penalty: {penalty}) → Lead may be going dark")

    return reasons


# ============================================================
# ENGAGEMENT LEVEL  (top-level label for the score)
# ============================================================

def get_engagement_level(engagement_score: float) -> str:
    """
    Maps a computed engagement score to a human-readable
    priority label for the UI.

    Thresholds are intentionally conservative — a lead needs
    to score above 70 to be flagged as critical, since the
    weighted formula (intent 35%, stage 40%, initiative 25%)
    only reaches that range when multiple signals are genuinely
    strong simultaneously.
    """
    if engagement_score >= 75:
        return "🔥 CRITICAL — Act immediately"
    elif engagement_score >= 55:
        return "✅ HIGH — Nurture actively"
    elif engagement_score >= 35:
        return "📊 MEDIUM — Regular follow-up"
    elif engagement_score > 10:
        return "🔄 LOW — Long-term nurture"
    else:
        return "⚪ MINIMAL — Inactive or lost"