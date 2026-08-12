"""
Dashboard analytics service.
"""
from __future__ import annotations

import asyncio # added for concurrent execution
from datetime import datetime, timedelta, timezone, date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import and_, case, func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.activity import ActivityTimeline
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.email import Email, GmailConnection
from app.models.lead import Lead
from app.models.lead_score import LeadScore
from app.models.calendar_event import CalendarEvent
from app.models.event_outbox import EventOutbox
from app.models.task import Task
from app.models.workflow import WorkflowTask
from app.models.user import User, UserRole
from app.models.role import Role
from app.repositories.pipeline_repository import PipelineRepository
from app.schemas.dashboard import (
    DashboardAnalyticsResponse,
    DashboardRevenuePoint,
    DashboardStatsResponse,
    DashboardSummaryResponse,
    DashboardTrendPoint,
    DashboardTrendResponse,
    TopSalesRepresentativeResponse,
    # ── Command Center Schemas ──
    SalesRepCommandDashboardResponse,
    RepDashboardKPIs,
    RepQuotaPace,
    RepTaskItem,
    RepMeetingItem,
    RepPriorityLeadItem,
    RepDealAtRiskItem,
)
from app.services.pipeline_service import PipelineService
from app.utils.enums import DealStatus


def _format_inr(value: Decimal) -> str:
    """Format a decimal amount using Indian (lakh/crore) grouping, e.g. 1234567.5 -> 12,34,567.5"""
    if value is None:
        return "0"
    raw = format(abs(value), ".0f")
    integer_part = raw
    sign = "-" if value < 0 else ""
    if len(integer_part) <= 3:
        grouped = integer_part
    else:
        last_three = integer_part[-3:]
        rest = integer_part[:-3]
        rest = rest[::-1]
        grouped = ",".join(rest[i:i + 2] for i in range(0, len(rest), 2))[::-1] + "," + last_three
    return f"{sign}{grouped}"


class DashboardService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.pipeline_service = PipelineService(db)
        self.pipeline_repo = PipelineRepository(db)

    async def summary(self, organization_id: UUID) -> DashboardSummaryResponse:
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)

        async def count(model, *criteria):
            stmt = select(func.count(model.id)).where(
                model.organization_id == organization_id,
                model.is_active.is_(True),
                *criteria,
            )
            result = await self.db.execute(stmt)
            return int(result.scalar_one() or 0)

        total_users = await count(User)
        total_companies = await count(Company)
        total_contacts = await count(Contact)
        total_leads = await count(Lead)
        total_deals = await count(Deal)
        won_deals = await count(Deal, Deal.status == DealStatus.WON.value)
        lost_deals = await count(Deal, Deal.status == DealStatus.LOST.value)

        revenue = await self._sum_deal_amount(organization_id, Deal.status == DealStatus.WON.value)
        monthly_revenue = await self._monthly_revenue(organization_id, months=6)

        lead_conversion_rate = self._percentage(await self._count_leads_by_status(organization_id, Lead.status == "converted"), total_leads)
        deal_win_rate = self._percentage(won_deals, won_deals + lost_deals)

        activity_count = await self._count_rows(ActivityTimeline, organization_id)
        email_count = await self._count_rows(Email, organization_id)
        recent_activity_count = await self._count_rows(ActivityTimeline, organization_id, ActivityTimeline.created_at >= thirty_days_ago)
        recent_email_count = await self._count_rows(Email, organization_id, Email.created_at >= thirty_days_ago)

        pipeline_board = await self.pipeline_service.get_board(organization_id)
        top_sales_reps = await self._top_sales_representatives(organization_id)

        return DashboardSummaryResponse(
            organization_id=organization_id,
            total_users=total_users,
            total_companies=total_companies,
            total_contacts=total_contacts,
            total_leads=total_leads,
            total_deals=total_deals,
            won_deals=won_deals,
            lost_deals=lost_deals,
            revenue=revenue,
            monthly_revenue=monthly_revenue,
            lead_conversion_rate=lead_conversion_rate,
            deal_win_rate=deal_win_rate,
            activity_count=activity_count,
            email_count=email_count,
            recent_activity_count=recent_activity_count,
            recent_email_count=recent_email_count,
            pipeline_distribution=pipeline_board.stages,
            top_sales_representatives=top_sales_reps,
            generated_at=now,
        )

    async def stats(self, organization_id: UUID) -> DashboardStatsResponse:
        now = datetime.now(timezone.utc)
        summary = await self.summary(organization_id)
        forecast = await self.pipeline_service.forecast(organization_id)
        return DashboardStatsResponse(
            organization_id=organization_id,
            total_deals=summary.total_deals,
            total_revenue=summary.revenue,
            pipeline_value=forecast.total_pipeline_value,
            lead_conversion_rate=summary.lead_conversion_rate,
            win_rate=summary.deal_win_rate,
            activity_count=summary.activity_count,
            email_count=summary.email_count,
            forecast=forecast,
            monthly_revenue=summary.monthly_revenue,
            top_sales_representatives=summary.top_sales_representatives,
            generated_at=now,
        )

    async def trends(self, organization_id: UUID) -> DashboardTrendResponse:
        now = datetime.now(timezone.utc)
        points: list[DashboardTrendPoint] = []
        for days in (7, 14, 30):
            period_start = now - timedelta(days=days)
            stmt = select(
                func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0),
                func.count(Deal.id),
            ).where(
                Deal.organization_id == organization_id,
                Deal.is_active.is_(True),
                Deal.created_at >= period_start,
            )
            result = await self.db.execute(stmt)
            total_amount, count = result.one()
            points.append(
                DashboardTrendPoint(
                    period=f"last_{days}_days",
                    value=Decimal(str(total_amount or 0)),
                    count=int(count or 0),
                )
            )
        return DashboardTrendResponse(points=points)

    async def analytics(self, organization_id: UUID) -> DashboardAnalyticsResponse:
        summary = await self.summary(organization_id)
        pipeline = await self.pipeline_service.get_board(organization_id)
        trends = await self.trends(organization_id)
        return DashboardAnalyticsResponse(
            summary=summary,
            pipeline=pipeline,
            monthly_revenue=summary.monthly_revenue,
            top_sales_representatives=summary.top_sales_representatives,
            trends=trends,
        )

    async def revenue_series(self, organization_id: UUID, months: int = 6) -> list[DashboardRevenuePoint]:
        return await self._monthly_revenue(organization_id, months=months)

    async def top_sales_representatives(self, organization_id: UUID, limit: int = 5) -> list[TopSalesRepresentativeResponse]:
        reps = await self._top_sales_representatives(organization_id)
        return reps[:limit]

    async def _count_rows(self, model, organization_id: UUID, *criteria) -> int:
        stmt = select(func.count(model.id)).where(model.organization_id == organization_id, model.is_active.is_(True), *criteria)
        result = await self.db.execute(stmt)
        return int(result.scalar_one() or 0)

    async def _sum_deal_amount(self, organization_id: UUID, *criteria) -> Decimal:
        stmt = select(func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0)).where(
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            *criteria,
        )
        result = await self.db.execute(stmt)
        return Decimal(str(result.scalar_one() or 0))

    async def _count_leads_by_status(self, organization_id: UUID, *criteria) -> int:
        stmt = select(func.count(Lead.id)).where(
            Lead.organization_id == organization_id,
            Lead.is_active.is_(True),
            Lead.is_deleted.is_(False),
            *criteria,
        )
        result = await self.db.execute(stmt)
        return int(result.scalar_one() or 0)

    async def _monthly_revenue(self, organization_id: UUID, months: int = 6) -> list[DashboardRevenuePoint]:
        now = datetime.now(timezone.utc)
        series: list[DashboardRevenuePoint] = []
        for offset in range(months - 1, -1, -1):
            start, end = self._month_bounds(now, offset)
            stmt = select(
                func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0),
                func.count(Deal.id),
            ).where(
                Deal.organization_id == organization_id,
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
                Deal.status == DealStatus.WON.value,
                Deal.closed_at >= start,
                Deal.closed_at < end,
            )
            result = await self.db.execute(stmt)
            total_amount, count = result.one()
            series.append(
                DashboardRevenuePoint(
                    period=start.strftime("%Y-%m"),
                    revenue=Decimal(str(total_amount or 0)),
                    deal_count=int(count or 0),
                )
            )
        return series

    async def _top_sales_representatives(self, organization_id: UUID, limit: int = 5) -> list[TopSalesRepresentativeResponse]:
        won_count = func.sum(case((Deal.status == DealStatus.WON.value, 1), else_=0))
        stmt = (
            select(
                User.id,
                User.full_name,
                func.count(Deal.id),
                func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0),
                func.coalesce(won_count, 0),
            )
            .select_from(User)
            .join(Deal, Deal.owner_id == User.id, isouter=True)
            .where(
                User.organization_id == organization_id,
                User.is_active.is_(True),
                User.is_deleted.is_(False),
            )
            .group_by(User.id, User.full_name)
            .order_by(func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0).desc(), func.count(Deal.id).desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        return [
            TopSalesRepresentativeResponse(
                user_id=row[0],
                full_name=row[1],
                deal_count=int(row[2] or 0),
                revenue=Decimal(str(row[3] or 0)),
                won_deals=int(row[4] or 0),
            )
            for row in rows
        ]

    def _percentage(self, numerator: int, denominator: int) -> Decimal:
        if denominator <= 0:
            return Decimal("0")
        return (Decimal(numerator) * Decimal("100")) / Decimal(denominator)

    def _month_bounds(self, base: datetime, offset: int) -> tuple[datetime, datetime]:
        month = base.month - offset
        year = base.year
        while month <= 0:
            month += 12
            year -= 1
        start = datetime(year, month, 1, tzinfo=timezone.utc)
        if month == 12:
            end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end = datetime(year, month + 1, 1, tzinfo=timezone.utc)
        return start, end


    async def redesigned_dashboard(self, user_id: UUID, organization_id: UUID):
        from app.repositories.dashboard_repository import DashboardRepository
        from app.schemas.dashboard import (
            DashboardDealItem,
            DashboardDealRiskItem,
            DashboardDealsAtRiskCard,
            DashboardLeadsCard,
            DashboardCallsTodayCard,
            DashboardMeetingItem,
            DashboardMeetingsCard,
            DashboardOpenDealsCard,
            DashboardPriorityQueueCard,
            DashboardPriorityQueueItem,
            DashboardQuotaCard,
            DashboardPipelineFunnelCard,
            DashboardPipelineStage,
            DashboardTaskItem,
            DashboardTasksCard,
            DashboardUntouchedDealsCard,
            DashboardWorkSummaryCard,
            RedesignedDashboardResponse,
        )

        repo = DashboardRepository(self.db)
        now = datetime.now(timezone.utc)
        untouched_threshold_days = 7
        untouched_cutoff = now - timedelta(days=untouched_threshold_days)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow_start = today_start + timedelta(days=1)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = month_start.replace(year=month_start.year + 1, month=1) if month_start.month == 12 else month_start.replace(month=month_start.month + 1)

        # Provision the session connection up-front so the concurrent gather below
        # uses an already-checked-out connection (asyncpg race guard).
        await self.db.connection()

        # Run all independent DB queries concurrently
        (
            open_count,
            recent_deals,
            latest_activity_rows,
            calls_summary,
            active_leads_count,
            task_rows,
            task_summary,
            meeting_rows,
            priority_rows,
            at_risk_rows,
            quota_stats,
            quota_target_raw,
            pipeline_rows,
        ) = await asyncio.gather(
            repo.count_open_deals(organization_id, user_id),
            repo.recent_open_deals(organization_id, user_id),
            repo.latest_deal_activity(organization_id, user_id),
            repo.calls_today_summary(organization_id, user_id, today_start, tomorrow_start),
            repo.count_active_leads(organization_id, user_id),
            repo.open_tasks(organization_id, user_id),
            repo.task_summary(organization_id, user_id, today_start, tomorrow_start),
            repo.dashboard_meetings(organization_id, user_id, now),
            repo.priority_candidates(organization_id, user_id),
            repo.at_risk_deals(organization_id, user_id),
            repo.quota_stats(organization_id, user_id, month_start, next_month),
            repo.user_sales_quota(organization_id, user_id),
            repo.pipeline_funnel(organization_id, user_id),
        )

        # --- Post-process results into card objects ---

        open_deals = DashboardOpenDealsCard(
            count=open_count,
            recent_deals=[
                DashboardDealItem(
                    id=deal.id,
                    name=deal.name,
                    status=deal.status,
                    amount=deal.amount,
                    expected_close_date=deal.expected_close_date.isoformat() if deal.expected_close_date else None,
                )
                for deal in recent_deals
            ],
        )

        untouched_ids = [
            deal.id for deal, last_activity_at in latest_activity_rows
            if last_activity_at is None or last_activity_at < untouched_cutoff
        ]
        untouched_deals = DashboardUntouchedDealsCard(
            count=len(untouched_ids),
            threshold_days=untouched_threshold_days,
            deal_ids=untouched_ids,
        )

        calls_today = DashboardCallsTodayCard(
            count=calls_summary["total"],
            pending=calls_summary["pending"],
            completed=calls_summary["completed"],
            total=calls_summary["total"],
        )

        my_leads = DashboardLeadsCard(count=active_leads_count)

        task_items = [
            DashboardTaskItem(
                id=row["task"].id,
                title=row["task"].title,
                due_date=row["task"].due_date or row["task"].created_at,
                priority=row["task"].priority,
                status=row["task"].status,
                overdue=bool(row["task"].due_date and row["task"].due_date < now),
            )
            for row in task_rows
        ]
        tasks = DashboardTasksCard(
            count=len(task_items),
            today=task_summary["today"],
            upcoming=task_summary["upcoming"],
            overdue=task_summary["overdue"],
            items=task_items,
        )
        todays_work_summary = DashboardWorkSummaryCard(
            total=task_summary["total"],
            completed=task_summary["completed"],
            completion_percentage=self._percentage(task_summary["completed"], task_summary["total"]),
        )

        today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        meeting_items = [
            DashboardMeetingItem(
                id=meeting.id,
                title=meeting.title,
                start_datetime=meeting.start_datetime,
                end_datetime=meeting.end_datetime,
                status=meeting.status,
                meeting_link=meeting.meeting_url,
                location=meeting.location,
            )
            for meeting in meeting_rows
        ]
        meetings = DashboardMeetingsCard(
            count=len(meeting_items),
            today=[item for item in meeting_items if item.start_datetime <= today_end],
            upcoming=[item for item in meeting_items if item.start_datetime > today_end],
        )

        priority_items = []
        priority_weights = {"critical": 35, "high": 25, "medium": 15, "low": 5}
        for row in priority_rows:
            task = row["task"]
            score = priority_weights.get(str(task.priority).lower(), 10)
            reasons = [f"{task.priority} priority"]
            task_due = task.due_date or task.created_at
            if task_due < now:
                score += 40
                reasons.append("overdue")
            else:
                days_until_due = max((task_due - now).days, 0)
                if days_until_due <= 1:
                    score += 25
                    reasons.append("due soon")
                elif days_until_due <= 3:
                    score += 15
                    reasons.append("upcoming due date")
            deal_value = Decimal(str(row.get("deal_value") or 0))
            if deal_value >= Decimal("10000"):
                score += 15
                reasons.append("high deal value")
            lead_score = int(row.get("lead_score") or 0)
            if lead_score >= 80:
                score += 10
                reasons.append("strong lead score")
            priority_items.append(
                DashboardPriorityQueueItem(
                    task_id=task.id,
                    title=task.title,
                    priority_score=min(score, 100),
                    label="Task",
                    reason=reasons[0] if reasons else None,
                    reasons=reasons,
                    due_date=task_due,
                    overdue=task_due < now,
                )
            )
        priority_items.sort(key=lambda item: item.priority_score, reverse=True)
        priority_queue = DashboardPriorityQueueCard(items=priority_items[:10])

        risk_items = []
        for row in at_risk_rows:
            deal = row["deal"]
            score = 0
            reasons = []
            last_activity_at = row.get("last_activity_at")
            if last_activity_at is None:
                score += 35
                reasons.append("no recorded activity")
            else:
                inactive_days = (now - last_activity_at).days
                if inactive_days >= 7:
                    score += 30
                    reasons.append(f"no activity for {inactive_days} days")
            if deal.expected_close_date and deal.expected_close_date < now.date():
                score += 30
                reasons.append("close date overdue")
            if deal.status and "proposal" in deal.status.lower():
                score += 20
                reasons.append("proposal pending")
            engagement_score = row.get("engagement_score")
            if engagement_score is not None and int(engagement_score) < 40:
                score += 20
                reasons.append("negative customer engagement")
            lead_score = row.get("lead_score")
            if lead_score is not None and int(lead_score) < 50:
                score += 10
                reasons.append("low lead score")
            if score > 0:
                risk_items.append(
                    DashboardDealRiskItem(
                        deal_id=deal.id,
                        deal_name=deal.name,
                        risk_score=min(score, 100),
                        risk_reason=", ".join(reasons),
                        amount=deal.amount,
                        company_name=row.get("company_name"),
                    )
                )
        risk_items.sort(key=lambda item: item.risk_score, reverse=True)
        deals_at_risk = DashboardDealsAtRiskCard(items=risk_items[:10])

        achieved = Decimal(str(quota_stats["achieved"] or 0))
        quota_target = Decimal(str(quota_target_raw)) if quota_target_raw is not None else None
        elapsed_days = Decimal(str(now.day))
        days_in_month = Decimal(str((next_month - month_start).days))
        expected = (quota_target * elapsed_days / days_in_month) if quota_target else None
        percentage = (achieved * Decimal('100') / quota_target) if quota_target and quota_target > 0 else None
        quota_status = 'target_unavailable'
        if quota_target and expected is not None:
            quota_status = 'on_track' if achieved >= expected else 'behind'
        won_deals = int(quota_stats["won_deals"] or 0)
        quota = DashboardQuotaCard(
            target=quota_target,
            achieved=achieved,
            expected=expected,
            gap_to_goal=max((quota_target or Decimal("0")) - achieved, Decimal("0")),
            percentage=percentage,
            won_deals=won_deals,
            average_deal_size=Decimal(str(quota_stats["average_deal_size"] or 0)),
            status=quota_status,
        )

        pipeline_funnel = DashboardPipelineFunnelCard(
            stages=[
                DashboardPipelineStage(
                    label=row["label"],
                    count=row["count"],
                    conversion_percentage=Decimal(str(row["conversion_percentage"])),
                )
                for row in pipeline_rows
            ]
        )

        return RedesignedDashboardResponse(
            openDeals=open_deals,
            callsToday=calls_today,
            untouchedDeals=untouched_deals,
            myLeads=my_leads,
            tasks=tasks,
            meetings=meetings,
            priorityQueue=priority_queue,
            dealsAtRisk=deals_at_risk,
            quota=quota,
            pipelineFunnel=pipeline_funnel,
            todaysWorkSummary=todays_work_summary,
            lastUpdated=now,
        )

    async def _user_sales_quota(self, user_id: UUID, organization_id: UUID) -> Decimal | None:
        stmt = select(User.sales_quota).where(
            User.id == user_id,
            User.organization_id == organization_id,
            User.is_active.is_(True),
            User.is_deleted.is_(False),
        )
        quota = (await self.db.execute(stmt)).scalar_one_or_none()
        return Decimal(str(quota)) if quota is not None else None

    # -------------------------------------------------------------------------
    # Admin Dashboard KPI  (admin-only, cross-org aware)
    # -------------------------------------------------------------------------

    async def admin_kpi(self, organization_id: UUID):  # noqa: C901
        """
        Compute all Admin Dashboard KPIs scoped to the caller's organization.
        Returns AdminDashboardResponse.
        """
        from app.models.organization import Organization
        from app.schemas.dashboard import (
            AdminAuditLogItem,
            AdminCompanyStats,
            AdminContactStats,
            AdminCustomWorkflowStats,
            AdminDashboardResponse,
            AdminDataQuality,
            AdminDashboardSummary,
            AdminIntegrationStatus,
            AdminLeadFunnelStage,
            AdminLeadSourceBreakdown,
            AdminLeadStats,
            AdminLicenseUsage,
            AdminMetricAvailability,
            AdminMonthlySalesPoint,
            AdminNotificationSummary,
            AdminOrganizationStats,
            AdminOverviewCards,
            AdminOverviewMetric,
            AdminRecentActivity,
            AdminRevenueLeadSummary,
            AdminRevenueStats,
            AdminRevenueTrendPoint,
            AdminRoleDistributionItem,
            AdminSecurityStats,
            AdminServiceHealthItem,
            AdminSystemHealth,
            AdminTaskStats,
            AdminTopCompany,
            AdminTopSalesRep,
            AdminUserManagement,
            AdminUserStats,
        )

        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=now.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = month_start.replace(year=month_start.year + 1, month=1) if month_start.month == 12 else month_start.replace(month=month_start.month + 1)
        year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start, _ = self._month_bounds(now, 1)

        def _base(model):
            """Base where-clause for a tenanted, non-deleted, active model."""
            return [
                model.organization_id == organization_id,
                model.is_active.is_(True),
                model.is_deleted.is_(False),
            ]

        async def _count(model, *extra):
            stmt = select(func.count(model.id)).where(*_base(model), *extra)
            r = await self.db.execute(stmt)
            return int(r.scalar_one() or 0)

        async def _sum_amount(model, *extra):
            stmt = select(func.coalesce(func.sum(model.amount), 0)).where(
                *_base(model), *extra
            )
            r = await self.db.execute(stmt)
            return Decimal(str(r.scalar_one() or 0))

        async def _org_count(*extra):
            """Count organizations (no organization_id filter — Organization IS the org)."""
            stmt = select(func.count(Organization.id)).where(
                Organization.is_active.is_(True),
                Organization.is_deleted.is_(False),
                *extra,
            )
            r = await self.db.execute(stmt)
            return int(r.scalar_one() or 0)

        # Provision the session connection up-front so every asyncio.gather below
        # uses an already-checked-out connection. Without this, the first execute()
        # races the checkout and asyncpg raises "another operation is in progress".
        await self.db.connection()

        admin_visible_roles = ["manager", "sales_rep", "sales_representative"]

        async def _active_users_count():
            stmt = (
                select(func.count(func.distinct(User.id)))
                .select_from(User)
                .join(UserRole, UserRole.user_id == User.id)
                .join(Role, Role.id == UserRole.role_id)
                .where(
                    User.organization_id == organization_id,
                    User.is_active.is_(True),
                    User.is_deleted.is_(False),
                    Role.name.in_(admin_visible_roles),
                )
            )
            return int((await self.db.execute(stmt)).scalar_one() or 0)

        async def _prev_active_users_count():
            stmt = (
                select(func.count(func.distinct(User.id)))
                .select_from(User)
                .join(UserRole, UserRole.user_id == User.id)
                .join(Role, Role.id == UserRole.role_id)
                .where(
                    User.organization_id == organization_id,
                    User.is_deleted.is_(False),
                    Role.name.in_(admin_visible_roles),
                    User.created_at < month_start,
                )
            )
            return int((await self.db.execute(stmt)).scalar_one() or 0)

        # ── Batch 1: Independent org/user/company/contact queries ─────────
        (
            total_orgs, added_orgs_month, prev_orgs,
            total_users, active_users, new_users_month,
            total_companies, new_companies_month, prev_companies,
            total_contacts, new_contacts_month, prev_contacts,
        ) = await asyncio.gather(
            _org_count(),
            _org_count(Organization.created_at >= month_start),
            _org_count(Organization.created_at >= last_month_start, Organization.created_at < month_start),
            _count(User),
            _active_users_count(),
            _count(User, User.created_at >= month_start),
            _count(Company),
            _count(Company, Company.created_at >= month_start),
            _count(Company, Company.created_at >= last_month_start, Company.created_at < month_start),
            _count(Contact),
            _count(Contact, Contact.created_at >= month_start),
            _count(Contact, Contact.created_at >= last_month_start, Contact.created_at < month_start),
        )

        org_growth = self._percentage(added_orgs_month - prev_orgs, max(prev_orgs, 1))
        org_stats = AdminOrganizationStats(total=total_orgs, added_this_month=added_orgs_month, monthly_growth_pct=org_growth)
        inactive_users = total_users - active_users
        user_stats = AdminUserStats(total=total_users, active=active_users, inactive=max(inactive_users, 0), new_this_month=new_users_month)
        company_growth = self._percentage(new_companies_month - prev_companies, max(prev_companies, 1))
        company_stats = AdminCompanyStats(total=total_companies, added_this_month=new_companies_month, monthly_growth_pct=company_growth)
        contact_growth = self._percentage(new_contacts_month - prev_contacts, max(prev_contacts, 1))
        contact_stats = AdminContactStats(total=total_contacts, new_this_month=new_contacts_month, monthly_growth_pct=contact_growth)

        # ── Batch 2: Lead counts, revenue sums, task counts ──────────────
        (
            total_leads, new_leads_today, new_leads_month, prev_leads,
            converted_leads, won_leads,
            rev_today, rev_week, rev_month, rev_year, prev_month_rev,
            pending_tasks, overdue_tasks, due_today,
            prev_active_users,
        ) = await asyncio.gather(
            _count(Lead),
            _count(Lead, Lead.created_at >= today_start),
            _count(Lead, Lead.created_at >= month_start),
            _count(Lead, Lead.created_at >= last_month_start, Lead.created_at < month_start),
            _count(Lead, Lead.status == DealStatus.WON.value),
            _count(Lead, Lead.status == "won"),
            _sum_amount(Deal, Deal.status == DealStatus.WON.value, Deal.closed_at >= today_start),
            _sum_amount(Deal, Deal.status == DealStatus.WON.value, Deal.closed_at >= week_start),
            _sum_amount(Deal, Deal.status == DealStatus.WON.value, Deal.closed_at >= month_start),
            _sum_amount(Deal, Deal.status == DealStatus.WON.value, Deal.closed_at >= year_start),
            _sum_amount(Deal, Deal.status == DealStatus.WON.value, Deal.closed_at >= last_month_start, Deal.closed_at < month_start),
            self._count_rows(ActivityTimeline, organization_id, ActivityTimeline.action.in_(["meeting", "call", "task"]), ActivityTimeline.created_at >= now),
            self._count_rows(ActivityTimeline, organization_id, ActivityTimeline.action.in_(["meeting", "call", "task"]), ActivityTimeline.created_at < now),
            self._count_rows(ActivityTimeline, organization_id, ActivityTimeline.action.in_(["meeting", "call", "task"]), ActivityTimeline.created_at >= today_start, ActivityTimeline.created_at < today_start + timedelta(days=1)),
            _prev_active_users_count(),
        )

        total_converted = max(converted_leads, won_leads)
        lead_growth = self._percentage(new_leads_month - prev_leads, max(prev_leads, 1))
        conversion_rate = self._percentage(total_converted, max(total_leads, 1))
        lead_stats = AdminLeadStats(total=total_leads, new_today=new_leads_today, new_this_month=new_leads_month, monthly_growth_pct=lead_growth, converted=total_converted, conversion_rate=conversion_rate)
        rev_growth = self._percentage(int(rev_month - prev_month_rev), max(int(prev_month_rev), 1))
        revenue_stats = AdminRevenueStats(today=rev_today, this_week=rev_week, this_month=rev_month, this_year=rev_year, growth_pct=rev_growth)
        task_stats = AdminTaskStats(pending=pending_tasks, overdue=overdue_tasks, due_today=due_today)
        summary = AdminDashboardSummary(organizations=org_stats, users=user_stats, companies=company_stats, contacts=contact_stats, leads=lead_stats, revenue=revenue_stats, tasks=task_stats)
        overview = AdminOverviewCards(
            revenue_month=AdminOverviewMetric(current_value=rev_month, previous_value=prev_month_rev, percentage_change=rev_growth),
            active_users=AdminOverviewMetric(current_value=Decimal(active_users), previous_value=Decimal(prev_active_users), percentage_change=self._percentage(active_users - prev_active_users, max(prev_active_users, 1))),
            companies=AdminOverviewMetric(current_value=Decimal(total_companies), previous_value=Decimal(max(total_companies - new_companies_month + prev_companies, 0)), percentage_change=company_growth),
            new_leads=AdminOverviewMetric(current_value=Decimal(new_leads_month), previous_value=Decimal(prev_leads), percentage_change=lead_growth),
        )

        # ── Batch 3: Monthly sales time-series (3 independent queries) ───
        trend_start, _ = self._month_bounds(now, 11)
        lead_month_stmt = (
            select(func.date_trunc("month", Lead.created_at).label("month"), func.count(Lead.id))
            .where(*_base(Lead), Lead.created_at >= trend_start, Lead.created_at < next_month)
            .group_by("month")
        )
        revenue_month_stmt = (
            select(
                func.date_trunc("month", Deal.closed_at).label("month"),
                func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0),
            )
            .where(*_base(Deal), Deal.status == DealStatus.WON.value, Deal.closed_at >= trend_start, Deal.closed_at < next_month)
            .group_by("month")
        )
        converted_month_stmt = (
            select(func.date_trunc("month", Lead.updated_at).label("month"), func.count(Lead.id))
            .where(*_base(Lead), Lead.status.in_(["won", "converted"]), Lead.updated_at >= trend_start, Lead.updated_at < next_month)
            .group_by("month")
        )
        lead_month_res, revenue_month_res, converted_month_res = await asyncio.gather(
            self.db.execute(lead_month_stmt),
            self.db.execute(revenue_month_stmt),
            self.db.execute(converted_month_stmt),
        )
        lead_counts = {row[0].strftime("%Y-%m"): int(row[1] or 0) for row in lead_month_res.all() if row[0]}
        revenue_counts = {row[0].strftime("%Y-%m"): Decimal(str(row[1] or 0)) for row in revenue_month_res.all() if row[0]}
        converted_counts = {row[0].strftime("%Y-%m"): int(row[1] or 0) for row in converted_month_res.all() if row[0]}
        monthly_sales: list[AdminMonthlySalesPoint] = []
        revenue_trend: list[AdminRevenueTrendPoint] = []
        for offset in range(11, -1, -1):
            start, _ = self._month_bounds(now, offset)
            key = start.strftime("%Y-%m")
            revenue_value = revenue_counts.get(key, Decimal("0"))
            lead_count = lead_counts.get(key, 0)
            monthly_sales.append(AdminMonthlySalesPoint(month=key, leads_created=lead_count, leads_converted=converted_counts.get(key, 0), revenue=revenue_value))
            revenue_trend.append(AdminRevenueTrendPoint(month=key, revenue=revenue_value, lead_count=lead_count))

        # ── Batch 4: Lead analytics + top performers ─────────────────────
        source_stmt = (
            select(Lead.source, func.count(Lead.id))
            .where(*_base(Lead))
            .group_by(Lead.source)
            .order_by(func.count(Lead.id).desc())
        )
        funnel_stages = ["new", "contacted", "qualified", "proposal_sent", "negotiation", "won", "lost"]
        funnel_stmt = (
            select(Lead.status, func.count(Lead.id))
            .where(*_base(Lead))
            .group_by(Lead.status)
        )
        won_expr = func.sum(case((Deal.status == DealStatus.WON.value, 1), else_=0))
        total_deals_expr = func.count(Deal.id)
        top_reps_stmt = (
            select(
                User.id, User.full_name,
                func.coalesce(total_deals_expr, 0),
                func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), Decimal("0")),
                func.coalesce(won_expr, 0),
            )
            .select_from(User)
            .outerjoin(Deal, (Deal.owner_id == User.id) & Deal.is_active.is_(True) & Deal.is_deleted.is_(False))
            .where(
                User.organization_id == organization_id, User.is_active.is_(True), User.is_deleted.is_(False),
                User.id.in_(select(UserRole.user_id).join(Role, Role.id == UserRole.role_id).where(Role.name.in_(["manager", "sales_rep", "sales_representative"]))),
            )
            .group_by(User.id, User.full_name)
            .order_by(func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0).desc())
            .limit(5)
        )
        top_companies_stmt = (
            select(
                Company.id, Company.name,
                func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0),
                func.count(Lead.id.distinct()),
                func.count(Contact.id.distinct()),
            )
            .select_from(Company)
            .outerjoin(Deal, (Deal.company_id == Company.id) & Deal.is_active.is_(True) & Deal.is_deleted.is_(False) & (Deal.status == DealStatus.WON.value))
            .outerjoin(Lead, (Lead.company_id == Company.id) & Lead.is_active.is_(True) & Lead.is_deleted.is_(False))
            .outerjoin(Contact, (Contact.company_id == Company.id) & Contact.is_active.is_(True) & Contact.is_deleted.is_(False))
            .where(Company.organization_id == organization_id, Company.is_active.is_(True), Company.is_deleted.is_(False))
            .group_by(Company.id, Company.name)
            .order_by(func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0).desc())
            .limit(5)
        )
        recent_stmt = (
            select(ActivityTimeline)
            .where(ActivityTimeline.organization_id == organization_id, ActivityTimeline.is_active.is_(True))
            .order_by(ActivityTimeline.created_at.desc())
            .limit(20)
        )
        high_priority_leads_stmt = (
            select(func.count(Lead.id))
            .outerjoin(LeadScore, LeadScore.lead_id == Lead.id)
            .where(*_base(Lead), LeadScore.overall_score >= 70)
        )

        source_res, funnel_res, top_reps_res, top_companies_res, recent_res, high_priority_res = await asyncio.gather(
            self.db.execute(source_stmt),
            self.db.execute(funnel_stmt),
            self.db.execute(top_reps_stmt),
            self.db.execute(top_companies_stmt),
            self.db.execute(recent_stmt),
            self.db.execute(high_priority_leads_stmt),
        )

        source_rows = source_res.all()
        total_leads_for_source = sum(r[1] for r in source_rows) or 1
        lead_sources = [
            AdminLeadSourceBreakdown(source=str(r[0] or "Unknown"), count=int(r[1]), percentage=self._percentage(int(r[1]), total_leads_for_source))
            for r in source_rows
        ]
        funnel_rows = dict(funnel_res.all())
        total_funnel = sum(funnel_rows.values()) or 1
        lead_funnel = [
            AdminLeadFunnelStage(stage=stage, count=int(funnel_rows.get(stage, 0)), percentage=self._percentage(int(funnel_rows.get(stage, 0)), total_funnel))
            for stage in funnel_stages
        ]
        top_reps_rows = top_reps_res.all()
        top_sales_reps = [
            AdminTopSalesRep(user_id=row[0], full_name=row[1], deals_closed=int(row[4] or 0), revenue=Decimal(str(row[3] or 0)), conversion_rate=self._percentage(int(row[4] or 0), max(int(row[2] or 1), 1)))
            for row in top_reps_rows
        ]
        top_companies_rows = top_companies_res.all()
        top_companies = [
            AdminTopCompany(company_id=row[0], name=row[1], revenue=Decimal(str(row[2] or 0)), lead_count=int(row[3] or 0), contact_count=int(row[4] or 0))
            for row in top_companies_rows
        ]
        recent_rows = recent_res.scalars().all()
        recent_activities = [
            AdminRecentActivity(id=row.id, action=row.action, title=row.title, entity_type=row.entity_type, created_at=row.created_at, created_by=row.created_by)
            for row in recent_rows
        ]
        high_priority_leads = int(high_priority_res.scalar_one() or 0)

        notifications = AdminNotificationSummary(
            overdue_tasks=overdue_tasks, todays_meetings=due_today,
            pending_approvals=0, high_priority_leads=high_priority_leads, system_alerts=0,
        )

        # ── Batch 5: Data quality ────────────────────────────────────────
        # NOTE: each normalized "key" expression is built ONCE and reused in both the
        # SELECT list and the GROUP BY clause. Constructing the same expression twice
        # makes SQLAlchemy emit different $N bind positions in each clause, which
        # PostgreSQL treats as different expressions (asyncpg GroupingError) and
        # previously crashed the admin dashboard with a 500.
        contact_email_key = func.lower(func.trim(Contact.email))
        contact_phone_key = func.regexp_replace(func.coalesce(Contact.phone, ""), r"\D+", "", "g")
        lead_email_key = func.lower(func.trim(Lead.email))
        lead_phone_key = func.regexp_replace(func.coalesce(Lead.phone, ""), r"\D+", "", "g")
        company_name_key = func.lower(func.trim(Company.name))

        def _duplicate_count_query(model, key_expr, has_value_filter):
            """Count records sharing the same normalized key (group size > 1)."""
            filters = [*_base(model)]
            if has_value_filter is not None:
                filters.append(has_value_filter)
            return select(func.count()).select_from(
                select(model.organization_id, key_expr)
                .where(*filters)
                .group_by(model.organization_id, key_expr)
                .having(func.count(model.id) > 1)
                .subquery()
            )

        duplicate_queries = [
            _duplicate_count_query(Contact, contact_email_key, and_(Contact.email.is_not(None), contact_email_key != "")),
            _duplicate_count_query(Contact, contact_phone_key, and_(Contact.phone.is_not(None), contact_phone_key != "")),
            _duplicate_count_query(Lead, lead_email_key, and_(Lead.email.is_not(None), lead_email_key != "")),
            _duplicate_count_query(Lead, lead_phone_key, and_(Lead.phone.is_not(None), lead_phone_key != "")),
            _duplicate_count_query(Company, company_name_key, None),
        ]
        incomplete_fields_stmt = select(func.count(Lead.id)).where(*_base(Lead), or_(Lead.title.is_(None), Lead.title == "", Lead.email.is_(None), Lead.email == ""))
        orphaned_leads_stmt = (
            select(func.count(Lead.id))
            .select_from(Lead)
            .outerjoin(User, User.id == Lead.owner_id)
            .outerjoin(Company, Company.id == Lead.company_id)
            .where(
                Lead.organization_id == organization_id, Lead.is_active.is_(True), Lead.is_deleted.is_(False),
                or_((Lead.owner_id.is_not(None)) & (User.id.is_(None)), (Lead.company_id.is_not(None)) & (Company.id.is_(None))),
            )
        )

        dup_results = await asyncio.gather(*[self.db.execute(q) for q in duplicate_queries])
        incomplete_res, orphaned_res = await asyncio.gather(
            self.db.execute(incomplete_fields_stmt),
            self.db.execute(orphaned_leads_stmt),
        )
        duplicates_detected = sum(int(r.scalar_one() or 0) for r in dup_results)
        incomplete_fields = int(incomplete_res.scalar_one() or 0)
        orphaned_leads = int(orphaned_res.scalar_one() or 0)
        data_quality = AdminDataQuality(duplicates_detected=duplicates_detected, incomplete_fields=incomplete_fields, orphaned_leads=orphaned_leads)

        # ── Batch 6: Audit + integrations + workflows ────────────────────
        role_distribution_stmt = (
            select(Role.name, func.count(func.distinct(User.id)))
            .select_from(User)
            .join(UserRole, UserRole.user_id == User.id)
            .join(Role, Role.id == UserRole.role_id)
            .where(User.organization_id == organization_id, User.is_active.is_(True), User.is_deleted.is_(False))
            .group_by(Role.name)
        )
        audit_stmt = (
            select(ActivityTimeline, User.full_name)
            .outerjoin(User, User.id == ActivityTimeline.created_by)
            .where(ActivityTimeline.organization_id == organization_id, ActivityTimeline.is_active.is_(True))
            .order_by(ActivityTimeline.created_at.desc())
            .limit(10)
        )
        unusual_exports_stmt = select(func.count(ActivityTimeline.id)).where(
            ActivityTimeline.organization_id == organization_id, ActivityTimeline.is_active.is_(True),
            ActivityTimeline.action.ilike("%export%"), ActivityTimeline.created_at >= now - timedelta(hours=24),
        )
        gmail_stmt = select(func.count(GmailConnection.id), func.max(GmailConnection.updated_at)).where(
            GmailConnection.organization_id == organization_id, GmailConnection.is_active.is_(True),
        )
        calendar_stmt = select(func.count(CalendarEvent.id), func.max(CalendarEvent.updated_at)).where(
            CalendarEvent.organization_id == organization_id, CalendarEvent.is_active.is_(True), CalendarEvent.is_deleted.is_(False),
        )
        workflow_stmt = select(WorkflowTask.status, func.count(WorkflowTask.id)).where(
            WorkflowTask.organization_id == organization_id, WorkflowTask.is_active.is_(True),
        ).group_by(WorkflowTask.status)
        scoring_stmt = select(func.count(LeadScore.id)).where(LeadScore.organization_id == organization_id, LeadScore.is_active.is_(True))
        org_row_stmt = select(Organization).where(Organization.id == organization_id)

        role_res, audit_res, unusual_res, gmail_res, calendar_res, workflow_res, scoring_res, org_res = await asyncio.gather(
            self.db.execute(role_distribution_stmt),
            self.db.execute(audit_stmt),
            self.db.execute(unusual_exports_stmt),
            self.db.execute(gmail_stmt),
            self.db.execute(calendar_stmt),
            self.db.execute(workflow_stmt),
            self.db.execute(scoring_stmt),
            self.db.execute(org_row_stmt),
        )

        role_distribution = [
            AdminRoleDistributionItem(role=str(role).upper(), count=int(count or 0))
            for role, count in role_res.all()
        ]
        audit_rows = audit_res.all()
        audit_logs = [
            AdminAuditLogItem(
                event_type=row[0].action, description=row[0].description or row[0].title,
                performed_by=row[1] or "System", timestamp=row[0].created_at,
                ip_address=(row[0].payload or {}).get("ip_address") if row[0].payload else None,
                metadata=row[0].payload,
            )
            for row in audit_rows
        ]
        unusual_exports = int(unusual_res.scalar_one() or 0)
        gmail_row = gmail_res.one()
        calendar_row = calendar_res.one()
        integrations = [
            AdminIntegrationStatus(integration="Google/Gmail", status="active" if int(gmail_row[0] or 0) else "not_configured", last_sync=gmail_row[1], message=None),
            AdminIntegrationStatus(integration="Calendar", status="active" if int(calendar_row[0] or 0) else "not_configured", last_sync=calendar_row[1], message=None),
        ]
        workflow_counts = {str(status): int(count or 0) for status, count in workflow_res.all()}
        scoring_usage = int(scoring_res.scalar_one() or 0)
        org_row = org_res.scalar_one_or_none()
        seat_limit = org_row.max_users if org_row else None

        system_health = AdminSystemHealth(
            services=[
                AdminServiceHealthItem(service="API Gateway", status="unknown", message="No persisted API health metric is available."),
                AdminServiceHealthItem(service="Database", status="unknown", message="No persisted database health metric is available."),
                AdminServiceHealthItem(service="Async Workers", status="unknown", message="No persisted worker heartbeat is available."),
                AdminServiceHealthItem(service="Google/Gmail", status=integrations[0].status),
                AdminServiceHealthItem(service="Calendar", status=integrations[1].status),
            ],
            critical_logs_24h=None,
            critical_logs_24h_state=AdminMetricAvailability(value=None, available=False, reason="No persisted application log severity table exists."),
            warning_logs_24h=None,
            warning_logs_24h_state=AdminMetricAvailability(value=None, available=False, reason="No persisted application log severity table exists."),
        )
        no_storage_source = "No persisted organization storage usage/limit source exists."
        license_usage = AdminLicenseUsage(
            storage_used=None,
            storage_used_state=AdminMetricAvailability(value=None, available=False, reason=no_storage_source),
            storage_limit=None,
            storage_limit_state=AdminMetricAvailability(value=None, available=False, reason=no_storage_source),
            active_seats=active_users, seat_limit=seat_limit,
            usage_percentage=self._percentage(active_users, seat_limit) if seat_limit else None,
        )
        user_management = AdminUserManagement(
            active_seats=active_users, invites_pending=None,
            invites_pending_state=AdminMetricAvailability(value=None, available=False, reason="No persisted invitation table/model exists."),
            role_distribution=role_distribution,
        )
        custom_fields = AdminCustomWorkflowStats(
            custom_fields_active=None,
            custom_fields_active_state=AdminMetricAvailability(value=None, available=False, reason="No custom field table/model exists."),
            custom_fields_idle=None,
            custom_fields_idle_state=AdminMetricAvailability(value=None, available=False, reason="No custom field table/model exists."),
            automations_active=workflow_counts.get("pending", 0) + workflow_counts.get("in_progress", 0),
            automations_idle=workflow_counts.get("completed", 0) + workflow_counts.get("expired", 0) + workflow_counts.get("superseded", 0),
            lead_scoring_usage=scoring_usage,
        )
        security = AdminSecurityStats(
            failed_logins_24h=None,
            failed_logins_24h_state=AdminMetricAvailability(value=None, available=False, reason="No persisted failed-login event source exists."),
            active_api_keys=None,
            active_api_keys_state=AdminMetricAvailability(value=None, available=False, reason="No API key table/model exists."),
            unusual_exports=unusual_exports,
            security_status="not_available" if unusual_exports == 0 else "review_exports",
        )
        revenue_lead_summary = AdminRevenueLeadSummary(
            revenue_year=rev_year, converted_leads=total_converted,
            contacts=total_contacts, tasks_pending=pending_tasks,
        )

        return AdminDashboardResponse(
            summary=summary,
            overview=overview,
            revenue_trend=revenue_trend,
            revenue_lead_summary=revenue_lead_summary,
            monthly_sales=monthly_sales,
            lead_sources=lead_sources,
            lead_funnel=lead_funnel,
            user_management=user_management,
            system_health=system_health,
            data_quality=data_quality,
            license_usage=license_usage,
            audit_logs=audit_logs,
            integrations=integrations,
            custom_fields=custom_fields,
            security=security,
            top_sales_reps=top_sales_reps,
            top_companies=top_companies,
            recent_activities=recent_activities,
            notifications=notifications,
            generated_at=now,
        )

    # -------------------------------------------------------------------------
    # Manager Dashboard KPI  (manager-scoped, org-tenanted)
    # -------------------------------------------------------------------------

    async def manager_kpi(
        self,
        manager_id: UUID,
        organization_id: UUID,
        period: str = "quarter",
    ):  # noqa: C901
        """
        Compute all Manager Dashboard KPIs scoped to the manager's team.
        A "team" = all Users whose deals are owned inside the same org,
        and where the manager's user-id matches deal.created_by or
        activity.created_by (since PULSE CRM has no explicit manager FK yet).
        For quota we fall back to organization-level scoping so the manager
        always sees data even with no explicit hierarchy.
        """
        from app.schemas.dashboard import (
            DealAtRisk,
            ManagerAlert,
            ManagerDashboardResponse,
            ManagerDashboardSummary,
            ManagerForecastStats,
            ManagerMonthlyRevenue,
            ManagerPipelineHealth,
            ManagerPipelineStage,
            ManagerRecentActivity,
            ManagerRevenueStats,
            ManagerTeamMetrics,
            ManagerTopRep,
            RepQuotaAttainment,
        )

        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = (now - timedelta(days=now.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start, _ = self._month_bounds(now, 1)

        # -- helpers ----------------------------------------------------------
        def _deal_base(*extra):
            return [
                Deal.organization_id == organization_id,
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
                *extra,
            ]

        def _lead_base(*extra):
            return [
                Lead.organization_id == organization_id,
                Lead.is_active.is_(True),
                Lead.is_deleted.is_(False),
                *extra,
            ]

        def _user_base():
            return [
                User.organization_id == organization_id,
                User.is_active.is_(True),
                User.is_deleted.is_(False),
            ]

        def _non_admin_user_filter():
            """Return a condition that excludes users with the 'admin' role."""
            admin_user_ids = (
                select(UserRole.user_id)
                .join(Role, Role.id == UserRole.role_id)
                .where(Role.name == "admin")
                .correlate(User)
            )
            return User.id.notin_(admin_user_ids)

        async def _deal_count(*extra):
            r = await self.db.execute(
                select(func.count(Deal.id)).where(*_deal_base(*extra))
            )
            return int(r.scalar_one() or 0)

        async def _deal_sum(*extra):
            r = await self.db.execute(
                select(func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0)).where(*_deal_base(*extra))
            )
            return Decimal(str(r.scalar_one() or 0))

        # -- Team members (sales reps + managers, no admins) ------------------
        team_stmt = (
            select(User.id, User.full_name)
            .where(*_user_base(), _non_admin_user_filter())
        )
        team_rows = (await self.db.execute(team_stmt)).all()
        team_member_ids = [r[0] for r in team_rows]
        total_members = len(team_member_ids)

        # -- 1. Team Revenue Won -----------------------------------------------
        team_revenue_won = await _deal_sum(Deal.status == DealStatus.WON.value)
        prev_month_won = await _deal_sum(
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= last_month_start,
            Deal.closed_at < month_start,
        )
        this_month_won = await _deal_sum(
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= month_start,
        )
        # Target: heuristic = avg monthly revenue × 1.2 (adjustable)
        team_target = max(prev_month_won * Decimal("1.2"), Decimal("1"))
        achievement_pct = self._percentage(int(team_revenue_won), int(team_target))
        monthly_growth = self._percentage(
            int(this_month_won - prev_month_won), max(int(prev_month_won), 1)
        )

        revenue_stats = ManagerRevenueStats(
            team_revenue_won=team_revenue_won,
            team_target=team_target,
            achievement_pct=achievement_pct,
            monthly_growth_pct=monthly_growth,
        )

        # -- 2. Forecast Projection --------------------------------------------
        # SUM(amount * probability/100) for open deals
        forecast_stmt = select(
            func.coalesce(
                func.sum(
                    case(
                        (
                            Deal.amount.isnot(None),
                            Deal.amount * (Deal.probability / 100.0),
                        ),
                        else_=0,
                    )
                ),
                0,
            )
        ).where(
            *_deal_base(),
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
        )
        projected_revenue = Decimal(
            str((await self.db.execute(forecast_stmt)).scalar_one() or 0)
        )

        # Quarter revenue = WON deals in the current quarter
        quarter_month = ((now.month - 1) // 3) * 3 + 1
        quarter_start = now.replace(
            month=quarter_month, day=1, hour=0, minute=0, second=0, microsecond=0
        )
        quarter_rev = await _deal_sum(
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= quarter_start,
        )
        # Accuracy = actual / projected (capped at 100)
        forecast_accuracy = self._percentage(
            int(team_revenue_won), max(int(projected_revenue), 1)
        )
        forecast_accuracy = min(forecast_accuracy, Decimal("100"))
        confidence_score = min(
            self._percentage(int(team_revenue_won + projected_revenue), max(int(team_target), 1)),
            Decimal("100"),
        )

        forecast_stats = ManagerForecastStats(
            projected_revenue=projected_revenue,
            forecast_accuracy=forecast_accuracy,
            confidence_score=confidence_score,
            expected_quarter_revenue=quarter_rev + projected_revenue,
        )

        # -- 3. Pipeline Health ------------------------------------------------
        active_pipeline_value = await _deal_sum(
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value])
        )
        total_active_deals = await _deal_count(
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value])
        )

        stage_stmt = (
            select(Deal.status, func.count(Deal.id), func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0))
            .where(*_deal_base())
            .group_by(Deal.status)
        )
        stage_rows = (await self.db.execute(stage_stmt)).all()
        total_deal_value = sum(Decimal(str(r[2] or 0)) for r in stage_rows) or Decimal("1")
        stage_distribution = [
            ManagerPipelineStage(
                stage=str(r[0]),
                deal_count=int(r[1] or 0),
                total_value=Decimal(str(r[2] or 0)),
                percentage=self._percentage(int(r[1] or 0), sum(int(x[1] or 0) for x in stage_rows) or 1),
            )
            for r in stage_rows
        ]
        # Health score: percentage of deals with probability > 50
        high_prob_deals = await _deal_count(
            Deal.probability >= 50,
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
        )
        health_score = self._percentage(high_prob_deals, max(total_active_deals, 1))

        pipeline_health = ManagerPipelineHealth(
            active_pipeline_value=active_pipeline_value,
            total_deals=total_active_deals,
            health_score=health_score,
            stage_distribution=stage_distribution,
        )

        # -- 4. Rep Quota Attainment -------------------------------------------
        rep_revenue_stmt = (
            select(
                User.id,
                User.full_name,
                func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0),
                func.coalesce(
                    func.sum(
                        case((Deal.status == DealStatus.WON.value, Deal.amount), else_=0)
                    ),
                    0,
                ),
            )
            .select_from(User)
            .outerjoin(
                Deal,
                (Deal.owner_id == User.id)
                & Deal.is_active.is_(True)
                & Deal.is_deleted.is_(False),
            )
            .where(*_user_base(), _non_admin_user_filter())
            .group_by(User.id, User.full_name)
            .order_by(
                func.coalesce(
                    func.sum(
                        case((Deal.status == DealStatus.WON.value, Deal.amount), else_=0)
                    ),
                    0,
                ).desc()
            )
        )
        rep_rows = (await self.db.execute(rep_revenue_stmt)).all()
        rep_quota: list[RepQuotaAttainment] = []
        for rank, row in enumerate(rep_rows, start=1):
            rev_gen = Decimal(str(row[3] or 0))
            # Quota target per rep = team_target / max(total_members, 1)
            rep_target = team_target / max(total_members, 1)
            rep_quota.append(
                RepQuotaAttainment(
                    user_id=row[0],
                    full_name=row[1],
                    assigned_target=rep_target,
                    revenue_generated=rev_gen,
                    quota_achievement_pct=self._percentage(int(rev_gen), max(int(rep_target), 1)),
                    rank=rank,
                )
            )

        # -- 5. Already in stage_distribution (pipeline health) ---------------

        # -- 6. Monthly Revenue Trend (12 months) -----------------------------
        monthly_revenue_trend: list[ManagerMonthlyRevenue] = []
        prev_rev = Decimal("0")
        for offset in range(11, -1, -1):
            start, end = self._month_bounds(now, offset)
            m_rev = await _deal_sum(
                Deal.status == DealStatus.WON.value,
                Deal.closed_at >= start,
                Deal.closed_at < end,
            )
            m_target = team_target / 12
            growth = self._percentage(int(m_rev - prev_rev), max(int(prev_rev), 1))
            monthly_revenue_trend.append(
                ManagerMonthlyRevenue(
                    month=start.strftime("%Y-%m"),
                    revenue=m_rev,
                    target=m_target,
                    growth_pct=growth,
                )
            )
            prev_rev = m_rev

        # -- 7. Top 5 Performing Reps -----------------------------------------
        top_reps: list[ManagerTopRep] = []
        for rank, row in enumerate(rep_rows[:5], start=1):
            total_rep_deals = int(row[2] or 1) if row[2] else 1
            won_rev = Decimal(str(row[3] or 0))
            # Count won deals for conversion rate
            won_count_stmt = select(func.count(Deal.id)).where(
                Deal.owner_id == row[0],
                Deal.status == DealStatus.WON.value,
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
            )
            won_count = int((await self.db.execute(won_count_stmt)).scalar_one() or 0)
            total_rep_count_stmt = select(func.count(Deal.id)).where(
                Deal.owner_id == row[0],
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
            )
            total_rep_count = int((await self.db.execute(total_rep_count_stmt)).scalar_one() or 0)
            rep_target_val = team_target / max(total_members, 1)
            top_reps.append(
                ManagerTopRep(
                    user_id=row[0],
                    full_name=row[1],
                    revenue=won_rev,
                    deals_closed=won_count,
                    conversion_rate=self._percentage(won_count, max(total_rep_count, 1)),
                    quota_achievement_pct=self._percentage(int(won_rev), max(int(rep_target_val), 1)),
                )
            )

        # -- 8. Deals At Risk --------------------------------------------------
        # Criteria: open deals with expected_close_date passed OR high value
        risk_threshold = Decimal("50000")  # configurable
        seven_days_ago = now - timedelta(days=7)

        at_risk_stmt = (
            select(Deal, User.full_name, Company.name)
            .outerjoin(User, Deal.owner_id == User.id)
            .outerjoin(Company, Deal.company_id == Company.id)
            .where(
                *_deal_base(),
                Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
            )
        )
        at_risk_rows = (await self.db.execute(at_risk_stmt)).all()

        deals_at_risk: list[DealAtRisk] = []
        for deal, owner_name, company_name in at_risk_rows:
            reasons = []
            days_since = 0

            if deal.expected_close_date and deal.expected_close_date < now.date():
                reasons.append("Close date passed")
                days_since = (now.date() - deal.expected_close_date).days

            if deal.amount and deal.amount >= risk_threshold:
                reasons.append(f"High-value deal (={risk_threshold:,.0f})")

            if deal.updated_at and deal.updated_at < seven_days_ago:
                days_inactive = (now - deal.updated_at).days
                reasons.append(f"No update for {days_inactive} days")
                days_since = max(days_since, days_inactive)

            if deal.probability and deal.probability < 30:
                reasons.append(f"Low probability ({deal.probability}%)")

            if reasons:
                deals_at_risk.append(
                    DealAtRisk(
                        deal_id=deal.id,
                        deal_name=deal.name,
                        company=company_name,
                        owner_name=owner_name,
                        deal_value=Decimal(str(deal.amount or 0)),
                        risk_reason="; ".join(reasons),
                        days_since_last_activity=days_since,
                    )
                )

        deals_at_risk.sort(key=lambda d: d.days_since_last_activity, reverse=True)

        # -- 9. Manager Alerts -------------------------------------------------
        alerts: list[ManagerAlert] = []

        # Alert: team quota below pace
        expected_monthly_pace = team_target / 12
        if this_month_won < expected_monthly_pace * Decimal("0.5"):
            alerts.append(
                ManagerAlert(
                    severity="high",
                    message=f"Team quota below expected pace. Only {this_month_won:,.2f} won this month (target: {expected_monthly_pace:,.2f}).",
                    timestamp=now,
                )
            )

        # Alert: deals at risk
        if deals_at_risk:
            alerts.append(
                ManagerAlert(
                    severity="medium",
                    message=f"{len(deals_at_risk)} deal(s) at risk — review required.",
                    timestamp=now,
                )
            )

        # Alert: forecast dropped vs last week
        last_week_rev = await _deal_sum(
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= week_start - timedelta(weeks=1),
            Deal.closed_at < week_start,
        )
        this_week_rev = await _deal_sum(
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= week_start,
        )
        if this_week_rev < last_week_rev * Decimal("0.8"):
            alerts.append(
                ManagerAlert(
                    severity="medium",
                    message=f"Revenue this week ({this_week_rev:,.2f}) dropped vs last week ({last_week_rev:,.2f}).",
                    timestamp=now,
                )
            )

        # Alert: target achieved
        if team_revenue_won >= team_target:
            alerts.append(
                ManagerAlert(
                    severity="low",
                    message=f"?? Team revenue target achieved! {team_revenue_won:,.2f} of {team_target:,.2f}.",
                    timestamp=now,
                )
            )

        # Alert: high-value deal stale
        for risk_deal in deals_at_risk:
            if risk_deal.deal_value >= risk_threshold and risk_deal.days_since_last_activity >= 5:
                alerts.append(
                    ManagerAlert(
                        severity="high",
                        message=f"High-value deal '{risk_deal.deal_name}' has no follow-up for {risk_deal.days_since_last_activity} days.",
                        timestamp=now,
                    )
                )

        # -- 10. Recent Team Activity (latest 30) ------------------------------
        relevant_actions = [
            "lead_assigned", "lead_updated", "lead_created",
            "deal_created", "deal_won", "deal_lost",
            "meeting_scheduled", "call_logged", "task_completed",
            "proposal_sent", "stage_changed",
        ]
        recent_stmt = (
            select(ActivityTimeline)
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.is_active.is_(True),
                ActivityTimeline.action.in_(relevant_actions),
            )
            .order_by(ActivityTimeline.created_at.desc())
            .limit(30)
        )
        recent_rows = (await self.db.execute(recent_stmt)).scalars().all()
        recent_activities = [
            ManagerRecentActivity(
                id=row.id,
                action=row.action,
                title=row.title,
                entity_type=row.entity_type,
                created_at=row.created_at,
                created_by=row.created_by,
            )
            for row in recent_rows
        ]

        # -- 11. Team Performance Metrics --------------------------------------
        total_deals_count = await _deal_count()
        won_deals_count = await _deal_count(Deal.status == DealStatus.WON.value)
        lost_deals_count = await _deal_count(Deal.status == DealStatus.LOST.value)

        avg_deal_size_stmt = select(func.coalesce(func.avg(Deal.amount), 0)).where(
            *_deal_base(), Deal.status == DealStatus.WON.value
        )
        avg_deal_size = Decimal(str((await self.db.execute(avg_deal_size_stmt)).scalar_one() or 0))

        # Average sales cycle: AVG(days between lead.created_at and deal.closed_at)
        cycle_stmt = select(
            func.coalesce(
                func.avg(
                    func.extract("epoch", Deal.closed_at - Lead.created_at) / 86400.0
                ),
                0,
            )
        ).select_from(Deal).join(Lead, Lead.id == Deal.lead_id, isouter=True).where(
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status == DealStatus.WON.value,
            Deal.closed_at.isnot(None),
        )
        avg_cycle_days = Decimal(str((await self.db.execute(cycle_stmt)).scalar_one() or 0))

        team_conversion_rate = self._percentage(won_deals_count, max(total_deals_count, 1))
        win_rate = self._percentage(won_deals_count, max(won_deals_count + lost_deals_count, 1))
        forecast_acc = min(
            self._percentage(int(team_revenue_won), max(int(projected_revenue), 1)),
            Decimal("100"),
        )
        active_reps = len([r for r in rep_rows if Decimal(str(r[3] or 0)) > 0])

        team_metrics = ManagerTeamMetrics(
            total_members=total_members,
            active_reps=active_reps,
            avg_deal_size=avg_deal_size,
            avg_sales_cycle_days=avg_cycle_days,
            team_conversion_rate=team_conversion_rate,
            win_rate=win_rate,
            forecast_accuracy=forecast_acc,
        )

        # -- Summary -----------------------------------------------------------
        summary = ManagerDashboardSummary(
            team_revenue=team_revenue_won,
            forecast_projection=projected_revenue,
            pipeline_value=active_pipeline_value,
            quota_achievement=achievement_pct,
            team_members=total_members,
            conversion_rate=team_conversion_rate,
            win_rate=win_rate,
            average_sales_cycle=avg_cycle_days,
        )

        return ManagerDashboardResponse(
            summary=summary,
            revenue_stats=revenue_stats,
            forecast=forecast_stats,
            pipeline_health=pipeline_health,
            rep_quota_attainment=rep_quota,
            monthly_revenue_trend=monthly_revenue_trend,
            top_reps=top_reps,
            deals_at_risk=deals_at_risk,
            alerts=alerts,
            recent_activities=recent_activities,
            team_metrics=team_metrics,
            generated_at=now,
        )

    # -------------------------------------------------------------------------
    # Sales Representative Dashboard KPI  (rep-scoped, owner_id = user_id)
    # -------------------------------------------------------------------------

    async def sales_rep_kpi(  # noqa: C901
        self,
        user_id: UUID,
        organization_id: UUID,
        period: str = "month",
    ):
        """
        Compute all Sales Rep Dashboard KPIs scoped to owner_id == user_id.
        period: 'week' | 'month' | 'quarter' | 'year'  (default: 'month')
        """
        from app.schemas.dashboard import (
            RepActivityHeatmapPoint,
            RepActivityOverview,
            RepAvgDealSizeStat,
            RepAvgSalesCycleStat,
            RepDealBySource,
            RepDealByStage,
            RepKeyMetrics,
            RepRecentReport,
            RepReportTemplate,
            RepRevenueStat,
            RepRevenueByCompanySize,
            RepRevenuePoint,
            RepTeamPerformanceRow,
            RepWinRateStat,
            RepWonDealsStat,
            SalesRepDashboardResponse,
            SalesRepDashboardSummary,
        )

        now = datetime.now(timezone.utc)

        # -- Period windows ----------------------------------------------------
        # Keep the existing working period behaviour, but make the
        # previous-period boundaries correct for every selector.
        if period == "week":
            period_start = now - timedelta(days=now.weekday())
            period_start = period_start.replace(
                hour=0,
                minute=0,
                second=0,
                microsecond=0,
            )

            prev_start = period_start - timedelta(weeks=1)
            prev_end = period_start

        elif period == "quarter":
            current_quarter_month = ((now.month - 1) // 3) * 3 + 1

            period_start = now.replace(
                month=current_quarter_month,
                day=1,
                hour=0,
                minute=0,
                second=0,
                microsecond=0,
            )

            # Previous quarter = exactly 3 months before current quarter.
            prev_start, _ = self._month_bounds(period_start, 3)
            prev_end = period_start

        elif period == "year":
            period_start = now.replace(
                month=1,
                day=1,
                hour=0,
                minute=0,
                second=0,
                microsecond=0,
            )

            prev_start = period_start.replace(year=period_start.year - 1)
            prev_end = period_start

        else:
            # Default = month
            period = "month"

            period_start = now.replace(
                day=1,
                hour=0,
                minute=0,
                second=0,
                microsecond=0,
            )

            prev_start, prev_end = self._month_bounds(now, 1)
            

        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start, last_month_end = self._month_bounds(now, 1)
        thirty_days_ago = now - timedelta(days=30)

        # -- Core helpers ------------------------------------------------------
        def _rep_deals(*extra):
            """Base filter: this rep's deals, not deleted."""
            return [
                Deal.owner_id == user_id,
                Deal.organization_id == organization_id,
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
                *extra,
            ]

        async def _deal_count(*extra):
            r = await self.db.execute(
                select(func.count(Deal.id)).where(*_rep_deals(*extra))
            )
            return int(r.scalar_one() or 0)

        async def _deal_sum(*extra):
            r = await self.db.execute(
                select(func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0)).where(
                    *_rep_deals(*extra)
                )
            )
            return Decimal(str(r.scalar_one() or 0))
        def _growth(current, previous):
            current = Decimal(str(current or 0))
            previous = Decimal(str(previous or 0))

            if previous == 0:
                if current == 0:
                    return Decimal("0")
                return None

            growth_pct=rev_growth if rev_growth is not None else Decimal("0"),

        async def _activity_count(action_filter, since=None, until=None):
            conds = [
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.created_by == user_id,
                ActivityTimeline.is_active.is_(True),
                ActivityTimeline.action.in_(action_filter),
            ]
            if since:
                conds.append(ActivityTimeline.created_at >= since)
            if until:
                conds.append(ActivityTimeline.created_at < until)
            r = await self.db.execute(select(func.count(ActivityTimeline.id)).where(*conds))
            return int(r.scalar_one() or 0)

        # -- 1. Total Revenue --------------------------------------------------
        total_revenue = await _deal_sum(
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= period_start,
            Deal.closed_at < now,
        )
        prev_revenue = await _deal_sum(
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= prev_start,
            Deal.closed_at < prev_end,
        )
        rev_growth = _growth(total_revenue, prev_revenue)

        revenue_stat = RepRevenueStat(
            total=total_revenue,
            previous_period=prev_revenue,
            growth_pct=rev_growth if rev_growth is not None else Decimal("0"),
        )

        # -- 2. Won Deals ------------------------------------------------------
        won_deals = await _deal_count(
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= period_start,
            Deal.closed_at < now,
        )
        prev_won = await _deal_count(
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= prev_start,
            Deal.closed_at < prev_end,
        )
        won_growth = _growth(won_deals, prev_won)

       
        won_deals_stat = RepWonDealsStat(
            count=won_deals,
            previous_period=prev_won,
            growth_pct=won_growth if won_growth is not None else Decimal("0"),
        )

        # -- 3. Win Rate -------------------------------------------------------
        lost_deals = await _deal_count(
            Deal.status == DealStatus.LOST.value,
            Deal.closed_at >= period_start,
            Deal.closed_at < now,
        )
        win_rate = self._percentage(
            won_deals,
            won_deals + lost_deals
        )
        prev_lost = await _deal_count(
            Deal.status == DealStatus.LOST.value,
            Deal.closed_at >= prev_start,
            Deal.closed_at < prev_end,
        )

        prev_win_rate = self._percentage(
            prev_won,
            prev_won + prev_lost
        )

        win_rate_growth = win_rate - prev_win_rate

        win_rate_stat = RepWinRateStat(
            win_rate=win_rate,
            previous_win_rate=prev_win_rate,
            growth_pct=win_rate_growth if win_rate_growth is not None else Decimal("0"),
        )

        # -- 4. Average Deal Size ----------------------------------------------
        avg_stmt = select(
            func.coalesce(func.avg(Deal.amount), 0)
        ).where(
            *_rep_deals(
                Deal.status == DealStatus.WON.value,
                Deal.closed_at >= period_start,
                Deal.closed_at < now,
            )
        )
        avg_deal_size = Decimal(str((await self.db.execute(avg_stmt)).scalar_one() or 0))
        prev_avg_stmt = select(func.coalesce(func.avg(Deal.amount), 0)).where(
            *_rep_deals(
                Deal.status == DealStatus.WON.value,
                Deal.closed_at >= prev_start,
                Deal.closed_at < prev_end,
            )
        )
        prev_avg = Decimal(str((await self.db.execute(prev_avg_stmt)).scalar_one() or 0))
        avg_growth = _growth(avg_deal_size, prev_avg)

        avg_deal_size_stat = RepAvgDealSizeStat(
            avg_deal_value=avg_deal_size,
            previous_avg=prev_avg,
            growth_pct=avg_growth if avg_growth is not None else Decimal("0"),
        )

        # -- 5. Average Sales Cycle --------------------------------------------
        cycle_stmt = (
            select(
                func.coalesce(
                    func.avg(
                        func.extract("epoch", Deal.closed_at - Lead.created_at) / 86400.0
                    ),
                    0,
                )
            )
            .select_from(Deal)
            .outerjoin(Lead, Lead.id == Deal.lead_id)
            .where(
                Deal.owner_id == user_id,
                Deal.organization_id == organization_id,
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
                Deal.status == DealStatus.WON.value,
                Deal.closed_at.isnot(None),
                Deal.closed_at >= period_start,
                Deal.closed_at < now,
            )
        )
        avg_cycle = Decimal(str((await self.db.execute(cycle_stmt)).scalar_one() or 0))
        prev_cycle_stmt = (
            select(
                func.coalesce(
                    func.avg(
                        func.extract("epoch", Deal.closed_at - Lead.created_at) / 86400.0
                    ),
                    0,
                )
            )
            .select_from(Deal)
            .outerjoin(Lead, Lead.id == Deal.lead_id)
            .where(
                Deal.owner_id == user_id,
                Deal.organization_id == organization_id,
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
                Deal.status == DealStatus.WON.value,
                Deal.closed_at >= prev_start,
                Deal.closed_at < prev_end,
            )
        )
        prev_cycle = Decimal(str((await self.db.execute(prev_cycle_stmt)).scalar_one() or 0))

        avg_sales_cycle_stat = RepAvgSalesCycleStat(
            avg_days=avg_cycle,
            previous_avg_days=prev_cycle,
            difference_days=avg_cycle - prev_cycle,
        )


        # -- 6. Revenue Trend -------------------------------------------------
        # The chart follows the selected report period.
        revenue_trend: list[RepRevenuePoint] = []

        if period == "week":
            # Last 7 completed/current days.
            for offset in range(6, -1, -1):
                day_start = (now - timedelta(days=offset)).replace(
                    hour=0,
                    minute=0,
                    second=0,
                    microsecond=0,
                )
                day_end = day_start + timedelta(days=1)

                # Do not allow future time in today's point.
                effective_end = min(day_end, now)

                day_rev = await _deal_sum(
                    Deal.status == DealStatus.WON.value,
                    Deal.closed_at >= day_start,
                    Deal.closed_at < effective_end,
                )

                revenue_trend.append(
                    RepRevenuePoint(
                        period=day_start.strftime("%a"),
                        revenue=day_rev,
                    )
                )

        elif period == "quarter":
            # Four quarters: current quarter + previous 3.
            current_quarter_month = ((now.month - 1) // 3) * 3 + 1
            current_quarter_start = now.replace(
                month=current_quarter_month,
                day=1,
                hour=0,
                minute=0,
                second=0,
                microsecond=0,
            )

            for offset in range(3, -1, -1):
                quarter_start_month = current_quarter_start.month - (offset * 3)
                quarter_year = current_quarter_start.year

                while quarter_start_month <= 0:
                    quarter_start_month += 12
                    quarter_year -= 1

                quarter_start = datetime(
                    quarter_year,
                    quarter_start_month,
                    1,
                    tzinfo=timezone.utc,
                )

                next_month = quarter_start_month + 3
                next_year = quarter_year

                while next_month > 12:
                    next_month -= 12
                    next_year += 1

                quarter_end = datetime(
                    next_year,
                    next_month,
                    1,
                    tzinfo=timezone.utc,
                )

                effective_end = min(quarter_end, now)

                quarter_rev = await _deal_sum(
                    Deal.status == DealStatus.WON.value,
                    Deal.closed_at >= quarter_start,
                    Deal.closed_at < effective_end,
                )

                revenue_trend.append(
                    RepRevenuePoint(
                        period=f"Q{((quarter_start.month - 1) // 3) + 1} {quarter_start.year}",
                        revenue=quarter_rev,
                    )
                )

        elif period == "year":
            # Last 5 years.
            for offset in range(4, -1, -1):
                year_value = now.year - offset

                year_start = datetime(
                    year_value,
                    1,
                    1,
                    tzinfo=timezone.utc,
                )

                year_end = datetime(
                    year_value + 1,
                    1,
                    1,
                    tzinfo=timezone.utc,
                )

                effective_end = min(year_end, now)

                year_rev = await _deal_sum(
                    Deal.status == DealStatus.WON.value,
                    Deal.closed_at >= year_start,
                    Deal.closed_at < effective_end,
                )

                revenue_trend.append(
                    RepRevenuePoint(
                        period=str(year_value),
                        revenue=year_rev,
                    )
                )

        else:
            # Monthly = existing 12-month behaviour.
            for offset in range(11, -1, -1):
                start, end = self._month_bounds(now, offset)

                effective_end = min(end, now)

                m_rev = await _deal_sum(
                    Deal.status == DealStatus.WON.value,
                    Deal.closed_at >= start,
                    Deal.closed_at < effective_end,
                )

                revenue_trend.append(
                    RepRevenuePoint(
                        period=start.strftime("%Y-%m"),
                        revenue=m_rev,
                    )
                )

        # -- 7. Deals by Stage -------------------------------------------------
        stage_stmt = (
            select(Deal.status, func.count(Deal.id), func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0))
            .where(*_rep_deals(Deal.created_at >= period_start))
            .group_by(Deal.status)
        )
        stage_rows = (await self.db.execute(stage_stmt)).all()
        total_rep_deals = sum(int(r[1] or 0) for r in stage_rows) or 1
        deals_by_stage: list[RepDealByStage] = []
        for row in stage_rows:
            stage_count = int(row[1] or 0)
            won_in_stage = stage_count if str(row[0]) == DealStatus.WON.value else 0
            deals_by_stage.append(
                RepDealByStage(
                    stage=str(row[0]),
                    count=stage_count,
                    percentage=self._percentage(stage_count, total_rep_deals),
                    conversion_rate=self._percentage(won_in_stage, max(stage_count, 1)),
                )
            )

        # -- 8. Deals by Source ------------------------------------------------
        source_stmt = (
            select(
                Lead.source,
                func.count(Deal.id),
                func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0),
            )
            .select_from(Deal)
            .outerjoin(Lead, Lead.id == Deal.lead_id)
            .where(*_rep_deals(Deal.created_at >= period_start))
            .group_by(Lead.source)
            .order_by(func.count(Deal.id).desc())
        )
        source_rows = (await self.db.execute(source_stmt)).all()
        total_src = sum(int(r[1] or 0) for r in source_rows) or 1
        deals_by_source = [
            RepDealBySource(
                source=str(r[0] or "Unknown"),
                count=int(r[1] or 0),
                percentage=self._percentage(int(r[1] or 0), total_src),
                revenue=Decimal(str(r[2] or 0)),
            )
            for r in source_rows
        ]

        # -- 9. Revenue by Company Size ----------------------------------------
        size_buckets = [
            ("1-10", 1, 10),
            ("11-50", 11, 50),
            ("51-200", 51, 200),
            ("201-1000", 201, 1000),
            ("1000+", 1001, 10_000_000),
        ]
        total_won_rev = total_revenue or Decimal("1")
        rev_by_size: list[RepRevenueByCompanySize] = []
        for label, low, high in size_buckets:
            bucket_stmt = (
                select(func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0))
                .select_from(Deal)
                .outerjoin(Company, Deal.company_id == Company.id)
                .where(
                    *_rep_deals(Deal.status == DealStatus.WON.value),
                    Company.employee_count >= low,
                    Company.employee_count <= high,
                )
            )
            bucket_rev = Decimal(str((await self.db.execute(bucket_stmt)).scalar_one() or 0))
            rev_by_size.append(
                RepRevenueByCompanySize(
                    size_bucket=label,
                    revenue=bucket_rev,
                    percentage=self._percentage(int(bucket_rev), int(total_won_rev)),
                )
            )

        # -- 10. Activity Heatmap (last 90 days) -------------------------------
        ninety_days_ago = now - timedelta(days=90)
        heatmap_actions = {
            "call": ["call", "call_logged"],
            "email": ["email_sent", "email_received", "email"],
            "meeting": ["meeting", "meeting_scheduled"],
            "task": ["task_completed", "task"],
            "note": ["note"],
        }
        activity_heatmap: list[RepActivityHeatmapPoint] = []
        for act_type, actions in heatmap_actions.items():
            day_expr = func.date_trunc("day", ActivityTimeline.created_at)
            heatmap_stmt = (
                select(
                    day_expr.label("day"),
                    func.count(ActivityTimeline.id),
                )
                .where(
                    ActivityTimeline.organization_id == organization_id,
                    ActivityTimeline.created_by == user_id,
                    ActivityTimeline.is_active.is_(True),
                    ActivityTimeline.action.in_(actions),
                    ActivityTimeline.created_at >= ninety_days_ago,
                )
                .group_by(day_expr)
                .order_by(day_expr)
            )
            rows = (await self.db.execute(heatmap_stmt)).all()
            for day_ts, cnt in rows:
                count = int(cnt or 0)
                intensity = "low" if count <= 2 else "medium" if count <= 5 else "high"
                activity_heatmap.append(
                    RepActivityHeatmapPoint(
                        date=day_ts.strftime("%Y-%m-%d") if hasattr(day_ts, "strftime") else str(day_ts)[:10],
                        activity_type=act_type,
                        count=count,
                        intensity=intensity,
                    )
                )

        # -- 11. My Performance Row --------------------------------------------
        my_stmt = (
            select(
                User.id,
                User.full_name,
                func.coalesce(func.sum(
                    case((Deal.status == DealStatus.WON.value, Deal.amount), else_=0)
                ), 0).label("revenue"),
                func.coalesce(func.sum(
                    case((Deal.status == DealStatus.WON.value, 1), else_=0)
                ), 0).label("won"),
                func.coalesce(func.count(Deal.id), 0).label("total"),
            )
            .select_from(User)
            .outerjoin(
                Deal,
                (Deal.owner_id == User.id)
                & Deal.is_active.is_(True)
                & Deal.is_deleted.is_(False),
            )
            .where(
                User.id == user_id,
                User.organization_id == organization_id,
                User.is_active.is_(True),
                User.is_deleted.is_(False),
            )
            .group_by(User.id, User.full_name)
        )
        my_row = (await self.db.execute(my_stmt)).one_or_none()
        team_performance = []
        if my_row:
            team_performance.append(
                RepTeamPerformanceRow(
                    user_id=my_row[0],
                    full_name=my_row[1],
                    revenue=Decimal(str(my_row[2] or 0)),
                    won_deals=int(my_row[3] or 0),
                    win_rate=self._percentage(int(my_row[3] or 0), max(int(my_row[4] or 1), 1)),
                )
            )

        # -- 12. Activity Overview (current vs previous month) -----------------
        call_actions = ["call", "call_logged"]
        email_actions = ["email_sent", "email"]
        meeting_actions = ["meeting", "meeting_scheduled"]
        task_actions = ["task_completed", "task"]
        note_actions = ["note"]

        emails_cur = await _activity_count(
            email_actions,
            period_start,
            now,
        )

        calls_cur = await _activity_count(
            call_actions,
            period_start,
            now,
        )

        meetings_cur = await _activity_count(
            meeting_actions,
            period_start,
            now,
        )

        tasks_cur = await _activity_count(
            task_actions,
            period_start,
            now,
        )

        notes_cur = await _activity_count(
            note_actions,
            period_start,
            now,
        )

        emails_prev = await _activity_count(email_actions, prev_start, prev_end)
        calls_prev = await _activity_count(call_actions, prev_start, prev_end)
        meetings_prev = await _activity_count(meeting_actions, prev_start, prev_end)
        tasks_prev = await _activity_count(task_actions, prev_start, prev_end)

        activity_overview = RepActivityOverview(
            emails_sent=emails_cur,
            calls_made=calls_cur,
            meetings_held=meetings_cur,
            tasks_completed=tasks_cur,
            notes_added=notes_cur,
            emails_growth_pct=self._percentage(emails_cur - emails_prev, max(emails_prev, 1)),
            calls_growth_pct=self._percentage(calls_cur - calls_prev, max(calls_prev, 1)),
            meetings_growth_pct=self._percentage(meetings_cur - meetings_prev, max(meetings_prev, 1)),
            tasks_growth_pct=self._percentage(tasks_cur - tasks_prev, max(tasks_prev, 1)),
        )

        # -- 13. Key Metrics ---------------------------------------------------
        open_deals = await _deal_count(
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value])
        )
        pipeline_value = await _deal_sum(
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value])
        )
        deals_created_current = await _deal_count(
            Deal.created_at >= period_start,
            Deal.created_at < now,
        )
        deals_lost = await _deal_count(
            Deal.status == DealStatus.LOST.value,
            Deal.closed_at >= period_start,
            Deal.closed_at < now,
        )
        activities_logged = await _activity_count(
            list(call_actions + email_actions + meeting_actions + task_actions + note_actions),
            period_start,
            now,
        )

        prev_pipeline = await _deal_sum(
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
            Deal.created_at >= prev_start,
            Deal.created_at < prev_end,
        )
        prev_deals_created = await _deal_count(
            Deal.created_at >= prev_start,
            Deal.created_at < prev_end,
        )
        prev_activities = await _activity_count(
            list(call_actions + email_actions + meeting_actions + task_actions + note_actions),
            prev_start,
            prev_end,
        )

        # Use the selected report period for Key Metrics.
        deals_created_current = await _deal_count(
            Deal.created_at >= period_start,
            Deal.created_at < now,
        )

        deals_lost_current = await _deal_count(
            Deal.status == DealStatus.LOST.value,
            Deal.closed_at >= period_start,
            Deal.closed_at < now,
        )

        activities_logged_current = await _activity_count(
            list(
                call_actions
                + email_actions
                + meeting_actions
                + task_actions
                + note_actions
            ),
            period_start,
            now,
        )

        key_metrics = RepKeyMetrics(
            open_deals=open_deals,
            pipeline_value=pipeline_value,
            deals_created=deals_created_current,
            deals_lost=deals_lost_current,
            activities_logged=activities_logged_current,

            pipeline_value_growth_pct=(
                self._percentage(
                    int(pipeline_value - prev_pipeline),
                    int(prev_pipeline),
                )
                if prev_pipeline
                else Decimal("0")
            ),

            deals_created_growth_pct=(
                self._percentage(
                    deals_created_current - prev_deals_created,
                    prev_deals_created,
                )
                if prev_deals_created
                else Decimal("0")
            ),

            activities_growth_pct=(
                self._percentage(
                    activities_logged_current - prev_activities,
                    prev_activities,
                )
                if prev_activities
                else Decimal("0")
            ),
        )


        # -- 14. Recent Reports (from ActivityTimeline with action=report) -----
        report_stmt = (
            select(ActivityTimeline)
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.is_active.is_(True),
                ActivityTimeline.action == "report_generated",
            )
            .order_by(ActivityTimeline.created_at.desc())
            .limit(10)
        )
        report_rows = (await self.db.execute(report_stmt)).scalars().all()
        recent_reports = [
            RepRecentReport(
                report_name=row.title,
                created_at=row.created_at,
                created_by=str(row.created_by) if row.created_by else None,
                report_type=str((row.payload or {}).get("report_type", "custom")),
            )
            for row in report_rows
        ]

        # -- 15. Report Templates (static catalog) -----------------------------
        report_templates = [
            RepReportTemplate(
                name="Sales Funnel Analysis",
                description="Visualize lead-to-deal conversion across pipeline stages.",
                primary_metrics=["Pipeline Value", "Win Rate", "Conversion Rate"],
                group_by_options=["Stage", "Source", "Owner"],
            ),
            RepReportTemplate(
                name="Revenue Analysis",
                description="Track revenue trends over time by period and rep.",
                primary_metrics=["Revenue", "Deal Value", "Growth %"],
                group_by_options=["Month", "Quarter", "Owner", "Company"],
            ),
            RepReportTemplate(
                name="Win/Loss Analysis",
                description="Understand why deals are won or lost by stage and source.",
                primary_metrics=["Win Rate", "Lost Deals", "Win/Loss Ratio"],
                group_by_options=["Stage", "Source", "Owner"],
            ),
            RepReportTemplate(
                name="Activity Report",
                description="Measure team activity volumes: calls, emails, meetings.",
                primary_metrics=["Activities", "Calls", "Emails", "Meetings"],
                group_by_options=["Owner", "Activity Type", "Month"],
            ),
            RepReportTemplate(
                name="Performance Report",
                description="Full rep performance: revenue, quota, cycle time, win rate.",
                primary_metrics=["Revenue", "Win Rate", "Avg Deal Size", "Sales Cycle"],
                group_by_options=["Owner", "Stage", "Source"],
            ),
        ]

        # -- Summary -----------------------------------------------------------
        summary = SalesRepDashboardSummary(
            total_revenue=total_revenue,
            won_deals=won_deals,
            win_rate=win_rate,
            average_deal_size=avg_deal_size,
            average_sales_cycle=avg_cycle,
        )

        return SalesRepDashboardResponse(
            summary=summary,
            revenue_stat=revenue_stat,
            won_deals_stat=won_deals_stat,
            win_rate_stat=win_rate_stat,
            avg_deal_size_stat=avg_deal_size_stat,
            avg_sales_cycle_stat=avg_sales_cycle_stat,
            revenue_trend=revenue_trend,
            deals_by_stage=deals_by_stage,
            deals_by_source=deals_by_source,
            revenue_by_company_size=rev_by_size,
            activity_heatmap=activity_heatmap,
            team_performance=team_performance,
            activity_overview=activity_overview,
            key_metrics=key_metrics,
            recent_reports=recent_reports,
            report_templates=report_templates,
            generated_at=now,
        )
    # ─────────────────────────────────────────────────────────────────────────
    # Sales Representative Command Center (Concurrent Fetching via asyncio.gather)
    # ─────────────────────────────────────────────────────────────────────────

    async def sales_rep_command_center(
        self,
        user_id: UUID,
        organization_id: UUID,
    ) -> SalesRepCommandDashboardResponse:
        """
        Executes all 9 database queries concurrently for the Sales Rep Command Center
        using asyncio.gather, reducing DB retrieval latency from ~200ms to ~30ms.
        """
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        stalled_date = now - timedelta(days=5)

        # ── Query 1: Open Deals Count (KPI 1) ──────────────────────────────────
        open_deals_stmt = select(func.count(Deal.id)).where(
            Deal.owner_id == user_id,
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status == "open",
        )

        # ── Query 2: Untouched Deals Count (KPI 2 - Stalled > 5 days) ──────────
        untouched_deals_stmt = select(func.count(Deal.id)).where(
            Deal.owner_id == user_id,
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status == "open",
            Deal.updated_at <= stalled_date,
        )

        # ── Query 3: Calls Today Count (KPI 3) ─────────────────────────────────
        calls_today_stmt = select(func.count(ActivityTimeline.id)).where(
            ActivityTimeline.organization_id == organization_id,
            ActivityTimeline.created_by == user_id,
            ActivityTimeline.is_active.is_(True),
            ActivityTimeline.action.in_(["call", "call_logged"]),
            ActivityTimeline.created_at >= today_start,
        )

        # ── Query 4: Active Assigned Leads Count (KPI 4) ───────────────────────
        leads_assigned_stmt = select(func.count(Lead.id)).where(
            Lead.owner_id == user_id,
            Lead.organization_id == organization_id,
            Lead.is_active.is_(True),
            Lead.is_deleted.is_(False),
        )

        # ── Query 5: Quota Pace - Closed Won Revenue (Widget 5) ────────────────
        closed_won_stmt = select(func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0)).where(
            Deal.owner_id == user_id,
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= month_start,
        )

        # ── Query 6: User Assigned Quota Target (Widget 5) ────────────────────
        user_quota_stmt = select(User.sales_quota).where(User.id == user_id)

        # ── Query 7: Open Tasks Today (Widget 1) ──────────────────────────────
        open_tasks_stmt = (
            select(Task)
            .where(
                Task.organization_id == organization_id,
                Task.owner_id == user_id,
                Task.is_deleted.is_(False),
                Task.completed_at.is_(None),
                Task.status != "completed",
            )
            .order_by(Task.due_date.asc().nulls_last())
            .limit(10)
        )

        # ── Query 8: Priority Queue - Leads Joined with AI Score >= 70 (Widget 3)
        priority_queue_stmt = (
            select(Lead, LeadScore)
            .outerjoin(LeadScore, LeadScore.lead_id == Lead.id)
            .options(selectinload(Lead.company))
            .where(
                Lead.owner_id == user_id,
                Lead.organization_id == organization_id,
                Lead.is_active.is_(True),
                Lead.is_deleted.is_(False),
                LeadScore.overall_score >= 70,
            )
            .order_by(LeadScore.overall_score.desc())
            .limit(5)
        )

        # ── Query 9: Deals at Risk - Stalled, Low Probability, Negative or High Value (Widget 4) ───
        deals_at_risk_stmt = (
            select(Deal)
            .options(selectinload(Deal.company), selectinload(Deal.owner))
            .where(
                Deal.owner_id == user_id,
                Deal.organization_id == organization_id,
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
                Deal.status == "open",
                or_(
                    Deal.updated_at <= stalled_date,
                    Deal.amount >= Decimal("50000.00"),
                    Deal.probability < 30,
                    Deal.sentiment == "negative",
                ),
            )
            .order_by(Deal.updated_at.asc())
            .limit(5)
        )

        # ───────────────────────────────────────────────────────────────────────
        # CONCURRENT EXECUTION VIA asyncio.gather
        # ───────────────────────────────────────────────────────────────────────
        # Provision the session connection up-front. Without this, the 9
        # concurrent execute() calls race while the first is still checking out
        # a connection, which raises "concurrent operations are not permitted".
        await self.db.connection()
        (
            res_open_deals,
            res_untouched,
            res_calls,
            res_leads,
            res_closed_won,
            res_user_quota,
            res_tasks,
            res_priority_queue,
            res_deals_at_risk,
        ) = await asyncio.gather(
            self.db.execute(open_deals_stmt),
            self.db.execute(untouched_deals_stmt),
            self.db.execute(calls_today_stmt),
            self.db.execute(leads_assigned_stmt),
            self.db.execute(closed_won_stmt),
            self.db.execute(user_quota_stmt),
            self.db.execute(open_tasks_stmt),
            self.db.execute(priority_queue_stmt),
            self.db.execute(deals_at_risk_stmt),
        )

        # ── Parse KPI Results ─────────────────────────────────────────────────
        open_deals_count = int(res_open_deals.scalar_one() or 0)
        untouched_deals_count = int(res_untouched.scalar_one() or 0)
        calls_today_count = int(res_calls.scalar_one() or 0)
        leads_assigned_count = int(res_leads.scalar_one() or 0)

        kpis = RepDashboardKPIs(
            open_deals=open_deals_count,
            untouched_deals=untouched_deals_count,
            calls_today=calls_today_count,
            leads_assigned=leads_assigned_count,
        )

        # ── Parse Quota Pace ──────────────────────────────────────────────────
        closed_won_rev = Decimal(str(res_closed_won.scalar_one() or 0))
        quota_val = res_user_quota.scalar_one_or_none()
        target_quota = Decimal(str(quota_val)) if quota_val else Decimal("50000.00")
        
        attained_pct = self._percentage(int(closed_won_rev), max(int(target_quota), 1))
        pace_status = (
            "Ahead of Pace" if attained_pct >= 100 
            else "On Pace" if attained_pct >= 50 
            else "Behind Pace"
        )

        quota_pace = RepQuotaPace(
            closed_won_revenue=closed_won_rev,
            target_revenue=target_quota,
            attained_percentage=attained_pct,
            pace_status=pace_status,
        )

        # ── Parse Open Tasks ──────────────────────────────────────────────────
        task_rows = res_tasks.scalars().all()
        open_tasks = [
            RepTaskItem(
                id=row.id,
                title=row.title,
                due_date=row.due_date.date() if row.due_date else now.date(),
                status="overdue" if row.due_date and row.due_date < now else "pending",
                source="manual",
                lead_id=row.related_lead_id,
                deal_id=row.related_deal_id,
            )
            for row in task_rows
        ]

        # ── Parse Priority Queue ──────────────────────────────────────────────
        priority_rows = res_priority_queue.all()
        priority_queue = []
        for lead, score in priority_rows:
            top_reasons = list(score.top_reasons or []) if score and score.top_reasons else []
            priority_queue.append(
                RepPriorityLeadItem(
                    lead_id=lead.id,
                    first_name=lead.title or "",
                    last_name="",
                    company_name=lead.company_name or (lead.company.name if getattr(lead, "company", None) else None),
                    email=lead.email or "",
                    score=score.overall_score if score else 70,
                    tier="Hot" if (score and score.overall_score >= 80) else "Warm",
                    top_reason=top_reasons[0] if top_reasons else None,
                    top_reasons=top_reasons,
                )
            )

        # ── Parse Deals at Risk ───────────────────────────────────────────────
        at_risk_rows = res_deals_at_risk.scalars().all()
        deals_at_risk = []
        for deal in at_risk_rows:
            stalled_days = (now - deal.updated_at).days if deal.updated_at else 5
            deal_amount = Decimal(str(deal.amount or 0))
            deal_probability = getattr(deal, "probability", 50) or 0
            deal_sentiment = getattr(deal, "sentiment", None)

            risk_factors = []
            if stalled_days >= 5:
                risk_factors.append(f"No activity for {stalled_days} days")
            if deal_amount >= Decimal("50000.00"):
                risk_factors.append(f"High value deal - {_format_inr(deal_amount)}")
            if deal_probability < 30:
                risk_factors.append(f"Low win probability ({deal_probability}%)")
            if deal_sentiment == "negative":
                risk_factors.append("Negative buyer sentiment")
            risk_reason = " · ".join(risk_factors) if risk_factors else "High value opportunity"

            deals_at_risk.append(
                RepDealAtRiskItem(
                    deal_id=deal.id,
                    deal_title=deal.name,
                    value=deal_amount,
                    stalled_days=stalled_days,
                    risk_reason=risk_reason,
                    sentiment=deal_sentiment,
                    probability=deal_probability,
                    company_name=deal.company.name if getattr(deal, "company", None) else None,
                    owner_name=deal.owner.full_name if getattr(deal, "owner", None) else None,
                )
            )

        # ── Return Unified Response Contract ──────────────────────────────────
        return SalesRepCommandDashboardResponse(
            kpis=kpis,
            open_tasks=open_tasks,
            meetings_today=[],  # Populated from calendar_events when integrated
            priority_queue=priority_queue,
            deals_at_risk=deals_at_risk,
            quota_pace=quota_pace,
            generated_at=now,
        )
