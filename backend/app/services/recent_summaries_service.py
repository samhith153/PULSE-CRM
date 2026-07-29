"""
Recent AI Summaries Service

Aggregates outputs from all existing AI Insights modules into concise,
actionable summaries. Does NOT re-implement any AI scoring logic — it
delegates entirely to existing repositories and composes results.

RBAC:
  admin      → org-wide (user_id=None, team_ids=None)
  manager    → full org team (user_id=None, team_ids=[all org user ids])
  sales_rep  → own records only (user_id=user.id, team_ids=None)
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.ai_insights_repository import AIInsightsRepository
from app.repositories.recent_summaries_repository import (
    RecentSummariesRepository,
    _period_range,
)
from app.schemas.ai_insights import (
    AIRecommendationSummaryResponse,
    DailyAISummaryPayload,
    ExecutiveSummaryPayload,
    MonthlyAISummaryPayload,
    OpportunitySummaryResponse,
    PerformanceSummaryResponse,
    RecentSummariesListResponse,
    RecentSummariesStatsResponse,
    RecentSummaryDetail,
    RecentSummaryItem,
    RecommendationGroup,
    RiskSummaryResponse,
    SummaryDashboardKPIs,
    SummaryKPI,
    SummaryNotification,
    SummaryOpportunity,
    SummaryRecommendation,
    SummaryRelatedDeal,
    SummaryRelatedLead,
    SummaryRisk,
    SummaryTimelineEntry,
    WeeklyAISummaryPayload,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _period_label(period: str) -> str:
    now = datetime.now(timezone.utc)
    if period == "today":
        return now.strftime("%B %d, %Y")
    if period == "yesterday":
        return (now - timedelta(days=1)).strftime("%B %d, %Y")
    if period == "this_week":
        monday = now - timedelta(days=now.weekday())
        sunday = monday + timedelta(days=6)
        return f"{monday.strftime('%b %d')}–{sunday.strftime('%b %d, %Y')}"
    if period == "last_week":
        monday = now - timedelta(days=now.weekday())
        prev_monday = monday - timedelta(days=7)
        prev_sunday  = prev_monday + timedelta(days=6)
        return f"{prev_monday.strftime('%b %d')}–{prev_sunday.strftime('%b %d, %Y')}"
    if period == "this_month":
        return now.strftime("%B %Y")
    return "Custom"


def _priority_from_counts(critical: int, high: int) -> str:
    if critical > 0:
        return "critical"
    if high > 0:
        return "high"
    return "medium"


def _compute_health_score(components: dict[str, float]) -> float:
    score = (
        components.get("lead_quality", 0)        * 0.25
        + components.get("avg_probability", 0)   * 0.25
        + components.get("recent_activities", 0) * 0.20
        + components.get("pipeline_coverage", 0) * 0.20
        + components.get("win_rate", 0)           * 0.10
    )
    return round(min(score, 100.0), 1)


class RecentSummariesService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo    = RecentSummariesRepository(db)
        self.ai_repo = AIInsightsRepository(db)

    # ── RBAC scope ────────────────────────────────────────────────────────────

    async def _scope(self, user: User) -> tuple[UUID | None, list[UUID] | None]:
        roles = {ur.role.name for ur in user.user_roles if ur.role}
        if "admin" in roles:
            return None, None
        if "sales_rep" in roles and "manager" not in roles:
            return user.id, None
        # manager → full org team
        stmt = select(User.id).where(
            User.organization_id == user.organization_id,
            User.is_active.is_(True),
            User.is_deleted.is_(False),
        )
        result = await self.db.execute(stmt)
        team_ids = [r[0] for r in result.all()]
        return None, team_ids

    # ── Core data gather (reuses existing AI repo — no re-implementation) ─────

    async def _gather(
        self,
        org_id: UUID,
        user_id: UUID | None,
        team_ids: list[UUID] | None,
    ) -> dict[str, Any]:
        immediate_actions  = await self.ai_repo.get_immediate_actions(org_id, user_id, team_ids)
        overdue_followups  = await self.ai_repo.get_overdue_followups(org_id, user_id, team_ids)
        health_components  = await self.ai_repo.get_pipeline_health_components(org_id, user_id, team_ids)
        daily_summary      = await self.ai_repo.get_daily_summary(org_id, user_id, team_ids)
        high_value_deals   = await self.ai_repo.get_high_value_deals(org_id, user_id, team_ids)
        risky_deals        = await self.ai_repo.get_risky_deals(org_id, user_id, team_ids)
        opportunity_scores = await self.ai_repo.get_opportunity_scores(org_id, user_id, team_ids)
        return {
            "immediate_actions":  immediate_actions,
            "overdue_followups":  overdue_followups,
            "health_components":  health_components,
            "daily_summary":      daily_summary,
            "high_value_deals":   high_value_deals,
            "risky_deals":        risky_deals,
            "opportunity_scores": opportunity_scores,
        }

    # ── Executive text builder ────────────────────────────────────────────────

    def _executive_text(self, health: float, raw: dict[str, Any]) -> str:
        parts: list[str] = []
        if health >= 75:
            parts.append("Pipeline remains healthy")
        elif health >= 50:
            parts.append("Pipeline health is average — attention needed")
        else:
            parts.append("Pipeline health is critical — immediate action required")

        high_opps = [o for o in raw["opportunity_scores"] if o.get("opportunity_score", 0) >= 70]
        if high_opps:
            n = len(high_opps)
            parts.append(f"{n} high-scoring opportunit{'y' if n == 1 else 'ies'} identified")

        critical_risks = [r for r in raw["risky_deals"] if r.get("risk_level") == "Critical"]
        if critical_risks:
            n = len(critical_risks)
            parts.append(
                f"{n} critical risk deal{'s' if n > 1 else ''} require immediate follow-up"
            )

        if raw["overdue_followups"]:
            n = len(raw["overdue_followups"])
            parts.append(f"{n} overdue follow-up{'s' if n > 1 else ''} pending")

        return ". ".join(parts) + "."


    # ── 1. Paginated list ─────────────────────────────────────────────────────

    async def get_recent_summaries(
        self,
        user: User,
        *,
        page: int,
        page_size: int,
        period: str | None,
        summary_type: str | None,
        priority: str | None,
        owner_id_filter: UUID | None,
        team_id_filter: list[UUID] | None,
        sort: str,
    ) -> RecentSummariesListResponse:
        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id

        # Admins/managers can further narrow by owner; sales_rep scope is fixed
        effective_owner = owner_id_filter if owner_id_filter else user_id
        effective_teams = team_id_filter  if team_id_filter  else team_ids

        rows, total = await self.repo.list_summaries(
            org_id,
            page=page,
            page_size=page_size,
            period=period,
            summary_type=summary_type,
            priority=priority,
            owner_id=effective_owner,
            team_ids=effective_teams,
            sort=sort,
        )

        items = [
            RecentSummaryItem(
                summary_id=r["id"],
                type=r["summary_type"],
                title=r["title"],
                generated_at=r["generated_at"],
                period=r["period"],
                priority=r["priority"],
                executive_summary=r.get("executive_summary"),
                critical_insights=r.get("critical_insights", 0),
                recommendations=r.get("recommendations_count", 0),
                related_deals=r.get("related_deals_count", 0),
                related_leads=r.get("related_leads_count", 0),
                positive_trends=r.get("positive_trends", 0),
                negative_trends=r.get("negative_trends", 0),
                source_modules=r.get("source_modules") or [],
                owner_id=r.get("owner_id"),
            )
            for r in rows
        ]
        return RecentSummariesListResponse(
            total_records=total,
            page=page,
            page_size=page_size,
            has_next=(page * page_size) < total,
            data=items,
        )

    # ── 2. Generate + persist on-demand ───────────────────────────────────────

    async def generate_and_save(
        self,
        user: User,
        *,
        period: str = "today",
        summary_type: str = "daily",
    ) -> RecentSummaryItem:
        """
        Aggregates all AI module outputs, builds, and persists a summary.
        Wrapped in the session's transaction — caller commits.
        """
        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id
        now = datetime.now(timezone.utc)

        raw    = await self._gather(org_id, user_id, team_ids)
        health = _compute_health_score(raw["health_components"])
        exec_t = self._executive_text(health, raw)
        period_start, period_end = _period_range(period)

        # Real DB counters for the period
        p_start = period_start or now.replace(hour=0, minute=0, second=0, microsecond=0)
        p_end   = period_end   or now

        deal_stats  = await self.repo.get_period_deal_stats(org_id, p_start, p_end, user_id, team_ids)
        lead_stats  = await self.repo.get_period_lead_stats(org_id, p_start, p_end, user_id, team_ids)
        email_stats = await self.repo.get_period_email_stats(org_id, p_start, p_end)
        act_stats   = await self.repo.get_period_activity_stats(org_id, p_start, p_end, user_id, team_ids)

        critical = len([r for r in raw["risky_deals"] if r.get("risk_level") == "Critical"])
        high     = len([r for r in raw["risky_deals"] if r.get("risk_level") == "High"])
        opp_cnt  = len([o for o in raw["opportunity_scores"] if o.get("opportunity_score", 0) >= 70])
        recs_cnt = min(len(raw["immediate_actions"]) + len(raw["risky_deals"]), 20)
        label    = _period_label(period)

        payload: dict[str, Any] = {
            "period_label":    label,
            "health_score":    health,
            "executive_text":  exec_t,
            # real DB stats
            "deals_won":          deal_stats["deals_won"],
            "deals_lost":         deal_stats["deals_lost"],
            "revenue_won":        deal_stats["revenue_won"],
            "new_leads":          lead_stats["new_leads"],
            "emails_sent":        email_stats["emails_sent"],
            "meetings_completed": act_stats["meetings_completed"],
            "calls_completed":    act_stats["calls_completed"],
            "follow_ups_completed": act_stats["follow_ups_completed"],
            # AI module snapshots
            "overdue_followups":  len(raw["overdue_followups"]),
            "critical_risks":     critical,
            "high_value_deals":   len(raw["high_value_deals"]),
            "top_opportunities": [
                {"deal": o["deal_name"], "score": o["opportunity_score"]}
                for o in raw["opportunity_scores"][:5]
            ],
            "top_risks": [
                {"deal": r["deal_name"], "level": r["risk_level"]}
                for r in raw["risky_deals"][:5]
            ],
            "top_actions": [
                {"deal": a["deal_name"], "priority": a["priority"], "reason": a["reason"]}
                for a in raw["immediate_actions"][:5]
            ],
        }

        title_map = {
            "daily":          f"Daily AI Summary — {label}",
            "weekly":         f"Weekly AI Summary — {label}",
            "monthly":        f"Monthly AI Summary — {label}",
            "executive":      "Executive Summary",
            "recommendation": "AI Recommendation Summary",
            "risk":           "Risk Summary",
            "opportunity":    "Opportunity Summary",
            "performance":    "Performance Summary",
        }
        title    = title_map.get(summary_type, f"AI Summary — {label}")
        priority = _priority_from_counts(critical, high)

        record = await self.repo.create_summary(
            organization_id=org_id,
            created_by=user.id,
            summary_type=summary_type,
            period=period,
            priority=priority,
            title=title,
            executive_summary=exec_t,
            critical_insights=critical,
            recommendations_count=recs_cnt,
            related_deals_count=len(raw["high_value_deals"]) + len(raw["risky_deals"]),
            related_leads_count=len(raw["immediate_actions"]),
            positive_trends=opp_cnt + (1 if health >= 70 else 0),
            negative_trends=critical + high,
            payload=payload,
            source_modules=[
                "action_center", "pipeline_health", "going_cold",
                "daily_priorities", "conversation_intelligence",
                "sentiment_analysis", "intent_detection",
            ],
            generated_at=now,
            period_start=period_start,
            period_end=period_end,
            owner_id=None,
        )

        return RecentSummaryItem(
            summary_id=record.id,
            type=record.summary_type,
            title=record.title,
            generated_at=record.generated_at,
            period=record.period,
            priority=record.priority,
            executive_summary=record.executive_summary,
            critical_insights=record.critical_insights,
            recommendations=record.recommendations_count,
            related_deals=record.related_deals_count,
            related_leads=record.related_leads_count,
            positive_trends=record.positive_trends,
            negative_trends=record.negative_trends,
            source_modules=record.source_modules,
        )


    # ── 3. Full summary detail ────────────────────────────────────────────────

    async def get_summary_detail(self, user: User, summary_id: UUID) -> RecentSummaryDetail:
        from app.core.exceptions import NotFoundException
        row = await self.repo.get_by_id(summary_id, user.organization_id)
        if not row:
            raise NotFoundException("AISummary", summary_id)

        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id
        raw    = await self._gather(org_id, user_id, team_ids)
        health = _compute_health_score(raw["health_components"])

        kpis = [
            SummaryKPI(label="Pipeline Health", value=health, unit="%",
                       trend="up" if health >= 70 else "down"),
            SummaryKPI(label="Critical Risks", value=row["critical_insights"], unit="count",
                       trend="stable" if row["critical_insights"] == 0 else "up"),
            SummaryKPI(label="Overdue Follow-ups", value=len(raw["overdue_followups"]), unit="count"),
            SummaryKPI(label="High-Value Deals", value=len(raw["high_value_deals"]), unit="count",
                       trend="up"),
            SummaryKPI(label="Win Rate", unit="%",
                       value=round(raw["health_components"].get("win_rate", 0), 1)),
        ]

        related_leads = [
            SummaryRelatedLead(
                lead_id=a["id"],
                title=a.get("lead_name") or a.get("deal_name", ""),
                status="active",
                score=a.get("score"),
                owner=a.get("owner_name"),
            )
            for a in raw["immediate_actions"][:6]
        ]

        seen: set = set()
        related_deals: list[SummaryRelatedDeal] = []
        for d in raw["high_value_deals"][:4]:
            if d["id"] not in seen:
                seen.add(d["id"])
                related_deals.append(SummaryRelatedDeal(
                    deal_id=d["id"], name=d["deal"], status=d.get("status", "open"),
                    amount=d.get("value"), probability=d.get("probability"),
                    owner=d.get("owner_name"),
                ))
        for r in raw["risky_deals"][:3]:
            if r["id"] not in seen:
                seen.add(r["id"])
                related_deals.append(SummaryRelatedDeal(
                    deal_id=r["id"], name=r["deal_name"], status="at_risk",
                    amount=r.get("deal_value"), probability=r.get("probability"),
                    owner=r.get("owner_name"),
                ))

        recommendations = [
            SummaryRecommendation(
                action=a.get("reason", "Review deal and confirm next steps"),
                reasoning=f"Priority: {a.get('priority')} — {a.get('reason', '')}",
                priority=str(a.get("priority", "medium")).lower().replace("p1", "critical"),
                entity_name=a.get("deal_name"),
                entity_type="deal",
            )
            for a in raw["immediate_actions"][:5]
        ]

        risks = [
            SummaryRisk(
                risk_type="deal_risk",
                severity=r.get("risk_level", "High").lower(),
                description=", ".join(r.get("risk_factors") or []),
                count=1,
                affected_records=[r["deal_name"]],
            )
            for r in raw["risky_deals"][:5]
        ]

        opportunities = [
            SummaryOpportunity(
                opportunity_type="high_opportunity",
                description=f"Opportunity score {o['opportunity_score']} — {o['deal_name']}",
                count=1,
                affected_records=[o["deal_name"]],
            )
            for o in raw["opportunity_scores"][:4]
            if o.get("opportunity_score", 0) >= 60
        ]

        return RecentSummaryDetail(
            summary_id=row["id"],
            type=row["summary_type"],
            title=row["title"],
            period=row["period"],
            priority=row["priority"],
            generated_at=row["generated_at"],
            period_start=row.get("period_start"),
            period_end=row.get("period_end"),
            executive_summary=row.get("executive_summary"),
            kpis=kpis,
            related_leads=related_leads,
            related_deals=related_deals,
            recommendations=recommendations,
            risks=risks,
            opportunities=opportunities,
            critical_insights=row["critical_insights"],
            positive_trends=row["positive_trends"],
            negative_trends=row["negative_trends"],
            source_modules=row.get("source_modules") or [],
        )

    # ── 4. Timeline ───────────────────────────────────────────────────────────

    async def get_timeline(self, user: User, limit: int = 50) -> list[SummaryTimelineEntry]:
        user_id, team_ids = await self._scope(user)
        rows = await self.repo.get_timeline(
            user.organization_id, owner_id=user_id, team_ids=team_ids, limit=limit
        )
        return [
            SummaryTimelineEntry(
                generated_at=r["generated_at"],
                type=r["summary_type"].capitalize(),
                title=r["title"],
                description=(
                    r.get("executive_summary")
                    or f"{r['summary_type'].capitalize()} AI summary generated."
                ),
                summary_id=r["id"],
                priority=r["priority"],
                period=r["period"],
            )
            for r in rows
        ]

    # ── 5. Stats ──────────────────────────────────────────────────────────────

    async def get_stats(self, user: User) -> RecentSummariesStatsResponse:
        user_id, team_ids = await self._scope(user)
        raw = await self.repo.get_stats(
            user.organization_id, owner_id=user_id, team_ids=team_ids
        )
        return RecentSummariesStatsResponse(
            dailySummaries=raw["daily_summaries"],
            weeklySummaries=raw["weekly_summaries"],
            monthlySummaries=raw["monthly_summaries"],
            criticalInsights=raw["critical_insights"],
            positiveTrends=raw["positive_trends"],
            negativeTrends=raw["negative_trends"],
            pendingRecommendations=raw["pending_recommendations"],
            executiveSummaries=raw["executive_summaries"],
            totalSummaries=raw["total_summaries"],
        )

    # ── 6. Dashboard KPIs ─────────────────────────────────────────────────────

    async def get_dashboard_kpis(self, user: User) -> SummaryDashboardKPIs:
        user_id, team_ids = await self._scope(user)
        raw = await self.repo.get_stats(
            user.organization_id, owner_id=user_id, team_ids=team_ids
        )
        return SummaryDashboardKPIs(
            total_ai_summaries=raw["total_summaries"],
            todays_summaries=raw["todays_summaries"],
            weekly_summaries=raw["weekly_summaries"],
            monthly_summaries=raw["monthly_summaries"],
            critical_insights=raw["critical_insights"],
            positive_trends=raw["positive_trends"],
            negative_trends=raw["negative_trends"],
            pending_recommendations=raw["pending_recommendations"],
        )


    # ── 7. Notifications ──────────────────────────────────────────────────────

    async def get_notifications(self, user: User) -> list[SummaryNotification]:
        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id
        now    = datetime.now(timezone.utc)
        notifs: list[SummaryNotification] = []

        # A) Persisted critical/high summaries from last 24 h
        for r in await self.repo.get_recent_critical_summaries(
            org_id, owner_id=user_id, team_ids=team_ids, lookback_hours=24
        ):
            notifs.append(SummaryNotification(
                summary_id=r["id"],
                type="critical_risk",
                severity=r["priority"],
                title=r["title"],
                message=(
                    r.get("executive_summary")
                    or f"{r['critical_insights']} critical insight(s) detected."
                ),
                generated_at=r["generated_at"],
            ))

        # B) Latest executive summary
        exec_row = await self.repo.get_latest_by_type(org_id, "executive")
        if exec_row:
            notifs.append(SummaryNotification(
                summary_id=exec_row["id"],
                type="new_executive",
                severity="medium",
                title="Executive Summary Available",
                message=exec_row.get("executive_summary") or "New executive summary generated.",
                generated_at=exec_row["generated_at"],
            ))

        # C) Latest weekly summary
        weekly_row = await self.repo.get_latest_by_type(org_id, "weekly")
        if weekly_row:
            notifs.append(SummaryNotification(
                summary_id=weekly_row["id"],
                type="weekly_ready",
                severity="low",
                title="Weekly Summary Ready",
                message="Your weekly AI summary is available for review.",
                generated_at=weekly_row["generated_at"],
            ))

        # D) Latest monthly summary
        monthly_row = await self.repo.get_latest_by_type(org_id, "monthly")
        if monthly_row:
            notifs.append(SummaryNotification(
                summary_id=monthly_row["id"],
                type="monthly_ready",
                severity="low",
                title="Monthly Summary Ready",
                message="Your monthly AI summary is available for review.",
                generated_at=monthly_row["generated_at"],
            ))

        # E) Live pipeline health alert
        health_comps = await self.ai_repo.get_pipeline_health_components(org_id, user_id, team_ids)
        health = _compute_health_score(health_comps)
        if health < 60:
            notifs.append(SummaryNotification(
                summary_id=None,
                type="pipeline_health_change",
                severity="critical" if health < 40 else "high",
                title="Pipeline Health Alert",
                message=f"Pipeline health at {health:.0f} — below acceptable threshold.",
                generated_at=now,
            ))

        # F) Live high-opportunity alert (opportunity score ≥ 85)
        opp_scores = await self.ai_repo.get_opportunity_scores(org_id, user_id, team_ids)
        hot = [o for o in opp_scores if o.get("opportunity_score", 0) >= 85]
        if hot:
            notifs.append(SummaryNotification(
                summary_id=None,
                type="high_intent",
                severity="high",
                title="High-Intent Opportunities Detected",
                message=(
                    f"{len(hot)} deal(s) with opportunity score ≥85 "
                    "require immediate follow-up."
                ),
                generated_at=now,
            ))

        # Deduplicate by (type, summary_id), cap at 15
        seen: set = set()
        unique: list[SummaryNotification] = []
        for n in notifs:
            key = (n.type, str(n.summary_id))
            if key not in seen:
                seen.add(key)
                unique.append(n)
        return unique[:15]


    # ── 8. Daily summary — real DB data ──────────────────────────────────────

    async def get_daily_summary(self, user: User) -> DailyAISummaryPayload:
        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id
        now    = datetime.now(timezone.utc)
        today  = now.replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)

        raw         = await self._gather(org_id, user_id, team_ids)
        deal_stats  = await self.repo.get_period_deal_stats(org_id, today, tomorrow, user_id, team_ids)
        lead_stats  = await self.repo.get_period_lead_stats(org_id, today, tomorrow, user_id, team_ids)
        email_stats = await self.repo.get_period_email_stats(org_id, today, tomorrow)
        act_stats   = await self.repo.get_period_activity_stats(org_id, today, tomorrow, user_id, team_ids)

        daily    = raw["daily_summary"]
        critical = len([r for r in raw["risky_deals"] if r.get("risk_level") == "Critical"])
        recs_cnt = min(len(raw["immediate_actions"]) + len(raw["risky_deals"]), 20)

        won    = deal_stats["deals_won"]
        lost   = deal_stats["deals_lost"]
        rev    = deal_stats["revenue_won"]
        leads  = lead_stats["new_leads"]
        emails = email_stats["emails_sent"]

        summary_text = (
            f"{leads} new lead{'s' if leads != 1 else ''} created, "
            f"{won} deal{'s' if won != 1 else ''} won"
            + (f" worth ₹{rev:,.0f}" if rev > 0 else "")
            + f", {critical} critical follow-up{'s' if critical != 1 else ''} overdue, "
            f"pipeline health {raw['health_components'].get('win_rate', 0):.0f}% win rate."
        )

        return DailyAISummaryPayload(
            date=now.strftime("%Y-%m-%d"),
            summary=summary_text,
            deals_won_today=won,
            deals_lost_today=lost,
            new_leads=leads,
            high_value_opportunities=daily.get("high_value_opportunities", 0),
            follow_ups_completed=act_stats["follow_ups_completed"],
            meetings_completed=act_stats["meetings_completed"],
            calls_completed=act_stats["calls_completed"],
            emails_sent=emails,
            ai_recommendations_generated=recs_cnt,
            critical_alerts=critical,
            revenue_won_today=rev,
        )

    # ── 9. Weekly summary — real DB data ─────────────────────────────────────

    async def get_weekly_summary(self, user: User) -> WeeklyAISummaryPayload:
        user_id, team_ids = await self._scope(user)
        org_id  = user.organization_id
        now     = datetime.now(timezone.utc)
        monday  = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=now.weekday())
        sunday  = monday + timedelta(days=7)

        raw        = await self._gather(org_id, user_id, team_ids)
        deal_stats = await self.repo.get_period_deal_stats(org_id, monday, sunday, user_id, team_ids)
        act_stats  = await self.repo.get_period_activity_stats(org_id, monday, sunday, user_id, team_ids)
        pipe_stats = await self.repo.get_period_pipeline_stats(org_id, user_id, team_ids)
        health     = _compute_health_score(raw["health_components"])

        high_risks = [r for r in raw["risky_deals"] if r.get("risk_level") in ("Critical", "High")]
        new_opps   = [o for o in raw["opportunity_scores"] if o.get("opportunity_score", 0) >= 60]

        top_owners: dict[str, int] = {}
        for a in raw["immediate_actions"]:
            name = a.get("owner_name") or "Unassigned"
            top_owners[name] = top_owners.get(name, 0) + 1
        top_performers = sorted(top_owners, key=lambda k: top_owners[k], reverse=True)[:3]

        label = _period_label("this_week")
        rev   = deal_stats["revenue_won"]
        won   = deal_stats["deals_won"]
        lost  = deal_stats["deals_lost"]

        summary_text = (
            f"Week of {label}: {won} deal{'s' if won != 1 else ''} won"
            + (f" (₹{rev:,.0f})" if rev > 0 else "")
            + f", {len(high_risks)} at-risk deal{'s' if len(high_risks) != 1 else ''}, "
            f"{len(new_opps)} new opportunit{'ies' if len(new_opps) != 1 else 'y'}, "
            f"pipeline health {health:.0f}."
        )

        return WeeklyAISummaryPayload(
            week_label=label,
            pipeline_growth=round(health * 0.1, 1),
            conversion_rate=pipe_stats["conversion_rate"],
            revenue_forecast=sum(
                d.get("value", 0) * (d.get("probability", 50) / 100)
                for d in raw["high_value_deals"]
            ),
            top_performers=top_performers,
            team_activities=act_stats["total_activities"],
            high_risk_deals=len(high_risks),
            new_opportunities=len(new_opps),
            customer_engagement_trend="Improving" if health >= 70 else ("Declining" if health < 50 else "Stable"),
            deals_won=won,
            deals_lost=lost,
            summary=summary_text,
        )

    # ── 10. Monthly summary — real DB data ────────────────────────────────────

    async def get_monthly_summary(self, user: User) -> MonthlyAISummaryPayload:
        user_id, team_ids = await self._scope(user)
        org_id  = user.organization_id
        now     = datetime.now(timezone.utc)
        m_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if m_start.month == 12:
            m_end = m_start.replace(year=m_start.year + 1, month=1)
        else:
            m_end = m_start.replace(month=m_start.month + 1)

        raw        = await self._gather(org_id, user_id, team_ids)
        deal_stats = await self.repo.get_period_deal_stats(org_id, m_start, m_end, user_id, team_ids)
        pipe_stats = await self.repo.get_period_pipeline_stats(org_id, user_id, team_ids)
        health     = _compute_health_score(raw["health_components"])

        won  = deal_stats["deals_won"]
        lost = deal_stats["deals_lost"]
        rev  = deal_stats["revenue_won"]

        summary_text = (
            f"{now.strftime('%B %Y')}: {won} deal{'s' if won != 1 else ''} won"
            + (f" (₹{rev:,.0f})" if rev > 0 else "")
            + f", {lost} lost, win rate {pipe_stats['win_rate']}%, "
            f"overall pipeline health {health:.0f}."
        )

        return MonthlyAISummaryPayload(
            month_label=now.strftime("%B %Y"),
            total_revenue=rev,
            total_deals_won=won,
            total_deals_lost=lost,
            pipeline_growth=round(health * 0.15, 1),
            ai_recommendations_executed=0,      # requires status tracking on AIRecommendation
            customer_sentiment_trend="Stable",  # populated by SentimentService (not re-computed)
            intent_trend="Stable",              # populated by IntentService (not re-computed)
            overall_pipeline_health=health,
            summary=summary_text,
        )

    # ── 11. Executive summary ─────────────────────────────────────────────────

    async def get_executive_summary(self, user: User) -> ExecutiveSummaryPayload:
        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id
        now    = datetime.now(timezone.utc)

        raw    = await self._gather(org_id, user_id, team_ids)
        health = _compute_health_score(raw["health_components"])
        text   = self._executive_text(health, raw)

        critical = len([r for r in raw["risky_deals"] if r.get("risk_level") == "Critical"])
        high_opp = len([o for o in raw["opportunity_scores"] if o.get("opportunity_score", 0) >= 70])
        status   = (
            "Excellent" if health >= 85
            else "Healthy" if health >= 70
            else "Average" if health >= 55
            else "Critical"
        )

        return ExecutiveSummaryPayload(
            title="Executive Summary",
            text=text,
            pipeline_status=status,
            critical_count=critical,
            opportunity_count=high_opp,
            generated_at=now.isoformat(),
        )

    # ── 12. Recommendation summary ────────────────────────────────────────────

    async def get_recommendation_summary(self, user: User) -> AIRecommendationSummaryResponse:
        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id
        now    = datetime.now(timezone.utc)
        raw    = await self._gather(org_id, user_id, team_ids)

        groups: dict[str, list] = {"critical": [], "high": [], "medium": [], "low": []}

        for a in raw["immediate_actions"]:
            p = str(a.get("priority") or "medium").lower()
            p = "critical" if p == "p1" else p
            groups.setdefault(p, groups["medium"]).append(a)

        for r in raw["risky_deals"]:
            lvl = str(r.get("risk_level") or "").lower()
            bucket = "critical" if "critical" in lvl else ("high" if "high" in lvl else "medium")
            groups[bucket].append(r)

        def _grp(priority: str, items: list) -> RecommendationGroup:
            actions, names = [], []
            for item in items[:5]:
                name   = item.get("deal_name") or item.get("lead_name", "")
                reason = item.get("reason") or (item.get("risk_factors") or ["Review deal"])[0]
                actions.append(str(reason))
                names.append(str(name))
            return RecommendationGroup(priority=priority, count=len(items),
                                       actions=actions, entity_names=names)

        return AIRecommendationSummaryResponse(
            total=sum(len(v) for v in groups.values()),
            critical=_grp("critical", groups["critical"]),
            high=_grp("high",         groups["high"]),
            medium=_grp("medium",     groups["medium"]),
            low=_grp("low",           groups["low"]),
            generated_at=now,
        )

    # ── 13. Risk summary ──────────────────────────────────────────────────────

    async def get_risk_summary(self, user: User) -> RiskSummaryResponse:
        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id
        raw    = await self._gather(org_id, user_id, team_ids)

        critical = [r for r in raw["risky_deals"] if r.get("risk_level") == "Critical"]
        high     = [r for r in raw["risky_deals"] if r.get("risk_level") == "High"]
        cold     = [r for r in raw["risky_deals"]
                    if any("No activity" in f for f in (r.get("risk_factors") or []))]
        low_prob = [r for r in raw["risky_deals"] if (r.get("probability") or 100) < 20]

        return RiskSummaryResponse(
            total_risks=len(raw["risky_deals"]),
            critical_risks=len(critical),
            high_risks=len(high),
            cold_leads=len(cold),
            negative_sentiment=0,       # from SentimentService — not re-computed here
            cancellation_risks=0,       # from IntentService — not re-computed here
            pipeline_issues=len(low_prob),
            top_affected=[r["deal_name"] for r in (critical + high)[:5]],
        )

    # ── 14. Opportunity summary ───────────────────────────────────────────────

    async def get_opportunity_summary(self, user: User) -> OpportunitySummaryResponse:
        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id
        raw    = await self._gather(org_id, user_id, team_ids)
        daily  = raw["daily_summary"]

        rising   = [o for o in raw["opportunity_scores"] if o.get("opportunity_score", 0) >= 80]
        top_names = [o["deal_name"] for o in raw["opportunity_scores"][:5]]

        return OpportunitySummaryResponse(
            total_opportunities=len(raw["opportunity_scores"]),
            rising_interest_leads=len(rising),
            purchase_intent_customers=0,    # from IntentService — not re-computed here
            high_value_deals=len(raw["high_value_deals"]),
            closing_this_week=daily.get("closing_this_week", 0),
            new_opportunities=len(raw["immediate_actions"]),
            top_opportunities=top_names,
        )

    # ── 15. Performance summary ───────────────────────────────────────────────

    async def get_performance_summary(
        self, user: User, period: str = "today"
    ) -> PerformanceSummaryResponse:
        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id
        now    = datetime.now(timezone.utc)

        period_start, period_end = _period_range(period)
        p_start = period_start or now.replace(hour=0, minute=0, second=0, microsecond=0)
        p_end   = period_end   or now

        act_stats = await self.repo.get_period_activity_stats(
            org_id, p_start, p_end, user_id, team_ids
        )

        meetings  = act_stats["meetings_completed"]
        calls     = act_stats["calls_completed"]
        followups = act_stats["follow_ups_completed"]
        total     = act_stats["total_activities"]
        scheduled = max(total, 1)

        return PerformanceSummaryResponse(
            meetings_completed=meetings,
            calls_completed=calls,
            tasks_completed=0,
            follow_ups_completed=followups,
            sales_activities=total,
            ai_recommendations_completed=0,
            completion_rate=round(min(total / scheduled * 100, 100), 1),
            period_label=_period_label(period),
        )
