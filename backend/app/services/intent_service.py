"""
Intent Detection Service
Rule-based engine — no external LLM/AI required.
Detects primary + secondary customer intent from CRM text.
RBAC: admin=org, manager=team, sales_rep=own.
"""
from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.intent_repository import IntentRepository
from app.schemas.ai_insights import (
    IntentItem,
    IntentListResponse,
    IntentNotification,
    IntentSummaryResponse,
    IntentTimelinePoint,
    IntentTrend,
)

# ── Intent keyword catalog ────────────────────────────────────────────────────
_INTENT_KEYWORDS: dict[str, list[str]] = {
    "Purchase Intent": [
        "ready to buy", "place order", "move forward", "sign contract",
        "approve purchase", "finalize", "let's proceed", "purchase",
        "buy now", "confirm order", "go ahead",
    ],
    "Demo Request": [
        "demo", "product walkthrough", "live demo", "presentation",
        "show us", "can you show", "schedule a demo", "arrange demo",
    ],
    "Pricing Inquiry": [
        "pricing", "quote", "cost", "license", "subscription",
        "discount", "how much", "price list", "fee", "rate",
    ],
    "Proposal Request": [
        "proposal", "quotation", "commercial offer", "send a proposal",
        "draft proposal", "formal offer", "rfp",
    ],
    "Contract Review": [
        "contract", "agreement", "nda", "sla", "legal review",
        "terms and conditions", "sign off", "review contract",
    ],
    "Technical Evaluation": [
        "api", "integration", "architecture", "deployment",
        "technical documentation", "dev team", "developer", "sdk",
    ],
    "Security Review": [
        "security", "iso", "soc2", "soc 2", "compliance",
        "audit", "encryption", "gdpr", "data protection",
    ],
    "Implementation Planning": [
        "implementation", "rollout", "go-live", "migration",
        "onboarding", "setup", "configuration", "deployment plan",
    ],
    "Budget Approval": [
        "budget", "approval", "finance", "procurement",
        "purchase order", "po", "capex", "opex", "cfo",
    ],
    "Decision Maker Engagement": [
        "ceo", "cto", "cfo", "director", "vp", "head of",
        "decision maker", "leadership", "board", "executive",
    ],
    "Renewal Interest": [
        "renew", "renewal", "extend", "continue subscription",
        "keep using", "maintain service",
    ],
    "Upsell Opportunity": [
        "upgrade", "premium", "enterprise plan", "add more users",
        "expand", "additional modules",
    ],
    "Cross-sell Opportunity": [
        "other products", "additional services", "bundle",
        "what else", "cross-sell", "also interested in",
    ],
    "Support Request": [
        "support", "help", "issue", "bug", "not working",
        "error", "fix", "ticket", "escalate to support",
    ],
    "Cancellation Risk": [
        "cancel", "terminate", "refund", "leave", "switch vendor",
        "stop service", "no longer needed", "ending contract",
    ],
    "Competitor Comparison": [
        "competitor", "alternative", "compare", "better than",
        "currently using", "migration from", "switching from",
    ],
    "General Inquiry": [
        "information", "learn more", "what is", "tell me about",
        "general question", "inquiry", "just checking",
    ],
}

# ── Buying stage map ──────────────────────────────────────────────────────────
_BUYING_STAGE: dict[str, str] = {
    "General Inquiry":            "Awareness",
    "Demo Request":               "Interest",
    "Pricing Inquiry":            "Consideration",
    "Proposal Request":           "Evaluation",
    "Technical Evaluation":       "Validation",
    "Security Review":            "Validation",
    "Budget Approval":            "Decision",
    "Decision Maker Engagement":  "Decision",
    "Purchase Intent":            "Negotiation",
    "Contract Review":            "Closing",
    "Implementation Planning":    "Closing",
    "Renewal Interest":           "Expansion",
    "Upsell Opportunity":         "Expansion",
    "Cross-sell Opportunity":     "Expansion",
    "Support Request":            "Post-Sale",
    "Cancellation Risk":          "At Risk",
    "Competitor Comparison":      "Consideration",
}

# High-urgency intents for notifications
_CRITICAL_INTENTS = {"Purchase Intent", "Contract Review", "Cancellation Risk", "Decision Maker Engagement"}


# ── Rule-based engine ─────────────────────────────────────────────────────────

def _detect_intents(text: str) -> list[tuple[str, int]]:
    """
    Returns [(intent_label, hit_count)] sorted by hit_count desc.
    """
    if not text or not text.strip():
        return [("General Inquiry", 0)]
    t = text.lower()
    hits: dict[str, int] = {}
    for label, kws in _INTENT_KEYWORDS.items():
        count = sum(1 for kw in kws if kw in t)
        if count:
            hits[label] = count
    if not hits:
        return [("General Inquiry", 0)]
    return sorted(hits.items(), key=lambda x: x[1], reverse=True)


def _confidence(hits: list[tuple[str, int]], total_text_words: int) -> int:
    """
    Confidence = weighted combination of:
      - top-intent hit count (frequency)
      - hit-count density relative to text length
      - secondary-intent support (more intents = more consistent signal)
    Capped at 100.
    """
    if not hits or hits[0][1] == 0:
        return 20
    top_count  = hits[0][1]
    total_hits = sum(c for _, c in hits)
    # Keyword frequency factor (0-60)
    freq_factor = min(top_count * 12, 60)
    # Density factor (0-25) — hits per 50 words
    word_count  = max(total_text_words, 1)
    density     = (total_hits / word_count) * 50 * 10
    density_factor = min(density, 25)
    # Consistency factor (0-15) — more supporting intents
    consistency_factor = min((len(hits) - 1) * 3, 15)
    return int(round(min(freq_factor + density_factor + consistency_factor, 100)))


def _trend(cur_score: float, prev_score: float) -> IntentTrend:
    if prev_score == 0:
        return IntentTrend(trend="Stable", change="0%",
                           current_score=round(cur_score, 1),
                           previous_score=round(prev_score, 1))
    pct = ((cur_score - prev_score) / max(prev_score, 1)) * 100
    direction = "Increasing" if pct >= 10 else "Declining" if pct <= -10 else "Stable"
    sign = "+" if pct >= 0 else ""
    return IntentTrend(
        trend=direction,
        change=f"{sign}{pct:.0f}%",
        current_score=round(cur_score, 1),
        previous_score=round(prev_score, 1),
    )


def _recommend(
    primary: str,
    secondary: str | None,
    confidence: int,
    buying_stage: str,
    deal_value: float,
) -> str:
    if primary == "Purchase Intent":
        if deal_value >= 500_000:
            return "High-value purchase intent — prepare final commercial proposal and involve sales leadership."
        return "Purchase intent detected — prepare contract and schedule closing call within 24 hours."
    if primary == "Cancellation Risk":
        return "Cancellation risk detected — assign customer success manager and schedule retention call immediately."
    if primary == "Contract Review":
        return "Contract review stage — loop in legal/finance team and fast-track approvals."
    if primary == "Demo Request":
        return "Schedule product demo at the earliest opportunity and confirm with a calendar invite."
    if primary == "Pricing Inquiry":
        return "Send a detailed pricing proposal with ROI analysis within 24 hours."
    if primary == "Proposal Request":
        return "Prepare a tailored commercial proposal addressing specific customer requirements."
    if primary == "Technical Evaluation":
        return "Assign solution architect — share technical documentation, API guides, and arrange a technical meeting."
    if primary == "Security Review":
        return "Share compliance documents (ISO, SOC2, GDPR) and arrange a security briefing call."
    if primary == "Budget Approval":
        return "Provide a formal ROI report and support finance/procurement team through approval process."
    if primary == "Decision Maker Engagement":
        return "Escalate to sales manager — schedule an executive-level presentation immediately."
    if primary == "Competitor Comparison":
        return "Send a competitive battlecard and arrange a comparison demo highlighting differentiators."
    if primary == "Renewal Interest":
        return "Prepare renewal proposal with loyalty discount and proactively schedule a renewal review call."
    if primary in ("Upsell Opportunity", "Cross-sell Opportunity"):
        return "Identify relevant upsell/cross-sell products and schedule a product expansion conversation."
    if primary == "Implementation Planning":
        return "Share implementation roadmap, assign a project manager, and schedule kickoff meeting."
    if primary == "Support Request":
        return "Escalate support ticket, assign dedicated support engineer, and follow up within 2 hours."
    if confidence >= 85:
        return f"High-confidence {primary} signal — take immediate follow-up action within 24 hours."
    return "Schedule a follow-up call to clarify next steps and advance the deal."


class IntentService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = IntentRepository(db)

    # ── RBAC scope ────────────────────────────────────────────────────────────

    async def _scope(self, user: User):
        roles = {ur.role.name for ur in user.user_roles if ur.role}
        if "admin" in roles:
            return None, None
        if "sales_rep" in roles and "manager" not in roles:
            return user.id, None
        stmt = select(User.id).where(
            User.organization_id == user.organization_id,
            User.is_active.is_(True),
            User.is_deleted.is_(False),
        )
        result = await self.db.execute(stmt)
        return None, [r[0] for r in result.all()]

    # ── Per-lead item builder ─────────────────────────────────────────────────

    async def _build_item(self, row: dict[str, Any], org_id: UUID) -> IntentItem:
        lead_id   = row.get("lead_id")
        act_text  = row.get("activity_text") or ""
        email_text = ""
        if lead_id:
            email_text = await self.repo.fetch_lead_email_text(org_id, lead_id)
        full_text = act_text + " " + email_text
        word_count = len(full_text.split())

        # Detect intents
        ranked = _detect_intents(full_text)
        primary    = ranked[0][0]
        secondary  = ranked[1][0] if len(ranked) > 1 else None
        conf       = _confidence(ranked, word_count)
        buying_stage = _BUYING_STAGE.get(primary, "Awareness")
        deal_value   = float(row.get("deal_amount") or 0)
        recommendation = _recommend(primary, secondary, conf, buying_stage, deal_value)
        is_cancel_risk = primary == "Cancellation Risk"

        # Intent timeline per row
        timeline: list[IntentTimelinePoint] = []
        if lead_id:
            act_rows   = await self.repo.fetch_lead_activity_rows(org_id, lead_id)
            email_rows = await self.repo.fetch_lead_email_rows(org_id, lead_id)
            for ar in act_rows:
                t = (ar.get("title") or "") + " " + (ar.get("description") or "")
                r_hits = _detect_intents(t)
                r_conf = _confidence(r_hits, max(len(t.split()), 1))
                timeline.append(IntentTimelinePoint(
                    date=ar["created_at"],
                    intent=r_hits[0][0],
                    confidence=r_conf,
                    source_type="activity",
                    title=ar.get("title"),
                ))
            for er in email_rows:
                t = (er.get("subject") or "") + " " + (er.get("body_preview") or "")
                r_hits = _detect_intents(t)
                r_conf = _confidence(r_hits, max(len(t.split()), 1))
                timeline.append(IntentTimelinePoint(
                    date=er["sent_at"],
                    intent=r_hits[0][0],
                    confidence=r_conf,
                    source_type="email",
                    title=er.get("subject"),
                ))

        timeline.sort(
            key=lambda x: x.date if x.date.tzinfo else x.date.replace(tzinfo=timezone.utc),
            reverse=True,
        )

        # Trend
        trend_obj = IntentTrend(trend="Stable", change="0%",
                                current_score=float(conf), previous_score=float(conf))
        if lead_id:
            trend_texts = await self.repo.fetch_trend_texts(org_id, lead_id)
            def _avg_conf(texts: list[str]) -> float:
                if not texts:
                    return 0.0
                scores = [
                    _confidence(_detect_intents(t), max(len(t.split()), 1))
                    for t in texts if t.strip()
                ]
                return sum(scores) / max(len(scores), 1)
            cur_avg  = _avg_conf(trend_texts["current"])
            prev_avg = _avg_conf(trend_texts["previous"])
            trend_obj = _trend(cur_avg, prev_avg)

        last_at = row.get("last_activity_at")
        if last_at and hasattr(last_at, "tzinfo") and last_at.tzinfo is None:
            last_at = last_at.replace(tzinfo=timezone.utc)

        return IntentItem(
            lead_id=lead_id,
            customer=row.get("lead_name") or row.get("company_name") or "Unknown",
            owner=row.get("owner_name"),
            owner_id=row.get("owner_id"),
            company=row.get("company_name"),
            deal_name=row.get("deal_name"),
            deal_value=deal_value,
            primary_intent=primary,
            secondary_intent=secondary,
            confidence=conf,
            buying_stage=buying_stage,
            trend=trend_obj.trend,
            change=trend_obj.change,
            recommendation=recommendation,
            intent_timeline=timeline[:10],
            total_interactions=int(row.get("activity_count") or 0),
            last_interaction_at=last_at,
            is_cancellation_risk=is_cancel_risk,
        )

    # ── Public: list ──────────────────────────────────────────────────────────

    async def get_intents(
        self,
        user: User,
        *,
        page: int = 1,
        page_size: int = 20,
        owner_id: UUID | None = None,
        lead_id: UUID | None = None,
        company_id: UUID | None = None,
        deal_id: UUID | None = None,
        intent_filter: str | None = None,
        stage_filter: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        sort: str = "confidence_score",
    ) -> IntentListResponse:
        user_id, team_ids = await self._scope(user)
        if owner_id:
            user_id, team_ids = owner_id, None

        rows = await self.repo.fetch_lead_texts(
            user.organization_id, user_id, team_ids,
            lead_id=lead_id, company_id=company_id, deal_id=deal_id,
            date_from=date_from, date_to=date_to,
        )

        items = [await self._build_item(r, user.organization_id) for r in rows]

        # Filters
        if intent_filter:
            items = [i for i in items if i.primary_intent.lower() == intent_filter.lower()]
        if stage_filter:
            items = [i for i in items if i.buying_stage.lower() == stage_filter.lower()]

        # Sort
        if sort in ("confidence_score", "confidence"):
            items.sort(key=lambda x: x.confidence, reverse=True)
        elif sort == "deal_value":
            items.sort(key=lambda x: x.deal_value, reverse=True)
        elif sort == "interaction_date":
            items.sort(
                key=lambda x: x.last_interaction_at or datetime.min.replace(tzinfo=timezone.utc),
                reverse=True,
            )

        total = len(items)
        start = (page - 1) * page_size
        total_pages = max(1, math.ceil(total / page_size))
        return IntentListResponse(
            total_records=total,
            page=page,
            page_size=page_size,
            has_next=page < total_pages,
            data=items[start: start + page_size],
        )

    # ── Public: summary ───────────────────────────────────────────────────────

    async def get_summary(self, user: User) -> IntentSummaryResponse:
        result = await self.get_intents(user, page=1, page_size=500)
        items  = result.data

        def _count(intent: str) -> int:
            return sum(1 for i in items if i.primary_intent == intent)

        avg_conf  = round(sum(i.confidence for i in items) / max(len(items), 1), 1)
        purchase  = _count("Purchase Intent")
        closing   = sum(1 for i in items if i.buying_stage == "Closing")
        conv_rate = round((closing / max(len(items), 1)) * 100, 1)

        return IntentSummaryResponse(
            purchaseIntent=purchase,
            demoRequests=_count("Demo Request"),
            pricingInquiries=_count("Pricing Inquiry"),
            proposalRequests=_count("Proposal Request"),
            technicalEvaluations=_count("Technical Evaluation"),
            securityReviews=_count("Security Review"),
            contractReviews=_count("Contract Review"),
            cancellationRisks=_count("Cancellation Risk"),
            averageConfidence=avg_conf,
            intentConversionRate=conv_rate,
            total_analyzed=len(items),
        )

    # ── Public: timeline ──────────────────────────────────────────────────────

    async def get_timeline(
        self, user: User, lead_id: UUID | None = None
    ) -> list[IntentTimelinePoint]:
        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id

        if lead_id:
            act_rows   = await self.repo.fetch_lead_activity_rows(org_id, lead_id)
            email_rows = await self.repo.fetch_lead_email_rows(org_id, lead_id)
        else:
            from app.models.activity import ActivityTimeline
            from sqlalchemy import select as _sel
            q = (
                _sel(
                    ActivityTimeline.id,
                    ActivityTimeline.title,
                    ActivityTimeline.description,
                    ActivityTimeline.created_at,
                )
                .where(ActivityTimeline.organization_id == org_id)
                .order_by(ActivityTimeline.created_at.desc())
                .limit(100)
            )
            if user_id is not None:
                q = q.where(ActivityTimeline.created_by == user_id)
            elif team_ids is not None:
                q = q.where(ActivityTimeline.created_by.in_(team_ids))
            r = await self.db.execute(q)
            act_rows   = [dict(row) for row in r.mappings().all()]
            email_rows = []

        points: list[IntentTimelinePoint] = []
        for ar in act_rows:
            t = (ar.get("title") or "") + " " + (ar.get("description") or "")
            r_hits = _detect_intents(t)
            r_conf = _confidence(r_hits, max(len(t.split()), 1))
            points.append(IntentTimelinePoint(
                date=ar["created_at"], intent=r_hits[0][0],
                confidence=r_conf, source_type="activity",
                title=ar.get("title"),
            ))
        for er in email_rows:
            t = (er.get("subject") or "") + " " + (er.get("body_preview") or "")
            r_hits = _detect_intents(t)
            r_conf = _confidence(r_hits, max(len(t.split()), 1))
            points.append(IntentTimelinePoint(
                date=er["sent_at"], intent=r_hits[0][0],
                confidence=r_conf, source_type="email",
                title=er.get("subject"),
            ))

        points.sort(
            key=lambda x: x.date if x.date.tzinfo else x.date.replace(tzinfo=timezone.utc),
            reverse=True,
        )
        return points[:50]

    # ── Public: notifications ─────────────────────────────────────────────────

    async def get_notifications(self, user: User) -> list[IntentNotification]:
        result = await self.get_intents(user, page=1, page_size=100)
        alerts: list[IntentNotification] = []
        seen: set = set()

        for item in result.data:
            lid = item.lead_id

            # Purchase Intent
            if item.primary_intent == "Purchase Intent":
                key = (lid, "purchase_intent")
                if key not in seen:
                    seen.add(key)
                    alerts.append(IntentNotification(
                        lead_id=lid, customer=item.customer,
                        type="purchase_intent", severity="critical",
                        message=f"Purchase Intent detected — {item.customer} (confidence {item.confidence}%). Act immediately.",
                    ))

            # Contract Review
            if item.primary_intent == "Contract Review":
                key = (lid, "contract_review")
                if key not in seen:
                    seen.add(key)
                    alerts.append(IntentNotification(
                        lead_id=lid, customer=item.customer,
                        type="contract_review", severity="high",
                        message=f"Contract Review initiated — {item.customer}. Loop in legal team.",
                    ))

            # Cancellation Risk
            if item.is_cancellation_risk:
                key = (lid, "cancellation_risk")
                if key not in seen:
                    seen.add(key)
                    alerts.append(IntentNotification(
                        lead_id=lid, customer=item.customer,
                        type="cancellation_risk", severity="critical",
                        message=f"Cancellation risk detected — {item.customer}. Assign retention specialist now.",
                    ))

            # High confidence (≥ 90)
            if item.confidence >= 90 and item.primary_intent not in _CRITICAL_INTENTS:
                key = (lid, "high_confidence")
                if key not in seen:
                    seen.add(key)
                    alerts.append(IntentNotification(
                        lead_id=lid, customer=item.customer,
                        type="high_confidence", severity="high",
                        message=f"High-confidence {item.primary_intent} ({item.confidence}%) — {item.customer}. Follow up today.",
                    ))

            # Stage escalation: Evaluation → Negotiation
            if item.buying_stage in ("Negotiation", "Closing"):
                key = (lid, "stage_escalation")
                if key not in seen:
                    seen.add(key)
                    alerts.append(IntentNotification(
                        lead_id=lid, customer=item.customer,
                        type="stage_escalation", severity="high",
                        message=f"{item.customer} has reached {item.buying_stage} stage — escalate and prioritize.",
                    ))

            # Decision Maker Engagement
            if item.primary_intent == "Decision Maker Engagement":
                key = (lid, "decision_maker")
                if key not in seen:
                    seen.add(key)
                    alerts.append(IntentNotification(
                        lead_id=lid, customer=item.customer,
                        type="decision_maker", severity="critical",
                        message=f"Decision maker engaged — {item.customer}. Schedule executive presentation immediately.",
                    ))

        sev = {"critical": 3, "high": 2, "medium": 1}
        alerts.sort(key=lambda a: sev.get(a.severity, 0), reverse=True)
        return alerts[:50]
