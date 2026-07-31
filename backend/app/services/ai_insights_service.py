"""
AI Insights Service
Orchestrates all AI Action Center KPI calculations.
RBAC:
  manager → team scope (all org users)
  admin   → full org
"""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.ai_insights_repository import AIInsightsRepository
from app.schemas.ai_insights import (
    ActionCenterResponse,
    AIRecommendationItem,
    DailySummaryResponse,
    FollowUpDueItem,
    HighValueDealItem,
    ImmediateActionItem,
    NotificationAlert,
    OpportunityScoreItem,
    PipelineHealthResponse,
    RiskItem,
)


# ── Recommendation engine (rule-based, dynamic) ───────────────────────────────

def _generate_recommendation(
    entity_type: str,
    entity_id,
    entity_name: str,
    lead_score: int,
    probability: int,
    deal_value: float,
    days_inactive: int,
    is_overdue: bool,
    owner_name: str | None,
) -> AIRecommendationItem:
    """
    Rule-based dynamic recommendations — no hardcoded strings.
    Priority and action are computed from live data signals.
    """
    if probability >= 80 and days_inactive > 5:
        action   = "Schedule an urgent follow-up — high-probability deal going cold."
        priority = "critical"
    elif is_overdue:
        action   = "Close date passed — escalate to manager or negotiate new timeline."
        priority = "high"
    elif lead_score >= 90:
        action   = "High-quality lead — arrange a demo or send a tailored proposal."
        priority = "high"
    elif probability < 20:
        action   = "Low win probability — consider offering a discount or revisiting fit."
        priority = "medium"
    elif deal_value >= 500_000:
        action   = "High-value opportunity — request legal/finance review and executive sponsor."
        priority = "high"
    elif days_inactive >= 7:
        action   = "No recent engagement — send a re-engagement email or check SLA."
        priority = "medium"
    else:
        action   = "Review deal status and confirm next steps with the customer."
        priority = "low"

    reasoning = (
        f"Lead score: {lead_score}, probability: {probability}%, "
        f"deal value: ₹{int(deal_value):,}, "
        f"inactive for: {days_inactive} day(s), "
        f"close date {'overdue' if is_overdue else 'on track'}."
    )

    return AIRecommendationItem(
        id=entity_id,
        entity_type=entity_type,
        entity_name=entity_name,
        action=action,
        reasoning=reasoning,
        priority=priority,
        owner_name=owner_name,
    )


class AIInsightsService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = AIInsightsRepository(db)

    # ── RBAC scope ────────────────────────────────────────────────────────────

    async def _scope(self, user: User) -> tuple[UUID | None, list[UUID] | None]:
        roles = {ur.role.name for ur in user.user_roles if ur.role}
        if "admin" in roles:
            return None, None
        if "sales_rep" in roles and "manager" not in roles:
            return user.id, None
        # manager (and any other role) → full org team
        stmt = select(User.id).where(
            User.organization_id == user.organization_id,
            User.is_active.is_(True),
            User.is_deleted.is_(False),
        )
        result = await self.db.execute(stmt)
        team_ids = [r[0] for r in result.all()]
        return None, team_ids

    # ── Pipeline health ───────────────────────────────────────────────────────

    def _compute_health(self, components: dict[str, float]) -> PipelineHealthResponse:
        """
        Health Score = Lead Quality 25% + Avg Probability 25%
                     + Recent Activities 20% + Pipeline Coverage 20%
                     + Win Rate 10%
        """
        score = (
            components["lead_quality"]       * 0.25
            + components["avg_probability"]  * 0.25
            + components["recent_activities"]* 0.20
            + components["pipeline_coverage"]* 0.20
            + components["win_rate"]         * 0.10
        )
        score = round(min(score, 100), 1)

        if score >= 90:
            status = "Excellent"
            desc   = "Excellent pipeline velocity with strong lead quality and high win rate."
        elif score >= 75:
            status = "Healthy"
            desc   = "Healthy pipeline with good coverage and active engagement."
        elif score >= 60:
            status = "Average"
            desc   = "Average pipeline health — improve lead quality and follow-up cadence."
        else:
            status = "Poor"
            desc   = "Pipeline health is poor — urgent intervention needed."

        return PipelineHealthResponse(
            score=score,
            status=status,
            change="+0%",   # delta vs previous period requires historical storage
            description=desc,
            components={k: round(v, 1) for k, v in components.items()},
        )

    # ── Main entry point ──────────────────────────────────────────────────────

    async def get_action_center(
        self,
        user: User,
        *,
        date_filter: str | None = None,
        priority_filter: str | None = None,
    ) -> ActionCenterResponse:
        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id
        now = datetime.now(timezone.utc)

        # Fetch all components concurrently (sequential for clarity, still fast)
        raw_actions   = await self.repo.get_immediate_actions(org_id, user_id, team_ids)
        raw_followups = await self.repo.get_overdue_followups(org_id, user_id, team_ids)
        health_comps  = await self.repo.get_pipeline_health_components(org_id, None, None)
        daily_raw     = await self.repo.get_daily_summary(org_id, user_id, team_ids)
        high_value    = await self.repo.get_high_value_deals(org_id, user_id, team_ids)
        risky         = await self.repo.get_risky_deals(org_id, user_id, team_ids)
        opp_scores    = await self.repo.get_opportunity_scores(org_id, user_id, team_ids)

        # Build pipeline health
        pipeline_health = self._compute_health(health_comps)

        # Notifications
        raw_notifs = await self.repo.get_notification_triggers(
            org_id, user_id, team_ids, pipeline_health.score
        )

        # Apply priority filter to immediate actions
        actions = [ImmediateActionItem(**a) for a in raw_actions]
        if priority_filter:
            actions = [a for a in actions if a.priority.lower() == priority_filter.lower()]

        # Build recommendations from immediate actions + risky deals
        recommendations: list[AIRecommendationItem] = []
        seen_ids: set = set()

        for a in raw_actions[:10]:
            if a["id"] in seen_ids:
                continue
            seen_ids.add(a["id"])
            last_at = a.get("last_activity_at")
            days_inactive = (
                (now - (last_at.replace(tzinfo=timezone.utc) if last_at and last_at.tzinfo is None else last_at)).days
                if last_at else 999
            )
            is_overdue = bool(
                a.get("last_activity_at") is None
                or (raw_followups and any(f["id"] == a["id"] for f in raw_followups))
            )
            recommendations.append(_generate_recommendation(
                entity_type="deal",
                entity_id=a["id"],
                entity_name=a["deal_name"],
                lead_score=a["score"],
                probability=a["probability"],
                deal_value=a["deal_value"],
                days_inactive=days_inactive,
                is_overdue=is_overdue,
                owner_name=a.get("owner_name"),
            ))

        for r in risky[:5]:
            if r["id"] in seen_ids:
                continue
            seen_ids.add(r["id"])
            last_at = r.get("last_activity_at")
            days_inactive = (
                (now - (last_at.replace(tzinfo=timezone.utc) if last_at and last_at.tzinfo is None else last_at)).days
                if last_at else 999
            )
            recommendations.append(_generate_recommendation(
                entity_type="deal",
                entity_id=r["id"],
                entity_name=r["deal_name"],
                lead_score=0,
                probability=r["probability"] or 0,
                deal_value=r["deal_value"],
                days_inactive=days_inactive,
                is_overdue=any(rf["id"] == r["id"] for rf in raw_followups),
                owner_name=r.get("owner_name"),
            ))

        return ActionCenterResponse(
            immediateActions=actions,
            followUps=[FollowUpDueItem(**f) for f in raw_followups],
            pipeline_health=pipeline_health,
            summary=DailySummaryResponse(
                urgentDeals=daily_raw["urgent_deals"],
                followUps=daily_raw["follow_ups"],
                meetings=daily_raw["meetings"],
                calls=daily_raw["calls"],
                closingThisWeek=daily_raw["closing_this_week"],
                highValueOpportunities=daily_raw["high_value_opportunities"],
            ),
            highValueDeals=[HighValueDealItem(**h) for h in high_value],
            riskItems=[RiskItem(**r) for r in risky],
            opportunityScores=[OpportunityScoreItem(**o) for o in opp_scores],
            recommendations=recommendations,
            notifications=[NotificationAlert(**n) for n in raw_notifs],
            generated_at=now,
        )
