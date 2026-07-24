"""Provider interfaces and rule-based AI implementations."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Protocol

from app.core.config import settings
from app.models.deal import Deal
from app.models.email import Email
from app.models.lead import Lead


@dataclass(slots=True)
class FeatureSet:
    entity_type: str
    values: dict[str, object] = field(default_factory=dict)


@dataclass(slots=True)
class ScoreResult:
    score: int
    confidence: int
    factors: list[str]
    metadata: dict[str, object]


@dataclass(slots=True)
class RecommendationResult:
    actions: list[str]
    rationale: str
    metadata: dict[str, object]


@dataclass(slots=True)
class SummaryResult:
    summary: str
    bullets: list[str]
    metadata: dict[str, object]


class ScoringProvider(Protocol):
    def score_lead(self, lead: Lead, features: FeatureSet) -> ScoreResult: ...
    def score_deal(self, deal: Deal, features: FeatureSet) -> ScoreResult: ...


class RecommendationProvider(Protocol):
    def recommend(self, entity_type: str, entity: object | None, features: FeatureSet, score: int | None = None) -> RecommendationResult: ...


class ConversationSummaryProvider(Protocol):
    def summarize_emails(self, emails: list[Email], prompt: str | None = None) -> SummaryResult: ...


class FeatureExtractionService:
    def lead_features(self, lead: Lead, emails: list[Email]) -> FeatureSet:
        return FeatureSet(
            entity_type="lead",
            values={
                "status": lead.status,
                "source": lead.source,
                "estimated_value": float(lead.estimated_value or Decimal("0")),
                "has_company": bool(lead.company_id),
                "has_contact": bool(lead.contact_id),
                "has_owner": bool(lead.owner_id),
                "industry": lead.industry,
                "current_crm": lead.current_crm,
                "email_count": len(emails),
                "read_email_count": sum(1 for email in emails if email.is_read),
            },
        )

    def deal_features(self, deal: Deal, emails: list[Email]) -> FeatureSet:
        today = date.today()
        days_to_close = (deal.expected_close_date - today).days if deal.expected_close_date else None
        return FeatureSet(
            entity_type="deal",
            values={
                "status": deal.status,
                "amount": float(deal.amount or Decimal("0")),
                "probability": deal.probability,
                "has_owner": bool(deal.owner_id),
                "has_contact": bool(deal.contact_id),
                "has_company": bool(deal.company_id),
                "pipeline_stage_id": str(deal.pipeline_stage_id) if deal.pipeline_stage_id else None,
                "days_to_close": days_to_close,
                "email_count": len(emails),
                "read_email_count": sum(1 for email in emails if email.is_read),
            },
        )


class RuleBasedScorer:
    provider_name = "rule_based"

    def score_lead(self, lead: Lead, features: FeatureSet) -> ScoreResult:
        values = features.values
        score = 35
        factors: list[str] = []
        status_weights = {"new": 5, "contacted": 12, "qualified": 22, "proposal_sent": 28, "negotiation": 32, "won": 40, "lost": -25}
        status_delta = status_weights.get(str(values.get("status") or "").lower(), 0)
        score += status_delta
        factors.append(f"Lead status contributes {status_delta:+d} points.")

        estimated_value = float(values.get("estimated_value") or 0)
        if estimated_value >= 50000:
            score += 18
            factors.append("High estimated value increases priority.")
        elif estimated_value >= 10000:
            score += 10
            factors.append("Moderate estimated value supports qualification.")

        for field_name, label in (("has_company", "company"), ("has_contact", "contact"), ("has_owner", "owner")):
            if values.get(field_name):
                score += 6
                factors.append(f"Linked {label} data improves confidence.")
            else:
                score -= 4
                factors.append(f"Missing {label} data reduces confidence.")

        email_count = int(values.get("email_count") or 0)
        if email_count >= 3:
            score += 12
            factors.append("Multiple email interactions show engagement.")
        elif email_count == 0:
            score -= 8
            factors.append("No email engagement recorded yet.")

        if values.get("current_crm"):
            score += 5
            factors.append("Current CRM data reveals migration potential.")

        bounded = max(0, min(100, score))
        confidence = min(95, 45 + len(factors) * 7)
        return ScoreResult(score=bounded, confidence=confidence, factors=factors, metadata=dict(values))

    def score_deal(self, deal: Deal, features: FeatureSet) -> ScoreResult:
        values = features.values
        score = int(values.get("probability") or 50)
        factors = [f"Deal probability starts the score at {score}."]
        amount = float(values.get("amount") or 0)
        if amount >= 50000:
            score += 10
            factors.append("Large deal amount raises potential impact.")
        if values.get("has_owner"):
            score += 5
            factors.append("Assigned owner improves accountability.")
        else:
            score -= 10
            factors.append("Missing owner increases execution risk.")
        days_to_close = values.get("days_to_close")
        if isinstance(days_to_close, int):
            if days_to_close < 0 and str(values.get("status")).lower() == "open":
                score -= 20
                factors.append("Expected close date has passed while deal remains open.")
            elif days_to_close <= 14:
                score += 5
                factors.append("Close date is near, so timely action matters.")
        email_count = int(values.get("email_count") or 0)
        if email_count == 0:
            score -= 8
            factors.append("No email engagement is attached to the deal.")
        elif email_count >= 2:
            score += 8
            factors.append("Recent email history supports deal momentum.")
        return ScoreResult(score=max(0, min(100, score)), confidence=75, factors=factors, metadata=dict(values))


class RuleBasedRecommendationProvider:
    provider_name = "rule_based"

    def recommend(self, entity_type: str, entity: object | None, features: FeatureSet, score: int | None = None) -> RecommendationResult:
        values = features.values
        actions: list[str] = []
        reasons: list[str] = []
        numeric_score = score if score is not None else 50

        if numeric_score >= 75:
            actions.append("Schedule an executive follow-up within 24 hours.")
            reasons.append("The score indicates strong buying intent or high value.")
        elif numeric_score < 45:
            actions.append("Enrich missing qualification data before spending more sales time.")
            reasons.append("The score is limited by missing data or weak engagement.")
        else:
            actions.append("Send a targeted nurture email with one clear next step.")
            reasons.append("The opportunity has enough signal for continued engagement.")

        status = str(values.get("status") or "").lower()
        if status in {"new", "contacted"}:
            actions.append("Qualify budget, authority, need, and timeline.")
            reasons.append("Early-stage records need qualification before pipeline commitment.")
        if status in {"proposal_sent", "negotiation", "open"}:
            actions.append("Confirm decision criteria and close blockers.")
            reasons.append("Later-stage opportunities benefit from explicit blocker removal.")
        if int(values.get("email_count") or 0) == 0:
            actions.append("Start email engagement and attach the conversation to the CRM record.")
            reasons.append("No email engagement is currently linked.")

        return RecommendationResult(actions=actions[:4], rationale=" ".join(reasons), metadata=dict(values))


class RuleBasedConversationSummaryProvider:
    provider_name = "rule_based"

    def summarize_emails(self, emails: list[Email], prompt: str | None = None) -> SummaryResult:
        ordered = sorted(emails, key=lambda item: item.sent_at or item.created_at)
        if not ordered:
            return SummaryResult(summary=prompt or "No conversation history is available yet.", bullets=[], metadata={"email_count": 0})
        subjects = [email.subject for email in ordered if email.subject]
        participants = sorted({email.sender for email in ordered if email.sender} | {email.receiver for email in ordered if email.receiver})
        latest = ordered[-1]
        summary = f"Conversation with {', '.join(participants[:4])} spans {len(ordered)} email(s). Latest topic: {latest.subject}."
        bullets = []
        if subjects:
            bullets.append(f"Topics discussed: {', '.join(dict.fromkeys(subjects[:5]))}.")
        if latest.body_preview:
            bullets.append(f"Latest message preview: {latest.body_preview[:180]}")
        inbound = sum(1 for email in ordered if email.direction == "inbound")
        outbound = sum(1 for email in ordered if email.direction == "outbound")
        bullets.append(f"Engagement mix: {inbound} inbound and {outbound} outbound message(s).")
        return SummaryResult(summary=summary, bullets=bullets, metadata={"email_count": len(ordered), "participants": participants})


def get_scoring_provider() -> ScoringProvider:
    return RuleBasedScorer()


def get_recommendation_provider() -> RecommendationProvider:
    return RuleBasedRecommendationProvider()


def get_summary_provider() -> ConversationSummaryProvider:
    return RuleBasedConversationSummaryProvider()
