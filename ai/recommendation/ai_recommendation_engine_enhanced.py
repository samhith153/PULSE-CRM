"""
engine.py (ENHANCED FOR BACKEND INTEGRATION)

Core rule-based logic for the Recommendation / Next-Best-Action module.

    weight(action) = w_s * score_norm + w_u * urgency + w_r * reply_factor
                   + w_dv * deal_value_norm + w_eo * email_open_norm
                   + w_mt * meeting_factor + w_rw * rep_workload_norm
                   + w_ct * contact_time_factor

    recommended_action = argmax( weight(action) )  over all actions valid
                          for the lead's current pipeline stage

The winning action's reason is generated from whichever single factor
contributed the most to its weight — so the explanation is read directly
off the math, never invented. This satisfies PULSE's "no black-box
scores or recommendations" design principle.

ENHANCED: Added orchestrator function and models import for backend services.
"""

from dataclasses import dataclass
from typing import Optional


# ═══════════════════════════════════════════════════════════════════
# DATA MODELS (Same as models.py - included here for completeness)
# ═══════════════════════════════════════════════════════════════════

@dataclass
class LeadFeatures:
    """Input: All lead data needed to generate recommendation"""
    
    lead_id: str
    current_score: float  # 0-100
    current_stage: str  # "Contacted", "Qualified", "Demo Scheduled", etc.
    days_since_last_activity: int
    reply_received: bool
    
    # Optional factors
    deal_value: Optional[float] = None
    email_open_count: Optional[int] = None
    email_opened_no_reply_flag: Optional[bool] = None
    meeting_attendance_status: Optional[str] = None
    rep_active_action_count: Optional[int] = None
    best_contact_time_slot: Optional[str] = None


@dataclass
class RecommendationResult:
    """One candidate action with score"""
    action: str
    weight: float
    top_factor: str


@dataclass
class RecommendationResponse:
    """Output: Complete recommendation"""
    lead_id: str
    recommended_action: str
    reason: str
    current_score: float
    current_stage: str
    all_candidates: list[RecommendationResult]
    
    deal_value: Optional[float] = None
    email_open_count: Optional[int] = None
    email_opened_no_reply_flag: Optional[bool] = None
    meeting_attendance_status: Optional[str] = None
    rep_active_action_count: Optional[int] = None
    best_contact_time_slot: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════
# RULES (Imported from rules.py - or include inline here)
# ═══════════════════════════════════════════════════════════════════

from dataclasses import dataclass as rule_dataclass


@rule_dataclass(frozen=True)
class ActionRule:
    """Definition of one candidate action"""
    name: str
    stages: list[str]
    weights: dict[str, float]
    invert_s: bool = False
    invert_u: bool = False
    invert_r: bool = False
    invert_dv: bool = False
    invert_eo: bool = False
    invert_mt: bool = False
    invert_rw: bool = False
    invert_ct: bool = False


ACTION_RULES: list[ActionRule] = [
    ActionRule(
        name="Send follow-up",
        stages=["Contacted", "Qualified"],
        weights={"u": 0.5, "r": 0.3, "s": 0.2, "dv": 0.1, "eo": 0.1, "rw": 0.05},
        invert_r=True,
    ),
    ActionRule(
        name="Schedule demo",
        stages=["Qualified", "Demo Scheduled"],
        weights={"s": 0.6, "u": 0.2, "r": 0.2, "dv": 0.15, "mt": 0.1},
        invert_u=True,
    ),
    ActionRule(
        name="Send proposal",
        stages=["Demo Scheduled", "Negotiation"],
        weights={"s": 0.5, "r": 0.3, "u": 0.2, "dv": 0.15, "mt": 0.15, "ct": 0.05},
        invert_u=True,
    ),
    ActionRule(
        name="Mark as stale",
        stages=["Contacted", "Qualified", "Demo Scheduled"],
        weights={"u": 0.7, "s": 0.3, "rw": 0.1, "eo": 0.05},
        invert_s=True,
    ),
    ActionRule(
        name="Escalate to manager",
        stages=["Negotiation"],
        weights={"s": 0.5, "u": 0.5, "dv": 0.15, "mt": 0.1, "rw": 0.1},
    ),
]


def actions_for_stage(stage: str) -> list[ActionRule]:
    """Return only actions valid for a given stage"""
    return [rule for rule in ACTION_RULES if stage in rule.stages]


# ═══════════════════════════════════════════════════════════════════
# CORE ENGINE FUNCTIONS
# ═══════════════════════════════════════════════════════════════════

def _normalize_inputs(features: LeadFeatures) -> dict[str, float]:
    """Convert raw features into 0-1 normalized values"""
    
    score_norm = features.current_score / 100
    urgency = min(features.days_since_last_activity / 7, 1.0)
    reply_factor = 1.0 if features.reply_received else 0.0

    # Deal value normalization
    deal_value_norm = 0.0
    if features.deal_value is not None and features.deal_value > 0:
        deal_value_norm = min(features.deal_value / 500000, 1.0)

    # Email open count normalization
    email_open_norm = 0.0
    if features.email_open_count is not None:
        email_open_norm = min(features.email_open_count / 10, 1.0)

    # Meeting attendance factor
    meeting_factor = 0.0
    if features.meeting_attendance_status == "ATTENDED":
        meeting_factor = 1.0
    elif features.meeting_attendance_status == "NO_SHOW":
        meeting_factor = 0.3
    elif features.meeting_attendance_status == "RESCHEDULED":
        meeting_factor = 0.5

    # Rep workload normalization
    rep_workload_norm = 0.0
    if features.rep_active_action_count is not None:
        rep_workload_norm = min(features.rep_active_action_count / 20, 1.0)

    # Contact time factor
    contact_time_factor = 0.0
    if features.best_contact_time_slot:
        preferred_slots = {
            "10:00-12:00": 1.0,
            "14:00-16:00": 0.9,
            "08:00-10:00": 0.7,
            "16:00-18:00": 0.5
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
    """Get factor value, optionally inverted"""
    val = normalized.get(key, 0.0)
    return (1 - val) if invert else val


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


def score_candidates(features: LeadFeatures) -> list[RecommendationResult]:
    """Score every action valid for this lead's stage"""
    
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
                top_factor=top_factor
            )
        )

    results.sort(key=lambda r: r.weight, reverse=True)
    return results


def _build_reason(features: LeadFeatures, top_factor: str) -> str:
    """Turn top contributing factor into plain English reason"""
    
    factor_reasons = {
        "urgency": (
            f"No activity in {features.days_since_last_activity} days, "
            f"and the lead is still in the '{features.current_stage}' stage."
        ),
        "score": (
            f"Lead score is {features.current_score}/100, strong enough to "
            f"justify this action at the '{features.current_stage}' stage."
        ),
        "reply status": (
            "A reply was received" if features.reply_received else "No reply yet"
        ),
        "deal value": (
            f"Deal value of ${features.deal_value:,.0f} indicates high priority."
        ) if features.deal_value else "Deal value influences this recommendation.",
        "email engagement": (
            f"Lead has opened {features.email_open_count} email(s)"
        ),
        "meeting attendance": (
            f"Meeting status is '{features.meeting_attendance_status}'"
        ) if features.meeting_attendance_status else "Meeting attendance influences this recommendation.",
        "rep workload": (
            f"Representative has {features.rep_active_action_count} active actions, workload considered."
        ),
        "contact time": (
            f"Best contact time is {features.best_contact_time_slot}."
        ) if features.best_contact_time_slot else "Contact time optimized for engagement.",
    }

    if top_factor in factor_reasons:
        return factor_reasons[top_factor]

    reply_clause = "A reply was received" if features.reply_received else "No reply yet"
    return f"{reply_clause}, which shifted the recommendation at the '{features.current_stage}' stage."


def recommend(features: LeadFeatures) -> RecommendationResponse:
    """
    Main entry point: Generate recommendation for a lead
    
    Input: LeadFeatures with lead data
    Output: RecommendationResponse with action + reason
    """
    
    candidates = score_candidates(features)

    if not candidates:
        raise ValueError(f"No candidate actions defined for stage '{features.current_stage}'")

    top = candidates[0]
    reason = _build_reason(features, top.top_factor)

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


# ═══════════════════════════════════════════════════════════════════
# ORCHESTRATOR FUNCTION (FOR BACKEND SERVICES)
# ═══════════════════════════════════════════════════════════════════

def generate_recommendation(lead_dict: dict) -> dict:
    """
    ═══════════════════════════════════════════════════════════════════
    ORCHESTRATOR - Call this from backend/services/recommendation_service.py
    ═══════════════════════════════════════════════════════════════════
    
    Input: lead_dict with all lead information
    {
        "lead_id": "lead_123",
        "current_score": 75,
        "current_stage": "Qualified",
        "days_since_last_activity": 5,
        "reply_received": False,
        "deal_value": 50000,
        "email_open_count": 3,
        "meeting_attendance_status": "ATTENDED",
        "rep_active_action_count": 8,
        "best_contact_time_slot": "10:00-12:00"
    }
    
    Output: Recommendation response as dict
    {
        "lead_id": "lead_123",
        "recommended_action": "Schedule demo",
        "reason": "Lead score is 75/100...",
        "current_score": 75,
        "current_stage": "Qualified",
        "all_candidates": [
            {"action": "Schedule demo", "weight": 0.65, "top_factor": "score"},
            {"action": "Send follow-up", "weight": 0.45, "top_factor": "urgency"}
        ]
    }
    """
    
    try:
        # STEP 1: Create LeadFeatures object from dictionary
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
        
        # STEP 2: Call the recommendation engine
        recommendation = recommend(features)
        
        # STEP 3: Convert to dictionary for return
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
                    "top_factor": candidate.top_factor
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
            "recommended_action": None
        }


# ═══════════════════════════════════════════════════════════════════
# HOW TO USE IN BACKEND
# ═══════════════════════════════════════════════════════════════════
#
# In backend/services/recommendation_service.py:
#
# from ai.scoring.engine import generate_recommendation
#
# class RecommendationService:
#     async def get_recommendation(self, lead_id: str, lead_data: dict):
#         """
#         Get recommendation for a lead
#         """
#         
#         # Prepare lead data (get from database)
#         lead_dict = {
#             "lead_id": lead_id,
#             "current_score": lead_data.get("lead_score"),
#             "current_stage": lead_data.get("pipeline_stage"),
#             "days_since_last_activity": 5,
#             "reply_received": lead_data.get("has_reply"),
#             "deal_value": lead_data.get("deal_value"),
#             "email_open_count": lead_data.get("email_opens"),
#             "meeting_attendance_status": lead_data.get("meeting_status"),
#             "rep_active_action_count": lead_data.get("rep_actions"),
#             "best_contact_time_slot": lead_data.get("best_time")
#         }
#         
#         # Call orchestrator function
#         recommendation = generate_recommendation(lead_dict)
#         
#         return recommendation
#
# ═══════════════════════════════════════════════════════════════════
