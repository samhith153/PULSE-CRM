"""
Recent AI Summaries Repository

All SQL for persisting, querying, and aggregating AISummary records plus
live-data aggregation queries (deals won/lost today, new leads, emails sent,
revenue won) reused by the service layer.

Design principles:
  - SQLAlchemy 2.x syntax throughout (case() with keyword whens)
  - Composite indexes on generated_at, organization_id, summary_type, priority
  - No N+1 queries — all counts via COUNT/SUM in single statements
  - Returns plain dicts; never leaks ORM objects to the service layer
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityTimeline
from app.models.ai_summary import AISummary
from app.models.deal import Deal
from app.models.email import Email
from app.models.lead import Lead
from app.utils.enums import DealStatus


# ── Period → datetime range ───────────────────────────────────────────────────

def _period_range(period: str) -> tuple[datetime | None, datetime | None]:
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    if period == "today":
        return today, today + timedelta(days=1)
    if period == "yesterday":
        return today - timedelta(days=1), today
    if period == "this_week":
        monday = today - timedelta(days=today.weekday())
        return monday, monday + timedelta(days=7)
    if period == "last_week":
        monday = today - timedelta(days=today.weekday())
        prev_monday = monday - timedelta(days=7)
        return prev_monday, monday
    if period == "this_month":
        month_start = today.replace(day=1)
        if month_start.month == 12:
            next_month = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month = month_start.replace(month=month_start.month + 1)
        return month_start, next_month
    return None, None


class RecentSummariesRepository:
    """
    Data access for AISummary persistence + live CRM aggregations.
    All methods return plain dicts — never ORM objects.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── RBAC base conditions ──────────────────────────────────────────────────

    def _base_conditions(
        self,
        organization_id: UUID,
        *,
        owner_id: UUID | None = None,
        team_ids: list[UUID] | None = None,
        include_org_wide: bool = True,
    ) -> list:
        """
        Build WHERE clause respecting RBAC scope.
        include_org_wide=True means null owner_id records (org-wide summaries)
        are always visible regardless of scope. Set False for sales_rep scope
        where only own records should show.
        """
        conditions = [
            AISummary.organization_id == organization_id,
            AISummary.is_active.is_(True),
        ]
        if owner_id is not None and team_ids is None:
            if include_org_wide:
                # sales_rep: own records OR org-wide summaries (owner_id IS NULL)
                conditions.append(
                    or_(AISummary.owner_id == owner_id, AISummary.owner_id.is_(None))
                )
            else:
                conditions.append(AISummary.owner_id == owner_id)
        elif team_ids is not None:
            if include_org_wide:
                conditions.append(
                    or_(AISummary.owner_id.in_(team_ids), AISummary.owner_id.is_(None))
                )
            else:
                conditions.append(AISummary.owner_id.in_(team_ids))
        return conditions

    # ─────────────────────────────────────────────────────────────────────────
    # LIVE CRM AGGREGATION QUERIES
    # These query deals/leads/emails/activities directly so that daily, weekly,
    # and monthly summary payloads reflect real data, not placeholder zeros.
    # ─────────────────────────────────────────────────────────────────────────

    async def get_period_deal_stats(
        self,
        organization_id: UUID,
        period_start: datetime,
        period_end: datetime,
        owner_id: UUID | None,
        team_ids: list[UUID] | None,
    ) -> dict[str, Any]:
        """
        Aggregates deals won/lost + revenue won for a given period window.
        Uses closed_at (populated when deal moves to won/lost) or updated_at
        as fallback. Single query with CASE/SUM — no N+1.
        """

        def _owner_filter(stmt):
            if owner_id is not None and team_ids is None:
                return stmt.where(Deal.owner_id == owner_id)
            if team_ids is not None:
                return stmt.where(Deal.owner_id.in_(team_ids))
            return stmt

        base = [
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
        ]

        # closed_at column exists on Deal — use it for the period filter
        closed_base = base + [
            Deal.closed_at >= period_start,
            Deal.closed_at < period_end,
        ]

        stmt = _owner_filter(
            select(
                func.coalesce(
                    func.sum(
                        case(
                            (Deal.status == DealStatus.WON.value, 1),
                            else_=0,
                        )
                    ),
                    0,
                ).label("deals_won"),
                func.coalesce(
                    func.sum(
                        case(
                            (Deal.status == DealStatus.LOST.value, 1),
                            else_=0,
                        )
                    ),
                    0,
                ).label("deals_lost"),
                func.coalesce(
                    func.sum(
                        case(
                            (Deal.status == DealStatus.WON.value, Deal.amount),
                            else_=0,
                        )
                    ),
                    0,
                ).label("revenue_won"),
            ).where(and_(*closed_base))
        )

        result = await self.db.execute(stmt)
        row = result.mappings().one()
        return {
            "deals_won":    int(row["deals_won"] or 0),
            "deals_lost":   int(row["deals_lost"] or 0),
            "revenue_won":  float(row["revenue_won"] or 0),
        }

    async def get_period_lead_stats(
        self,
        organization_id: UUID,
        period_start: datetime,
        period_end: datetime,
        owner_id: UUID | None,
        team_ids: list[UUID] | None,
    ) -> dict[str, int]:
        """Count new leads created in period."""
        base = [
            Lead.organization_id == organization_id,
            Lead.is_active.is_(True),
            Lead.is_deleted.is_(False),
            Lead.created_at >= period_start,
            Lead.created_at < period_end,
        ]
        stmt = select(func.count(Lead.id)).where(and_(*base))
        if owner_id is not None and team_ids is None:
            stmt = stmt.where(Lead.owner_id == owner_id)
        elif team_ids is not None:
            stmt = stmt.where(Lead.owner_id.in_(team_ids))

        result = await self.db.execute(stmt)
        return {"new_leads": int(result.scalar_one() or 0)}

    async def get_period_email_stats(
        self,
        organization_id: UUID,
        period_start: datetime,
        period_end: datetime,
    ) -> dict[str, int]:
        """Count outbound emails sent in period."""
        stmt = select(func.count(Email.id)).where(
            Email.organization_id == organization_id,
            Email.is_active.is_(True),
            Email.direction == "outbound",
            Email.sent_at >= period_start,
            Email.sent_at < period_end,
        )
        result = await self.db.execute(stmt)
        return {"emails_sent": int(result.scalar_one() or 0)}

    async def get_period_activity_stats(
        self,
        organization_id: UUID,
        period_start: datetime,
        period_end: datetime,
        owner_id: UUID | None,
        team_ids: list[UUID] | None,
    ) -> dict[str, int]:
        """
        Count meetings completed, calls completed, follow-ups completed,
        and total activities in period — single query via CASE/SUM.
        """
        base = [
            ActivityTimeline.organization_id == organization_id,
            ActivityTimeline.created_at >= period_start,
            ActivityTimeline.created_at < period_end,
        ]
        if owner_id is not None and team_ids is None:
            base.append(ActivityTimeline.created_by == owner_id)
        elif team_ids is not None:
            base.append(ActivityTimeline.created_by.in_(team_ids))

        stmt = select(
            func.coalesce(
                func.sum(
                    case(
                        (ActivityTimeline.action.in_(
                            ["meeting", "meeting_scheduled", "meeting_completed"]
                        ), 1),
                        else_=0,
                    )
                ),
                0,
            ).label("meetings"),
            func.coalesce(
                func.sum(
                    case(
                        (ActivityTimeline.action.in_(
                            ["call", "call_logged", "call_completed"]
                        ), 1),
                        else_=0,
                    )
                ),
                0,
            ).label("calls"),
            func.coalesce(
                func.sum(
                    case(
                        (ActivityTimeline.action.in_(
                            ["follow_up", "followup_completed", "follow_up_completed"]
                        ), 1),
                        else_=0,
                    )
                ),
                0,
            ).label("followups"),
            func.count(ActivityTimeline.id).label("total"),
        ).where(and_(*base))

        result = await self.db.execute(stmt)
        row = result.mappings().one()
        return {
            "meetings_completed":   int(row["meetings"] or 0),
            "calls_completed":      int(row["calls"] or 0),
            "follow_ups_completed": int(row["followups"] or 0),
            "total_activities":     int(row["total"] or 0),
        }

    async def get_period_pipeline_stats(
        self,
        organization_id: UUID,
        owner_id: UUID | None,
        team_ids: list[UUID] | None,
    ) -> dict[str, Any]:
        """
        Win rate + open pipeline value + won pipeline value.
        Used for weekly/monthly conversion_rate and pipeline_growth.
        """
        base = [
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
        ]

        def _filter(stmt):
            if owner_id is not None and team_ids is None:
                return stmt.where(Deal.owner_id == owner_id)
            if team_ids is not None:
                return stmt.where(Deal.owner_id.in_(team_ids))
            return stmt

        stmt = _filter(
            select(
                func.coalesce(
                    func.sum(case((Deal.status == DealStatus.WON.value, 1), else_=0)),
                    0,
                ).label("won_count"),
                func.coalesce(
                    func.sum(case((Deal.status == DealStatus.LOST.value, 1), else_=0)),
                    0,
                ).label("lost_count"),
                func.coalesce(
                    func.sum(
                        case(
                            (Deal.status == DealStatus.WON.value, Deal.amount),
                            else_=0,
                        )
                    ),
                    0,
                ).label("won_revenue"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                Deal.status.notin_(
                                    [DealStatus.WON.value, DealStatus.LOST.value]
                                ),
                                Deal.amount,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("open_pipeline"),
                func.count(Deal.id).label("total_deals"),
            ).where(and_(*base))
        )

        result = await self.db.execute(stmt)
        row = result.mappings().one()
        won   = int(row["won_count"] or 0)
        lost  = int(row["lost_count"] or 0)
        total = int(row["total_deals"] or 0)
        closed = won + lost
        win_rate = round((won / closed) * 100, 1) if closed > 0 else 0.0
        conversion_rate = round((won / total) * 100, 1) if total > 0 else 0.0

        return {
            "deals_won":        won,
            "deals_lost":       lost,
            "won_revenue":      float(row["won_revenue"] or 0),
            "open_pipeline":    float(row["open_pipeline"] or 0),
            "win_rate":         win_rate,
            "conversion_rate":  conversion_rate,
        }

    # ─────────────────────────────────────────────────────────────────────────
    # AISummary PERSISTENCE & RETRIEVAL
    # ─────────────────────────────────────────────────────────────────────────

    async def create_summary(
        self,
        *,
        organization_id: UUID,
        created_by: UUID,
        summary_type: str,
        period: str,
        priority: str,
        title: str,
        executive_summary: str,
        critical_insights: int,
        recommendations_count: int,
        related_deals_count: int,
        related_leads_count: int,
        positive_trends: int,
        negative_trends: int,
        payload: dict,
        source_modules: list[str],
        generated_at: datetime,
        period_start: datetime | None,
        period_end: datetime | None,
        owner_id: UUID | None = None,
    ) -> AISummary:
        record = AISummary(
            organization_id=organization_id,
            created_by=created_by,
            owner_id=owner_id,
            summary_type=summary_type,
            period=period,
            priority=priority,
            title=title,
            executive_summary=executive_summary,
            critical_insights=critical_insights,
            recommendations_count=recommendations_count,
            related_deals_count=related_deals_count,
            related_leads_count=related_leads_count,
            positive_trends=positive_trends,
            negative_trends=negative_trends,
            payload=payload,
            source_modules=source_modules,
            generated_at=generated_at,
            period_start=period_start,
            period_end=period_end,
        )
        self.db.add(record)
        await self.db.flush()
        await self.db.refresh(record)
        return record

    async def list_summaries(
        self,
        organization_id: UUID,
        *,
        page: int,
        page_size: int,
        period: str | None,
        summary_type: str | None,
        priority: str | None,
        owner_id: UUID | None,
        team_ids: list[UUID] | None,
        sort: str,
    ) -> tuple[list[dict[str, Any]], int]:
        conditions = self._base_conditions(
            organization_id, owner_id=owner_id, team_ids=team_ids
        )

        if period and period != "custom":
            start, end = _period_range(period)
            if start and end:
                conditions.append(AISummary.generated_at >= start)
                conditions.append(AISummary.generated_at < end)

        if summary_type:
            conditions.append(AISummary.summary_type == summary_type)
        if priority:
            conditions.append(AISummary.priority == priority)

        count_stmt = select(func.count(AISummary.id)).where(and_(*conditions))
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)
        if total == 0:
            return [], 0

        # SQLAlchemy 2.x case() uses keyword whens
        order_expr = {
            "priority": case(
                whens={
                    "critical": 0,
                    "high":     1,
                    "medium":   2,
                    "low":      3,
                },
                value=AISummary.priority,
                else_=4,
            ).asc(),
            "type": AISummary.summary_type.asc(),
        }.get(sort, AISummary.generated_at.desc())

        stmt = (
            select(
                AISummary.id,
                AISummary.summary_type,
                AISummary.period,
                AISummary.priority,
                AISummary.title,
                AISummary.executive_summary,
                AISummary.critical_insights,
                AISummary.recommendations_count,
                AISummary.related_deals_count,
                AISummary.related_leads_count,
                AISummary.positive_trends,
                AISummary.negative_trends,
                AISummary.source_modules,
                AISummary.owner_id,
                AISummary.generated_at,
            )
            .where(and_(*conditions))
            .order_by(order_expr)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(stmt)
        rows = [dict(r._mapping) for r in result.all()]
        return rows, total

    async def get_by_id(
        self,
        summary_id: UUID,
        organization_id: UUID,
    ) -> dict[str, Any] | None:
        stmt = select(AISummary).where(
            AISummary.id == summary_id,
            AISummary.organization_id == organization_id,
            AISummary.is_active.is_(True),
        )
        result = await self.db.execute(stmt)
        record = result.scalar_one_or_none()
        if not record:
            return None
        return {
            "id":                   record.id,
            "summary_type":         record.summary_type,
            "period":               record.period,
            "priority":             record.priority,
            "title":                record.title,
            "executive_summary":    record.executive_summary,
            "critical_insights":    record.critical_insights,
            "recommendations_count": record.recommendations_count,
            "related_deals_count":  record.related_deals_count,
            "related_leads_count":  record.related_leads_count,
            "positive_trends":      record.positive_trends,
            "negative_trends":      record.negative_trends,
            "payload":              record.payload,
            "source_modules":       record.source_modules,
            "generated_at":         record.generated_at,
            "period_start":         record.period_start,
            "period_end":           record.period_end,
            "owner_id":             record.owner_id,
        }

    async def get_timeline(
        self,
        organization_id: UUID,
        *,
        owner_id: UUID | None,
        team_ids: list[UUID] | None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        conditions = self._base_conditions(
            organization_id, owner_id=owner_id, team_ids=team_ids
        )
        stmt = (
            select(
                AISummary.id,
                AISummary.summary_type,
                AISummary.period,
                AISummary.priority,
                AISummary.title,
                AISummary.executive_summary,
                AISummary.generated_at,
            )
            .where(and_(*conditions))
            .order_by(AISummary.generated_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return [dict(r._mapping) for r in result.all()]

    async def get_stats(
        self,
        organization_id: UUID,
        *,
        owner_id: UUID | None,
        team_ids: list[UUID] | None,
    ) -> dict[str, int]:
        """
        Single-query aggregation of all KPI counters for the stats endpoint.
        Uses CASE/SUM — no N+1, hits composite index ix_ai_summaries_org_type_period.
        """
        conditions = self._base_conditions(
            organization_id, owner_id=owner_id, team_ids=team_ids
        )
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        stmt = select(
            func.coalesce(
                func.sum(case(whens={"daily": 1}, value=AISummary.summary_type, else_=0)),
                0,
            ).label("daily"),
            func.coalesce(
                func.sum(case(whens={"weekly": 1}, value=AISummary.summary_type, else_=0)),
                0,
            ).label("weekly"),
            func.coalesce(
                func.sum(case(whens={"monthly": 1}, value=AISummary.summary_type, else_=0)),
                0,
            ).label("monthly"),
            func.coalesce(
                func.sum(case(whens={"executive": 1}, value=AISummary.summary_type, else_=0)),
                0,
            ).label("executive"),
            func.coalesce(
                func.sum(
                    case(
                        (AISummary.generated_at >= today_start, 1),
                        else_=0,
                    )
                ),
                0,
            ).label("today_count"),
            func.coalesce(func.sum(AISummary.critical_insights), 0).label("total_critical"),
            func.coalesce(func.sum(AISummary.positive_trends), 0).label("total_positive"),
            func.coalesce(func.sum(AISummary.negative_trends), 0).label("total_negative"),
            func.coalesce(func.sum(AISummary.recommendations_count), 0).label("total_recs"),
            func.count(AISummary.id).label("total"),
        ).where(and_(*conditions))

        result = await self.db.execute(stmt)
        row = result.mappings().one()
        return {
            "daily_summaries":         int(row["daily"] or 0),
            "weekly_summaries":        int(row["weekly"] or 0),
            "monthly_summaries":       int(row["monthly"] or 0),
            "executive_summaries":     int(row["executive"] or 0),
            "todays_summaries":        int(row["today_count"] or 0),
            "critical_insights":       int(row["total_critical"] or 0),
            "positive_trends":         int(row["total_positive"] or 0),
            "negative_trends":         int(row["total_negative"] or 0),
            "pending_recommendations": int(row["total_recs"] or 0),
            "total_summaries":         int(row["total"] or 0),
        }

    async def get_recent_critical_summaries(
        self,
        organization_id: UUID,
        *,
        owner_id: UUID | None,
        team_ids: list[UUID] | None,
        lookback_hours: int = 24,
    ) -> list[dict[str, Any]]:
        threshold = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)
        conditions = self._base_conditions(
            organization_id, owner_id=owner_id, team_ids=team_ids
        )
        conditions.extend([
            AISummary.generated_at >= threshold,
            AISummary.priority.in_(["critical", "high"]),
        ])
        stmt = (
            select(
                AISummary.id,
                AISummary.summary_type,
                AISummary.priority,
                AISummary.title,
                AISummary.executive_summary,
                AISummary.critical_insights,
                AISummary.generated_at,
                AISummary.notification_sent,
            )
            .where(and_(*conditions))
            .order_by(AISummary.generated_at.desc())
            .limit(20)
        )
        result = await self.db.execute(stmt)
        return [dict(r._mapping) for r in result.all()]

    async def get_latest_by_type(
        self,
        organization_id: UUID,
        summary_type: str,
    ) -> dict[str, Any] | None:
        stmt = (
            select(
                AISummary.id,
                AISummary.summary_type,
                AISummary.priority,
                AISummary.title,
                AISummary.executive_summary,
                AISummary.critical_insights,
                AISummary.generated_at,
                AISummary.notification_sent,
            )
            .where(
                AISummary.organization_id == organization_id,
                AISummary.is_active.is_(True),
                AISummary.summary_type == summary_type,
            )
            .order_by(AISummary.generated_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        row = result.mappings().first()
        return dict(row) if row else None

    async def mark_notification_sent(self, summary_id: UUID) -> None:
        stmt = select(AISummary).where(AISummary.id == summary_id)
        result = await self.db.execute(stmt)
        record = result.scalar_one_or_none()
        if record:
            record.notification_sent = True
            self.db.add(record)
            await self.db.flush()
