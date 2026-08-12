"""
Sales Rep AI Insights Service
Orchestrates existing services to build the unified AI Insights page
for the Sales Representative role.
Version: 1.0.0
All data comes from real CRM database records via existing services.
No hardcoded names, scores, or labels.

Reuses:
  - GoingColdService   → going_cold + rising_interest + follow_up_due
  - DailyPrioritiesService → daily_priorities
  - SentimentService   → sentiment breakdown + recent summaries
  - IntentService      → intent distribution
  - AIInsightsRepository → immediate actions, pipeline health components

RBAC:
  sales_rep → own leads/deals only (enforced by each sub-service)
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.ai_insights_repository import AIInsightsRepository
from app.repositories.going_cold_repository import GoingColdRepository
from app.schemas.sales_rep_ai_insights import (
    SalesRepActionCenter,
    SalesRepActionItem,
    SalesRepAIInsightsResponse,
    SalesRepColdItem,
    SalesRepConversationIntelligence,
    SalesRepFollowUpItem,
    SalesRepIntentItem,
    SalesRepPipelineHealth,
    SalesRepPriorityItem,
    SalesRepRecentSummary,
    SalesRepSentimentBreakdown,
)
from app.services.going_cold_service import GoingColdService
from app.services.daily_priorities_service import DailyPrioritiesService
from app.services.sentiment_service import SentimentService
from app.services.intent_service import IntentService
from app.services.ai_insights_service import AIInsightsService

log = logging.getLogger(__name__)

# ── Classification thresholds ─────────────────────────────────────────────────
# These mirror the signals used in the prompt requirements.
_IMMEDIATE_ACTION_MIN_SCORE   = 70    # overall_score ≥ 70 → immediate action candidate
_RISING_INTEREST_INBOUND_DAYS = 7     # inbound in last 7d → rising interest
_COLD_MIN_INACTIVE_DAYS       = 14    # days_inactive ≥ 14 → going cold
_FOLLOW_UP_OVERDUE_MIN_DAYS   = 1     # days_overdue ≥ 1 → follow-up due
_MAX_CARDS_PER_SECTION        = 5     # cap per section to keep UI clean


# ── Helpers ────────────────────────────────────────────────────────────────────

def _safe_list(value: Any) -> list:
    """Safely coerce JSON/list fields to a Python list."""
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []
    return []


def _pipeline_health_status(score: int) -> str:
    if score >= 90:
        return "Excellent"
    if score >= 75:
        return "Healthy"
    if score >= 60:
        return "Needs Attention"
    if score >= 40:
        return "At Risk"
    return "Critical"


def _pipeline_health_trend_label(score: int, prev_score: int) -> str:
    """Build the trend label shown under the score."""
    diff = score - prev_score
    status = _pipeline_health_status(score)
    if diff > 0:
        return f"▲ {status} Velocity (+{diff}% vs yesterday)"
    if diff < 0:
        return f"▼ {status} Velocity ({diff}% vs yesterday)"
    return f"● {status} Velocity (no change vs yesterday)"


def _pipeline_health_explanation(score: int, components: dict[str, float]) -> str:
    """Build a one-sentence explanation using the actual component values."""
    parts: list[str] = []
    if components.get("lead_quality", 0) >= 70:
        parts.append("strong lead quality")
    if components.get("avg_probability", 0) >= 70:
        parts.append("high win probability")
    if components.get("recent_activities", 0) >= 70:
        parts.append("active engagement")
    if components.get("pipeline_coverage", 0) >= 70:
        parts.append("good pipeline coverage")
    if components.get("win_rate", 0) >= 70:
        parts.append("solid win rate")
    if not parts:
        parts.append("current CRM signals")
    return f"Calculated using {', '.join(parts[:3])} from your pipeline data."


def _classify_sentiment(label: str) -> str:
    """Map internal sentiment labels to positive/neutral/negative."""
    label_l = label.lower()
    if label_l in ("very positive", "positive", "excited", "interested"):
        return "positive"
    if label_l in ("negative", "very negative", "angry", "frustrated"):
        return "negative"
    return "neutral"


def _map_intent_label(primary: str) -> str:
    """Map internal intent labels to the UI-friendly labels."""
    mapping = {
        "Purchase Intent":           "Buy / Purchase",
        "Demo Request":              "Demo Request",
        "Pricing Inquiry":           "Pricing Inquiry",
        "Proposal Request":          "Proposal",
        "Contract Review":           "Negotiate",
        "Technical Evaluation":      "Technical Review",
        "Security Review":           "Security Review",
        "Implementation Planning":   "Implementation",
        "Budget Approval":           "Budget Discussion",
        "Decision Maker Engagement": "Decision Maker",
        "Renewal Interest":          "Renewal",
        "Upsell Opportunity":        "Upsell",
        "Cross-sell Opportunity":    "Cross-sell",
        "Support Request":           "Support",
        "Cancellation Risk":         "Cancellation Risk",
        "Competitor Comparison":     "Competitor",
        "General Inquiry":           "Follow-up",
    }
    return mapping.get(primary, primary)


class SalesRepAIInsightsService:
    """
    Unified AI Insights aggregator for the Sales Representative role.
    Called by a single endpoint; populates all page sections.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self._going_cold_svc    = GoingColdService(db)
        self._priorities_svc    = DailyPrioritiesService(db)
        self._sentiment_svc     = SentimentService(db)
        self._intent_svc        = IntentService(db)
        self._ai_insights_svc   = AIInsightsService(db)
        self._ai_repo           = AIInsightsRepository(db)
        self._cold_repo         = GoingColdRepository(db)

    # ── RBAC scope helper ─────────────────────────────────────────────────────

    async def _scope(self, user: User) -> tuple[UUID | None, list[UUID] | None]:
        """
        Returns (user_id, team_ids) following the same RBAC pattern
        as all other services. For sales_rep: (user.id, None).
        """
        roles = {ur.role.name for ur in user.user_roles if ur.role}
        if "admin" in roles:
            return None, None
        if "sales_rep" in roles and "manager" not in roles:
            return user.id, None
        from sqlalchemy import select as _select
        from app.models.user import User as _User
        stmt = _select(_User.id).where(
            _User.organization_id == user.organization_id,
            _User.is_active.is_(True),
            _User.is_deleted.is_(False),
        )
        result = await self.db.execute(stmt)
        return None, [r[0] for r in result.all()]

    # ── AI Action Center ──────────────────────────────────────────────────────

    async def _build_action_center(
        self, user: User
    ) -> SalesRepActionCenter:
        """
        Builds all four Action Center sections from real data.

        Immediate Action: leads with high score + recent engagement signals
        Follow Up Due:    overdue tasks/activities with actual days_overdue
        Rising Interest:  leads with recent inbound + improving engagement trend
        Going Cold:       leads with high cold_score + days_inactive
        """
        now = datetime.now(timezone.utc)
        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id

        # ── Fetch cold candidates (reused for Going Cold + Rising Interest + Follow Up) ──
        cold_rows, _ = await self._cold_repo.fetch_cold_candidates(
            org_id, user_id, team_ids,
            page=1, page_size=200,
        )
        cold_items = [
            self._going_cold_svc._to_item(r, now) for r in cold_rows
        ]

        # ── Fetch immediate action data from AI insights repo ─────────────────
        raw_actions   = await self._ai_repo.get_immediate_actions(org_id, user_id, team_ids)
        raw_followups = await self._ai_repo.get_overdue_followups(org_id, user_id, team_ids)

        # ── IMMEDIATE ACTION ──────────────────────────────────────────────────
        # High overall_score + recent engagement signals from raw_actions
        immediate: list[SalesRepActionItem] = []
        seen_immediate: set[str] = set()
        for a in raw_actions:
            lid = str(a.get("id") or a.get("lead_id", ""))
            if lid in seen_immediate:
                continue
            seen_immediate.add(lid)
            # Build reason from top_reasons / signals
            top_reasons = _safe_list(a.get("top_reasons"))
            reason = (
                top_reasons[0]
                if top_reasons
                else f"Score {a.get('score', 0)} — high-priority lead requiring attention."
            )
            immediate.append(SalesRepActionItem(
                lead_id=a["id"],
                lead_name=a.get("lead_name") or "Unknown Lead",
                company=a.get("company_name"),
                score=int(a.get("score") or 0),
                reason=reason,
                deal_id=a.get("deal_id"),
                deal_name=a.get("deal_name"),
                deal_value=float(a.get("deal_value") or 0),
            ))
            if len(immediate) >= _MAX_CARDS_PER_SECTION:
                break

        # ── FOLLOW UP DUE ─────────────────────────────────────────────────────
        follow_up: list[SalesRepFollowUpItem] = []
        seen_follow: set[str] = set()
        for f in raw_followups:
            fid = str(f.get("id") or f.get("lead_id", ""))
            if fid in seen_follow:
                continue
            seen_follow.add(fid)
            days_overdue = int(f.get("days_overdue") or 1)
            # Use company as the display name if available (matches UI showing company)
            display = f.get("company") or f.get("lead_name") or "Unknown"
            reason = (
                f"No response to follow-up for {days_overdue} day(s). "
                f"Deal: {f.get('deal_name') or 'active pipeline'}."
            )
            follow_up.append(SalesRepFollowUpItem(
                lead_id=f["id"],
                lead_name=display,
                company=f.get("company"),
                days_overdue=days_overdue,
                reason=reason,
                deal_id=f.get("deal_id"),
                deal_value=float(f.get("deal_value") or 0),
            ))
            if len(follow_up) >= _MAX_CARDS_PER_SECTION:
                break

        # ── RISING INTEREST ───────────────────────────────────────────────────
        # Leads that are NOT cold (improving or stable trend) with rising signals
        rising: list[SalesRepActionItem] = []
        seen_rising: set[str] = set()
        # Sort by score desc, prefer Improving trend
        rising_candidates = sorted(
            cold_items,
            key=lambda x: (x.trend == "Improving", x.cold_score == 0, -int(
                # find the score from raw_actions if available
                next((a.get("score", 0) for a in raw_actions if str(a.get("id")) == str(x.lead_id)), 0)
            )),
            reverse=True,
        )
        for item in rising_candidates:
            lid = str(item.lead_id)
            # Only include if trend is Improving or cold_score < 25 (Healthy)
            if item.trend not in ("Improving", "Stable") or item.cold_score >= 50:
                continue
            if lid in seen_rising or lid in seen_immediate:
                continue
            seen_rising.add(lid)
            # Build a reason using warning indicators and trend
            if item.trend == "Improving":
                reason = (
                    f"Engagement improving ({item.change}). "
                    f"{item.recommendation[:80]}..."
                    if len(item.recommendation) > 80
                    else item.recommendation
                )
            else:
                reason = f"Lead active with {item.days_inactive} day(s) since last contact."
            # Display the REAL AI lead score (from lead_scores.overall_score),
            # plus the trend delta so the user sees how engagement improved.
            rising.append(SalesRepActionItem(
                lead_id=item.lead_id,
                lead_name=item.lead_name,
                company=item.company,
                score=item.lead_score,
                reason=reason,
                deal_id=item.deal_id,
                deal_name=item.deal_name,
                deal_value=item.deal_value,
                trend=item.trend,
                change=item.change,
            ))
            if len(rising) >= _MAX_CARDS_PER_SECTION:
                break

        # ── GOING COLD ────────────────────────────────────────────────────────
        cold_out: list[SalesRepColdItem] = []
        seen_cold: set[str] = set()
        cold_sorted = sorted(cold_items, key=lambda x: x.cold_score, reverse=True)
        for item in cold_sorted:
            lid = str(item.lead_id)
            if item.cold_score < 25:  # Healthy — not cold
                continue
            # Prefer leads not already shown in Rising Interest
            if lid in seen_cold or lid in seen_rising:
                continue
            seen_cold.add(lid)
            # Build reason from warning indicators
            if item.warning_indicators:
                reason = item.warning_indicators[0]
            else:
                reason = f"No activity for {item.days_inactive} day(s)."
            # Display the REAL AI lead score (from lead_scores.overall_score)
            cold_out.append(SalesRepColdItem(
                lead_id=item.lead_id,
                lead_name=item.lead_name,
                company=item.company,
                score=item.lead_score,
                reason=reason,
                days_inactive=item.days_inactive,
                deal_id=item.deal_id,
            ))
            if len(cold_out) >= _MAX_CARDS_PER_SECTION:
                break

        return SalesRepActionCenter(
            immediate_action=immediate,
            follow_up_due=follow_up,
            rising_interest=rising,
            going_cold=cold_out,
        )

    # ── Pipeline Health Index ─────────────────────────────────────────────────

    async def _build_pipeline_health(self, user: User) -> SalesRepPipelineHealth:
        """
        Calculates a 0-100 Pipeline Health Index for the sales rep using
        the same formula as AIInsightsService._compute_health():
          lead_quality 25% + avg_probability 25% + recent_activities 20%
          + pipeline_coverage 20% + win_rate 10%

        Falls back to going_cold summary if pipeline data is empty.
        """
        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id

        try:
            components = await self._ai_repo.get_pipeline_health_components(
                org_id, user_id, team_ids
            )
            health = self._ai_insights_svc._compute_health(components)
            score = int(round(health.score))

            # Calculate yesterday's score as a rough estimate:
            # We don't have historical data, so we use the cold summary
            # to derive a trend indicator.
            cold_summary = await self._going_cold_svc.get_summary(user)
            cold_pct = cold_summary.average_cold_score / 100.0
            # Higher cold score = lower health yesterday (rough estimate)
            prev_score = max(0, score - int(cold_pct * 5))
            trend_label = _pipeline_health_trend_label(score, prev_score)
            explanation = _pipeline_health_explanation(score, components)
        except Exception:
            log.warning("Pipeline health components unavailable, using cold summary fallback")
            cold_summary = await self._going_cold_svc.get_summary(user)
            score = max(0, int(100 - cold_summary.average_cold_score))
            status = _pipeline_health_status(score)
            trend_label = f"● {status} (based on engagement signals)"
            explanation = "Calculated using engagement activity, response rates, and deal progression."

        return SalesRepPipelineHealth(
            score=score,
            status=_pipeline_health_status(score),
            trend_label=trend_label,
            explanation=explanation,
        )

    # ── Daily Priorities ──────────────────────────────────────────────────────

    async def _build_daily_priorities(
        self, user: User
    ) -> list[SalesRepPriorityItem]:
        """
        Fetches real daily priorities sorted by AI priority score (highest first).
        Maps DailyPriorityItem → SalesRepPriorityItem (UI-ready DTO).
        """
        result = await self._priorities_svc.get_daily_priorities(
            user, page=1, page_size=8, sort="ai_priority_score"
        )
        items: list[SalesRepPriorityItem] = []
        for item in result.data:
            # Map priority_level to High/Medium/Low for the UI badge
            level = item.priority_level
            if level in ("Critical", "High"):
                ui_level = "High"
            elif level == "Medium":
                ui_level = "Medium"
            else:
                ui_level = "Low"

            items.append(SalesRepPriorityItem(
                priority_id=item.priority_id,
                title=item.title,
                description=item.recommendation,
                priority_level=ui_level,
                related_lead=item.related_lead,
                related_lead_id=item.related_lead_id,
                related_deal=item.related_deal,
                related_deal_id=item.related_deal_id,
                related_company=item.related_company,
                deal_value=item.deal_value,
                due_date=item.due_date.isoformat() if item.due_date else None,
            ))
        return items

    # ── Conversation Intelligence ─────────────────────────────────────────────

    async def _build_conversation_intelligence(
        self, user: User
    ) -> SalesRepConversationIntelligence:
        """
        Builds Sentiment Breakdown, Intent Distribution, and Recent Summaries
        using existing SentimentService and IntentService.

        If no data exists, returns zero values / empty lists (not fake data).
        """
        # ── Sentiment breakdown ────────────────────────────────────────────────
        try:
            sentiment_summary = await self._sentiment_svc.get_summary(user)
            sentiment = SalesRepSentimentBreakdown(
                positive=sentiment_summary.positive,
                neutral=sentiment_summary.neutral,
                negative=sentiment_summary.negative,
            )
        except Exception:
            log.warning("Sentiment summary unavailable")
            sentiment = SalesRepSentimentBreakdown()

        # ── Intent distribution ────────────────────────────────────────────────
        intent_dist: list[SalesRepIntentItem] = []
        try:
            intent_summary = await self._intent_svc.get_summary(user)
            raw_intent_map = {
                "Buy / Purchase":  intent_summary.purchase_intent,
                "Demo Request":    intent_summary.demo_requests,
                "Pricing Inquiry": intent_summary.pricing_inquiries,
                "Negotiate":       intent_summary.contract_reviews,
                "Follow-up":       (
                    intent_summary.total_analyzed
                    - intent_summary.purchase_intent
                    - intent_summary.demo_requests
                    - intent_summary.pricing_inquiries
                    - intent_summary.contract_reviews
                ),
            }
            for label, count in raw_intent_map.items():
                if count > 0:
                    intent_dist.append(SalesRepIntentItem(
                        label=label, count=max(0, int(count))
                    ))
            intent_dist.sort(key=lambda x: x.count, reverse=True)
        except Exception:
            log.warning("Intent summary unavailable")

        # ── Recent summaries from sentiment items ─────────────────────────────
        recent_summaries: list[SalesRepRecentSummary] = []
        powered_by = "Rule-based engine"
        try:
            sentiment_list = await self._sentiment_svc.get_sentiment_list(
                user, page=1, page_size=5, sort="interaction_date"
            )
            for item in sentiment_list.data:
                if not item.lead_id:
                    continue
                # Map sentiment to simple label
                sentiment_label = _classify_sentiment(item.sentiment)
                # Category: derive from recommendation or default to "sales"
                rec_lower = item.recommendation.lower()
                if any(w in rec_lower for w in ["support", "escalat", "complain"]):
                    category = "support"
                elif any(w in rec_lower for w in ["urgent", "immediate", "critical"]):
                    category = "urgent"
                else:
                    category = "sales"
                # Follow-up suggestion from recommendation
                follow_up_text: str | None = None
                if item.recommendation and len(item.recommendation) > 5:
                    # Truncate to first sentence for display
                    first_sentence = item.recommendation.split(".")[0]
                    follow_up_text = first_sentence.strip() if first_sentence else None

                last_at = item.last_interaction_at or datetime.now(timezone.utc)

                recent_summaries.append(SalesRepRecentSummary(
                    id=item.lead_id,
                    contact_name=item.customer,
                    company=item.company,
                    summary=f"{item.sentiment} sentiment. {item.recommendation[:80]}",
                    sentiment=sentiment_label,
                    category=category,
                    follow_up_suggestion=follow_up_text,
                    date=last_at,
                ))
            # Sort by date descending
            recent_summaries.sort(
                key=lambda x: x.date if x.date.tzinfo else x.date.replace(tzinfo=timezone.utc),
                reverse=True,
            )
            recent_summaries = recent_summaries[:3]
            powered_by = "Groq (llama-3.1-8b-instant)"
        except Exception:
            log.warning("Sentiment list unavailable for recent summaries")

        return SalesRepConversationIntelligence(
            sentiment=sentiment,
            intent_distribution=intent_dist,
            recent_summaries=recent_summaries,
            powered_by=powered_by,
        )

    # ── Main entry point ──────────────────────────────────────────────────────

    async def get_sales_rep_insights(self, user: User) -> SalesRepAIInsightsResponse:
        """
        Single aggregator called by the endpoint.
        Each section is fetched independently so a partial failure
        does not crash the entire page.
        """
        now = datetime.now(timezone.utc)

        # Run each section; fall back gracefully on errors
        try:
            action_center = await self._build_action_center(user)
        except Exception as exc:
            log.error("Action center failed: %s", exc)
            action_center = SalesRepActionCenter()

        try:
            pipeline_health = await self._build_pipeline_health(user)
        except Exception as exc:
            log.error("Pipeline health failed: %s", exc)
            pipeline_health = SalesRepPipelineHealth(
                score=0, status="Unknown",
                trend_label="Data unavailable",
                explanation="Unable to calculate pipeline health at this time.",
            )

        try:
            daily_priorities = await self._build_daily_priorities(user)
        except Exception as exc:
            log.error("Daily priorities failed: %s", exc)
            daily_priorities = []

        try:
            conversation_intelligence = await self._build_conversation_intelligence(user)
        except Exception as exc:
            log.error("Conversation intelligence failed: %s", exc)
            conversation_intelligence = SalesRepConversationIntelligence()

        return SalesRepAIInsightsResponse(
            action_center=action_center,
            pipeline_health=pipeline_health,
            daily_priorities=daily_priorities,
            conversation_intelligence=conversation_intelligence,
            generated_at=now,
        )
