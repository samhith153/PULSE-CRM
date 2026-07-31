"""
ai_recommendation_engine_enhanced.py

Rule-based Next-Best-Action recommendation engine.

    weight(action) = sum(w_i * factor_i)  for each factor in the action's weights
    recommended_action = argmax(weight(action)) over all actions valid for the lead's stage

The winning action's reason is generated from the lead's actual data signals,
explaining WHY this action was chosen. This satisfies PULSE's "no black-box
scores or recommendations" design principle.
"""

import sys
import os

# Add parent directory to path for imports
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from ai.recommendation.ai_recommendation_models import (
    LeadFeatures,
    RecommendationResult,
    RecommendationResponse,
)
from ai.recommendation.rules import ActionRule, actions_for_stage


# ═══════════════════════════════════════════════════════════════════════════════
# NORMALIZATION
# ═══════════════════════════════════════════════════════════════════════════════

FACTOR_LABELS: dict[str, str] = {
    "s": "score",
    "u": "urgency",
    "r": "reply status",
    "dv": "deal value",
    "eo": "email engagement",
    "mt": "meeting attendance",
    "rw": "rep workload",
    "ct": "contact time",
}


def _normalize_inputs(features: LeadFeatures) -> dict[str, float]:
    """Convert raw features into 0-1 normalized values."""

    score_norm = features.current_score / 100

    # Urgency: 0 days = 0.0, 7+ days = 1.0
    urgency = min(features.days_since_last_activity / 7, 1.0)

    # Reply: binary
    reply_factor = 1.0 if features.reply_received else 0.0

    # Deal value: $0 = 0.0, $200k+ = 1.0
    deal_value_norm = 0.0
    if features.deal_value is not None and features.deal_value > 0:
        deal_value_norm = min(features.deal_value / 200000, 1.0)

    # Email opens: 0 = 0.0, 5+ = 1.0
    email_open_norm = 0.0
    if features.email_open_count is not None:
        email_open_norm = min(features.email_open_count / 5, 1.0)

    # Meeting attendance
    meeting_factor = 0.0
    if features.meeting_attendance_status == "ATTENDED":
        meeting_factor = 1.0
    elif features.meeting_attendance_status == "NO_SHOW":
        meeting_factor = 0.3
    elif features.meeting_attendance_status == "RESCHEDULED":
        meeting_factor = 0.5

    # Rep workload: 0 items = 0.0, 15+ items = 1.0
    rep_workload_norm = 0.0
    if features.rep_active_action_count is not None:
        rep_workload_norm = min(features.rep_active_action_count / 15, 1.0)

    # Contact time
    contact_time_factor = 0.5  # default
    if features.best_contact_time_slot:
        preferred_slots = {
            "10:00-12:00": 1.0,
            "14:00-16:00": 0.9,
            "08:00-10:00": 0.7,
            "16:00-18:00": 0.5,
        }
        contact_time_factor = preferred_slots.get(features.best_contact_time_slot, 0.5)

    return {
        "s": score_norm,
        "u": urgency,
        "r": reply_factor,
        "dv": deal_value_norm,
        "eo": email_open_norm,
        "mt": meeting_factor,
        "rw": rep_workload_norm,
        "ct": contact_time_factor,
    }


def _get_factor_value(normalized: dict[str, float], key: str, invert: bool) -> float:
    """Get factor value, optionally inverted."""
    val = normalized.get(key, 0.0)
    return (1 - val) if invert else val


# ═══════════════════════════════════════════════════════════════════════════════
# SCORING
# ═══════════════════════════════════════════════════════════════════════════════


def score_candidates(features: LeadFeatures) -> list[RecommendationResult]:
    """Score every action valid for this lead's stage."""

    normalized = _normalize_inputs(features)
    candidates = actions_for_stage(features.current_stage)

    results: list[RecommendationResult] = []

    for rule in candidates:
        weight = 0.0
        top_factor = ""
        top_contribution = -1.0

        for key in rule.weights:
            invert = getattr(rule, f"invert_{key}", False)
            val = _get_factor_value(normalized, key, invert)
            contribution = rule.weights[key] * val
            weight += contribution

            if contribution > top_contribution:
                top_contribution = contribution
                top_factor = FACTOR_LABELS.get(key, key)

        results.append(
            RecommendationResult(
                action=rule.name,
                weight=round(weight, 4),
                top_factor=top_factor,
            )
        )

    results.sort(key=lambda r: r.weight, reverse=True)
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# REASON BUILDER — explains WHY this action was chosen
# ═══════════════════════════════════════════════════════════════════════════════


def _build_reason(features: LeadFeatures, winning_action: str, top_factor: str) -> str:
    """
    Build a reason that explains WHY this specific action was recommended,
    based on the lead's actual data signals.
    """

    stage = features.current_stage
    score = features.current_score
    days = features.days_since_last_activity
    has_reply = features.reply_received
    deal_val = features.deal_value
    emails_sent = getattr(features, "outbound_email_count", None) or 0
    emails_received = getattr(features, "inbound_email_count", None) or 0
    meeting = features.meeting_attendance_status

    # ── Build the reason based on the winning action ──

    if winning_action == "Send introductory email":
        if deal_val and deal_val >= 50000:
            return f"New lead with estimated value ${deal_val:,.0f}. Start with a personalized intro email highlighting relevant use cases."
        return "New lead ready for first contact. Send a concise intro email that addresses their likely pain point."

    if winning_action == "Research the prospect":
        if score >= 70:
            return f"High fit score ({score}/100) — worth investing time to research their company, tech stack, and recent news before outreach."
        return "Research the prospect on LinkedIn and their company website before reaching out — personalization increases response rates."

    if winning_action == "Make a phone call":
        if days >= 3:
            return f"No response in {days} days. A phone call cuts through inbox noise — try calling at their most active time."
        if has_reply:
            return "Lead has engaged via email. A quick call can accelerate the conversation and qualify faster."
        return "Phone calls get faster responses than email for new leads. Call during business hours for best results."

    if winning_action == "Send follow-up email":
        if emails_sent > 0 and not has_reply:
            return f"No reply after {emails_sent} email(s) sent. Follow up with a different angle — reference their specific pain point or share a relevant case study."
        if has_reply:
            return "Lead replied — keep momentum. Send the next piece of information they asked about."
        return "Send a follow-up to continue the conversation and move the lead forward."

    if winning_action == "Try a different channel":
        return f"Email isn't getting responses ({emails_sent} sent, {emails_received} received). Try LinkedIn, phone, or a mutual connection introduction."

    if winning_action == "Send relevant content":
        if score >= 60:
            return f"Fit score is {score}/100. Share a case study or resource that matches their industry and use case to build credibility."
        return "Share relevant content (blog, case study, webinar) to nurture the lead and demonstrate expertise."

    if winning_action == "Schedule a discovery call":
        if has_reply:
            return "Lead is engaged — book a 15-min discovery call to qualify their needs, timeline, and budget."
        return "Schedule a brief discovery call to understand their requirements and qualify the opportunity."

    if winning_action == "Schedule a product demo":
        if deal_val and deal_val >= 100000:
            return f"High-value opportunity (${deal_val:,.0f}, score {score}/100). Schedule a tailored demo showing their specific use case."
        if meeting == "ATTENDED":
            return "Lead attended previous meeting — they're interested. Schedule a full product demo to show capabilities."
        return f"Score {score}/100 indicates readiness. Schedule a demo to showcase the product and answer questions."

    if winning_action == "Send pricing information":
        if deal_val and deal_val >= 50000:
            return f"Deal value ${deal_val:,.0f}. Send pricing with custom enterprise terms and ROI analysis."
        return "Lead is qualified and ready for pricing. Send a clear pricing breakdown with options."

    if winning_action == "Introduce to account executive":
        return f"Score {score}/100 — qualified enough for AE handoff. Introduce to AE for personalized deal management."

    if winning_action == "Send pre-demo agenda":
        return "Demo is coming up. Send an agenda and ask what they want to see — this increases attendance and engagement."

    if winning_action == "Confirm demo attendance":
        if meeting == "NO_SHOW":
            return "Lead missed the last meeting. Send a reminder and offer to reschedule — don't let momentum die."
        return "Send a demo reminder 24 hours before. Include the meeting link and agenda to reduce no-shows."

    if winning_action == "Prepare custom demo environment":
        if deal_val and deal_val >= 50000:
            return f"High-value deal (${deal_val:,.0f}). Prepare a custom sandbox with their data/use case for a personalized demo."
        return "Set up a demo environment tailored to their industry and use case for maximum impact."

    if winning_action == "Follow up on proposal":
        if days >= 3:
            return f"No response in {days} days at the '{stage}' stage. Follow up to check if they have questions or need adjustments."
        return "Follow up on the proposal — ask if they need clarification on any section."

    if winning_action == "Address objections":
        if has_reply:
            return "Lead raised concerns — address them directly with data, testimonials, and ROI projections."
        return "Anticipate objections and proactively address them — pricing, implementation, or competitor comparisons."

    if winning_action == "Send case study or testimonial":
        if deal_val and deal_val >= 50000:
            return f"${deal_val:,.0f} deal at risk. Share a case study from a similar company to rebuild confidence."
        return "Share proof from a similar customer — case studies and testimonials reduce perceived risk."

    if winning_action == "Finalize contract terms":
        if deal_val and deal_val >= 100000:
            return f"High-value deal (${deal_val:,.0f}) in negotiation. Lock down final terms and get signature."
        return "Deal is close to closing. Send the final contract and set a signature deadline."

    if winning_action == "Offer value-add services":
        return f"Negotiating on price? Offer onboarding, training, or extended support as value-adds instead of discounts."

    if winning_action == "Escalate to manager for approval":
        if deal_val and deal_val >= 100000:
            return f"${deal_val:,.0f} deal needs custom terms. Escalate to manager for discount or contract approval."
        return "Need special terms or discount — get manager approval before proceeding."

    if winning_action == "Re-engage with a breakup email":
        if days >= 10:
            return f"Lead has been inactive for {days} days. Send a polite breakup email — 'is this still a priority?' — this often triggers a response."
        return f"No engagement in {days} days. A breakup email creates urgency and often gets a last-chance reply."

    if winning_action == "Add to nurture campaign":
        return f"Lead isn't ready to buy now (score {score}/100). Add to automated drip sequence for long-term nurturing."

    # Fallback
    return f"Based on the lead's score ({score}/100) and stage ({stage}), this is the most appropriate next action."


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════


def recommend(features: LeadFeatures) -> RecommendationResponse:
    """
    Generate recommendation for a lead.

    Input: LeadFeatures with lead data
    Output: RecommendationResponse with action + reason
    """

    candidates = score_candidates(features)

    if not candidates:
        raise ValueError(f"No candidate actions defined for stage '{features.current_stage}'")

    top = candidates[0]
    reason = _build_reason(features, top.action, top.top_factor)

    return RecommendationResponse(
        lead_id=features.lead_id,
        recommended_action=top.action,
        reason=reason,
        current_score=features.current_score,
        current_stage=features.current_stage,
        all_candidates=candidates,
        deal_value=features.deal_value,
        email_open_count=features.email_open_count,
        email_opened_no_reply_flag=features.email_opened_no_reply_flag,
        meeting_attendance_status=features.meeting_attendance_status,
        rep_active_action_count=features.rep_active_action_count,
        best_contact_time_slot=features.best_contact_time_slot,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# ORCHESTRATOR — called by backend services
# ═══════════════════════════════════════════════════════════════════════════════


def generate_recommendation(lead_dict: dict) -> dict:
    """
    Orchestrator — call from recommendation_service.py.

    Input: lead_dict with lead data
    Output: recommendation dict with action, reason, and candidates
    """

    try:
        features = LeadFeatures(
            lead_id=lead_dict.get("lead_id"),
            current_score=lead_dict.get("current_score", 0),
            current_stage=lead_dict.get("current_stage", "New Lead"),
            days_since_last_activity=lead_dict.get("days_since_last_activity", 0),
            reply_received=lead_dict.get("reply_received", False),
            deal_value=lead_dict.get("deal_value"),
            email_open_count=lead_dict.get("email_open_count"),
            email_opened_no_reply_flag=lead_dict.get("email_opened_no_reply_flag"),
            meeting_attendance_status=lead_dict.get("meeting_attendance_status"),
            rep_active_action_count=lead_dict.get("rep_active_action_count"),
            best_contact_time_slot=lead_dict.get("best_contact_time_slot"),
        )

        recommendation = recommend(features)

        return {
            "lead_id": recommendation.lead_id,
            "recommended_action": recommendation.recommended_action,
            "reason": recommendation.reason,
            "current_score": recommendation.current_score,
            "current_stage": recommendation.current_stage,
            "all_candidates": [
                {
                    "action": candidate.action,
                    "weight": candidate.weight,
                    "top_factor": candidate.top_factor,
                }
                for candidate in recommendation.all_candidates
            ],
            "deal_value": recommendation.deal_value,
            "email_open_count": recommendation.email_open_count,
            "meeting_attendance_status": recommendation.meeting_attendance_status,
            "rep_active_action_count": recommendation.rep_active_action_count,
            "best_contact_time_slot": recommendation.best_contact_time_slot,
        }

    except Exception as e:
        return {
            "error": str(e),
            "lead_id": lead_dict.get("lead_id"),
            "recommended_action": None,
        }
