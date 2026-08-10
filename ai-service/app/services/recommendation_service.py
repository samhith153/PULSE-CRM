"""
Recommendation Engine — ported exactly from ai/recommendation/ai_recommendation_engine_enhanced.py.

Orchestrates the recommendation pipeline:
  1. Normalize lead data → internal feature keys
  2. Compute per-action weighted scores
  3. Return ranked recommendations with reasons
"""

from app.rules.recommendation_rules import ACTION_RULES, actions_for_stage
from app.rules.feature_rules import build_lead_features, is_terminal, get_stage


FACTOR_LABELS = {
    "s": "score",
    "u": "urgency",
    "r": "is_replied",
    "dv": "deal_value",
    "eo": "open_count",
    "mt": "meeting_attendance",
    "rw": "rep_workload",
    "ct": "contact_time",
}


def _normalize_inputs(lead):
    if not lead.get("score") and lead.get("engagement_score"):
        lead["score"] = lead["engagement_score"]

    if not lead.get("last_outbound_date") and lead.get("days_since_last_outbound") is not None:
        from datetime import datetime, timezone, timedelta
        days = lead["days_since_last_outbound"]
        lead["last_outbound_date"] = datetime.now(timezone.utc) - timedelta(days=days)

    # Parse last_contact_time if it's a string (ISO format)
    if lead.get("last_contact_time") and isinstance(lead["last_contact_time"], str):
        from datetime import datetime
        try:
            lead["last_contact_time"] = datetime.fromisoformat(
                lead["last_contact_time"].replace("Z", "+00:00")
            )
        except (ValueError, TypeError):
            pass

    if not lead.get("buying_stage") and lead.get("current_stage"):
        lead["buying_stage"] = lead["current_stage"]

    if not lead.get("deal_value"):
        deal_value = lead.get("deal_value")
        if deal_value is None:
            tags = lead.get("tags") or []
            if "enterprise" in tags:
                lead["deal_value"] = 100000
            elif "mid-market" in tags:
                lead["deal_value"] = 30000
            elif "smb" in tags:
                lead["deal_value"] = 5000
            else:
                lead["deal_value"] = 10000

    if lead.get("open_count") is None and lead.get("outbound_thread"):
        lead["open_count"] = len(lead["outbound_thread"])

    if lead.get("is_replied") is None:
        lead["is_replied"] = lead.get("inbound_thread") and len(lead["inbound_thread"]) > 0

    if lead.get("email"):
        lead["email"] = lead["email"].strip().lower()

    return lead


def _get_factor_value(factor, lead_features):
    try:
        if factor == "s":
            return float(lead_features.get("engagement_score") or 0)
        elif factor == "u":
            return float(lead_features.get("contact_time") or 0) * 100
        elif factor == "r":
            return 100 if lead_features.get("is_outbound") else 0
        elif factor == "dv":
            return 100 if float(lead_features.get("deal_value") or 0) > 0 else 0
        elif factor == "eo":
            return float(lead_features.get("open_count") or 0) * 10
        elif factor == "mt":
            return float(lead_features.get("meeting_attendance") or 0) * 100
        elif factor == "rw":
            return (1 - float(lead_features.get("rep_workload") or 0.5)) * 100
        elif factor == "ct":
            return float(lead_features.get("contact_time") or 0) * 100
    except (TypeError, ValueError):
        return 0
    return 0


def score_candidates(candidates, lead_features, top_n=5):
    scored = []

    for rule in candidates:
        weighted_sum = 0.0
        weight_total = 0.0

        for factor, weight in rule.weights.items():
            value = _get_factor_value(factor, lead_features)

            invert_flag = getattr(rule, f"invert_{factor}", False)
            if invert_flag:
                value = 100 - value

            weighted_sum += value * weight
            weight_total += weight

        if weight_total > 0:
            final_score = weighted_sum / weight_total
        else:
            final_score = 0.0

        scored.append({
            "action": rule.name,
            "score": round(final_score, 2),
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_n]


def _build_reason(lead_features, action):
    reasons = []

    score = lead_features["engagement_score"]
    contact_time = lead_features["contact_time"]
    is_outbound = lead_features["is_outbound"]
    subject = lead_features.get("subject")
    open_count = lead_features.get("open_count", 0)
    deal_value = lead_features.get("deal_value", 0)
    meeting_attendance = lead_features.get("meeting_attendance", 0)
    rep_workload = lead_features.get("rep_workload", 0.5)

    if contact_time > 80:
        reasons.append("High intent — lead recently active")
    elif contact_time > 50:
        reasons.append("Moderate intent — lead engaged recently")
    elif contact_time > 20:
        reasons.append("Low intent — lead was active some time ago")
    else:
        reasons.append("No recent activity — lead is cold")

    if is_outbound:
        reasons.append("Latest email from customer (inbound)")
    else:
        reasons.append("Latest email from us (outbound)")

    if subject:
        reasons.append(f"Subject: {subject}")

    if action == "Send follow-up email" and open_count > 3:
        reasons.append("High open count suggests interest")

    if action == "Schedule a product demo" and score >= 60:
        reasons.append("Strong engagement score")

    if action == "Mark as stale" and contact_time < 20:
        reasons.append("Low contact time indicates disengagement")

    if action == "Follow up on proposal":
        reasons.append("Proposal has been sent — timely follow-up needed")

    return reasons


def recommend(lead, top_n=5):
    raw_stage = lead.get("buying_stage") or lead.get("current_stage") or "new"
    stage = get_stage(raw_stage)  # normalize slug → title-case

    if is_terminal(raw_stage):
        return {
            "recommendations": [],
            "lead_id": lead.get("contact_id") or lead.get("id"),
            "stage": stage,
        }

    candidates = actions_for_stage(stage)

    if not candidates:
        return {
            "recommendations": [],
            "lead_id": lead.get("contact_id") or lead.get("id"),
            "stage": stage,
        }

    lead = _normalize_inputs(lead)
    lead_features = build_lead_features(lead)

    scored = score_candidates(candidates, lead_features, top_n=top_n)

    recommendations = []
    for item in scored:
        reasons = _build_reason(lead_features, item["action"])
        recommendations.append({
            "action": item["action"],
            "score": item["score"],
            "reasons": reasons,
        })

    return {
        "recommendations": recommendations,
        "lead_id": lead.get("contact_id") or lead.get("id"),
        "stage": stage,
        "engagement_score": lead_features["engagement_score"],
        "contact_time": lead_features["contact_time"],
        "deal_value": lead_features.get("deal_value"),
    }


def generate_recommendation(lead, top_n=5):
    result = recommend(lead, top_n=top_n)

    if not result["recommendations"]:
        return {
            "status": "no_recommendation",
            "reason": "Lead is in terminal stage or no actions available",
            "lead_id": result["lead_id"],
            "stage": result["stage"],
        }

    top = result["recommendations"][0]

    return {
        "status": "recommendation",
        "recommendation": {
            "action": top["action"],
            "score": top["score"],
            "reasons": top["reasons"],
            "all_recommendations": result["recommendations"],
            "lead_id": result["lead_id"],
            "stage": result["stage"],
            "engagement_score": result.get("engagement_score"),
            "contact_time": result.get("contact_time"),
            "deal_value": result.get("deal_value"),
        },
    }
