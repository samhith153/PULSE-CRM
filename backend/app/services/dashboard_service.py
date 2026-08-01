"""
Dashboard analytics service.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityTimeline
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.email import Email
from app.models.lead import Lead
from app.models.lead_score import LeadScore
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
)
from app.services.pipeline_service import PipelineService
from app.utils.enums import DealStatus


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
                func.coalesce(func.sum(Deal.amount), 0),
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
        stmt = select(func.coalesce(func.sum(Deal.amount), 0)).where(
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
                func.coalesce(func.sum(Deal.amount), 0),
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
                func.coalesce(func.sum(Deal.amount), 0),
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
            .order_by(func.coalesce(func.sum(Deal.amount), 0).desc(), func.count(Deal.id).desc())
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

    # ─────────────────────────────────────────────────────────────────────────
    # Admin Dashboard KPI  (admin-only, cross-org aware)
    # ─────────────────────────────────────────────────────────────────────────

    async def admin_kpi(self, organization_id: UUID):  # noqa: C901
        """
        Compute all Admin Dashboard KPIs scoped to the caller's organization.
        Returns AdminDashboardResponse.
        """
        from app.models.organization import Organization
        from app.schemas.dashboard import (
            AdminCompanyStats,
            AdminContactStats,
            AdminDashboardResponse,
            AdminDashboardSummary,
            AdminLeadFunnelStage,
            AdminLeadSourceBreakdown,
            AdminLeadStats,
            AdminMonthlySalesPoint,
            AdminNotificationSummary,
            AdminOrganizationStats,
            AdminRecentActivity,
            AdminRevenueStats,
            AdminTaskStats,
            AdminTopCompany,
            AdminTopSalesRep,
            AdminUserStats,
        )

        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=now.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
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

        # ── 1. Organizations ─────────────────────────────────────────────────
        total_orgs_stmt = select(func.count(Organization.id)).where(
            Organization.is_active.is_(True),
            Organization.is_deleted.is_(False),
        )
        total_orgs = int((await self.db.execute(total_orgs_stmt)).scalar_one() or 0)

        added_orgs_month = int(
            (
                await self.db.execute(
                    select(func.count(Organization.id)).where(
                        Organization.is_active.is_(True),
                        Organization.is_deleted.is_(False),
                        Organization.created_at >= month_start,
                    )
                )
            ).scalar_one()
            or 0
        )
        prev_orgs_stmt = select(func.count(Organization.id)).where(
            Organization.is_active.is_(True),
            Organization.is_deleted.is_(False),
            Organization.created_at >= last_month_start,
            Organization.created_at < month_start,
        )
        prev_orgs = int((await self.db.execute(prev_orgs_stmt)).scalar_one() or 0)
        org_growth = self._percentage(added_orgs_month - prev_orgs, max(prev_orgs, 1))

        org_stats = AdminOrganizationStats(
            total=total_orgs,
            added_this_month=added_orgs_month,
            monthly_growth_pct=org_growth,
        )

        # ── 2. Users ─────────────────────────────────────────────────────────
        total_users = await _count(User)
        active_users_stmt = select(func.count(User.id)).where(
            User.organization_id == organization_id,
            User.is_active.is_(True),
            User.is_deleted.is_(False),
        )
        active_users = int((await self.db.execute(active_users_stmt)).scalar_one() or 0)
        inactive_users = total_users - active_users
        new_users_month = await _count(User, User.created_at >= month_start)

        user_stats = AdminUserStats(
            total=total_users,
            active=active_users,
            inactive=max(inactive_users, 0),
            new_this_month=new_users_month,
        )

        # ── 3. Companies ─────────────────────────────────────────────────────
        total_companies = await _count(Company)
        new_companies_month = await _count(Company, Company.created_at >= month_start)
        prev_companies = await _count(
            Company,
            Company.created_at >= last_month_start,
            Company.created_at < month_start,
        )
        company_growth = self._percentage(
            new_companies_month - prev_companies, max(prev_companies, 1)
        )

        company_stats = AdminCompanyStats(
            total=total_companies,
            added_this_month=new_companies_month,
            monthly_growth_pct=company_growth,
        )

        # ── 4. Contacts ──────────────────────────────────────────────────────
        total_contacts = await _count(Contact)
        new_contacts_month = await _count(Contact, Contact.created_at >= month_start)
        prev_contacts = await _count(
            Contact,
            Contact.created_at >= last_month_start,
            Contact.created_at < month_start,
        )
        contact_growth = self._percentage(
            new_contacts_month - prev_contacts, max(prev_contacts, 1)
        )

        contact_stats = AdminContactStats(
            total=total_contacts,
            new_this_month=new_contacts_month,
            monthly_growth_pct=contact_growth,
        )

        # ── 5 + 6. Leads ─────────────────────────────────────────────────────
        total_leads = await _count(Lead)
        new_leads_today = await _count(Lead, Lead.created_at >= today_start)
        new_leads_month = await _count(Lead, Lead.created_at >= month_start)
        prev_leads = await _count(
            Lead,
            Lead.created_at >= last_month_start,
            Lead.created_at < month_start,
        )
        lead_growth = self._percentage(
            new_leads_month - prev_leads, max(prev_leads, 1)
        )
        converted_leads = await _count(Lead, Lead.status == DealStatus.WON.value)
        # also count explicit "won" status
        won_leads = await _count(Lead, Lead.status == "won")
        total_converted = max(converted_leads, won_leads)
        conversion_rate = self._percentage(total_converted, max(total_leads, 1))

        lead_stats = AdminLeadStats(
            total=total_leads,
            new_today=new_leads_today,
            new_this_month=new_leads_month,
            monthly_growth_pct=lead_growth,
            converted=total_converted,
            conversion_rate=conversion_rate,
        )

        # ── 7. Revenue ───────────────────────────────────────────────────────
        rev_today = await _sum_amount(
            Deal, Deal.status == DealStatus.WON.value, Deal.closed_at >= today_start
        )
        rev_week = await _sum_amount(
            Deal, Deal.status == DealStatus.WON.value, Deal.closed_at >= week_start
        )
        rev_month = await _sum_amount(
            Deal, Deal.status == DealStatus.WON.value, Deal.closed_at >= month_start
        )
        rev_year = await _sum_amount(
            Deal, Deal.status == DealStatus.WON.value, Deal.closed_at >= year_start
        )
        prev_month_rev = await _sum_amount(
            Deal,
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= last_month_start,
            Deal.closed_at < month_start,
        )
        rev_growth = self._percentage(
            int(rev_month - prev_month_rev), max(int(prev_month_rev), 1)
        )

        revenue_stats = AdminRevenueStats(
            today=rev_today,
            this_week=rev_week,
            this_month=rev_month,
            this_year=rev_year,
            growth_pct=rev_growth,
        )

        # ── 8. Tasks (via ActivityTimeline) ──────────────────────────────────
        # "Tasks" are modelled as activity_timeline_events with action=meeting/call
        # We treat overdue = past meetings, pending = future, due today = today
        pending_tasks = await self._count_rows(
            ActivityTimeline,
            organization_id,
            ActivityTimeline.action.in_(["meeting", "call", "task"]),
            ActivityTimeline.created_at >= now,
        )
        overdue_tasks = await self._count_rows(
            ActivityTimeline,
            organization_id,
            ActivityTimeline.action.in_(["meeting", "call", "task"]),
            ActivityTimeline.created_at < now,
        )
        due_today = await self._count_rows(
            ActivityTimeline,
            organization_id,
            ActivityTimeline.action.in_(["meeting", "call", "task"]),
            ActivityTimeline.created_at >= today_start,
            ActivityTimeline.created_at < today_start + timedelta(days=1),
        )

        task_stats = AdminTaskStats(
            pending=pending_tasks,
            overdue=overdue_tasks,
            due_today=due_today,
        )

        summary = AdminDashboardSummary(
            organizations=org_stats,
            users=user_stats,
            companies=company_stats,
            contacts=contact_stats,
            leads=lead_stats,
            revenue=revenue_stats,
            tasks=task_stats,
        )

        # ── 9. Monthly Sales Analytics (12 months) ───────────────────────────
        monthly_sales: list[AdminMonthlySalesPoint] = []
        for offset in range(11, -1, -1):
            start, end = self._month_bounds(now, offset)
            leads_created_stmt = select(func.count(Lead.id)).where(
                *_base(Lead),
                Lead.created_at >= start,
                Lead.created_at < end,
            )
            leads_converted_stmt = select(func.count(Lead.id)).where(
                *_base(Lead),
                Lead.status == "won",
                Lead.updated_at >= start,
                Lead.updated_at < end,
            )
            rev_stmt = select(func.coalesce(func.sum(Deal.amount), 0)).where(
                *_base(Deal),
                Deal.status == DealStatus.WON.value,
                Deal.closed_at >= start,
                Deal.closed_at < end,
            )
            lc_result = await self.db.execute(leads_created_stmt)
            lconv_result = await self.db.execute(leads_converted_stmt)
            rev_result = await self.db.execute(rev_stmt)
            monthly_sales.append(
                AdminMonthlySalesPoint(
                    month=start.strftime("%Y-%m"),
                    leads_created=int(lc_result.scalar_one() or 0),
                    leads_converted=int(lconv_result.scalar_one() or 0),
                    revenue=Decimal(str(rev_result.scalar_one() or 0)),
                )
            )

        # ── 10. Lead Source Analytics ────────────────────────────────────────
        source_stmt = (
            select(Lead.source, func.count(Lead.id))
            .where(*_base(Lead))
            .group_by(Lead.source)
            .order_by(func.count(Lead.id).desc())
        )
        source_rows = (await self.db.execute(source_stmt)).all()
        total_leads_for_source = sum(r[1] for r in source_rows) or 1
        lead_sources = [
            AdminLeadSourceBreakdown(
                source=str(r[0] or "unknown"),
                count=int(r[1]),
                percentage=self._percentage(int(r[1]), total_leads_for_source),
            )
            for r in source_rows
        ]

        # ── 11. Lead Funnel ──────────────────────────────────────────────────
        funnel_stages = [
            "new", "contacted", "qualified",
            "proposal_sent", "negotiation", "won", "lost",
        ]
        funnel_stmt = (
            select(Lead.status, func.count(Lead.id))
            .where(*_base(Lead))
            .group_by(Lead.status)
        )
        funnel_rows = dict((await self.db.execute(funnel_stmt)).all())
        total_funnel = sum(funnel_rows.values()) or 1
        lead_funnel = [
            AdminLeadFunnelStage(
                stage=stage,
                count=int(funnel_rows.get(stage, 0)),
                percentage=self._percentage(
                    int(funnel_rows.get(stage, 0)), total_funnel
                ),
            )
            for stage in funnel_stages
        ]

        # ── 12. Top 5 Sales Representatives ─────────────────────────────────
        won_expr = func.sum(
            case((Deal.status == DealStatus.WON.value, 1), else_=0)
        )
        total_deals_expr = func.count(Deal.id)
        top_reps_stmt = (
            select(
                User.id,
                User.full_name,
                func.coalesce(total_deals_expr, 0),
                func.coalesce(func.sum(Deal.amount), Decimal("0")),
                func.coalesce(won_expr, 0),
            )
            .select_from(User)
            .outerjoin(Deal, (Deal.owner_id == User.id) & Deal.is_active.is_(True) & Deal.is_deleted.is_(False))
            .where(
                User.organization_id == organization_id,
                User.is_active.is_(True),
                User.is_deleted.is_(False),
            )
            .group_by(User.id, User.full_name)
            .order_by(func.coalesce(func.sum(Deal.amount), 0).desc())
            .limit(5)
        )
        top_reps_rows = (await self.db.execute(top_reps_stmt)).all()
        top_sales_reps = [
            AdminTopSalesRep(
                user_id=row[0],
                full_name=row[1],
                deals_closed=int(row[4] or 0),
                revenue=Decimal(str(row[3] or 0)),
                conversion_rate=self._percentage(int(row[4] or 0), max(int(row[2] or 1), 1)),
            )
            for row in top_reps_rows
        ]

        # ── 13. Top 5 Companies ──────────────────────────────────────────────
        top_companies_stmt = (
            select(
                Company.id,
                Company.name,
                func.coalesce(func.sum(Deal.amount), 0),
                func.count(Lead.id.distinct()),
                func.count(Contact.id.distinct()),
            )
            .select_from(Company)
            .outerjoin(
                Deal,
                (Deal.company_id == Company.id)
                & Deal.is_active.is_(True)
                & Deal.is_deleted.is_(False)
                & (Deal.status == DealStatus.WON.value),
            )
            .outerjoin(
                Lead,
                (Lead.company_id == Company.id)
                & Lead.is_active.is_(True)
                & Lead.is_deleted.is_(False),
            )
            .outerjoin(
                Contact,
                (Contact.company_id == Company.id)
                & Contact.is_active.is_(True)
                & Contact.is_deleted.is_(False),
            )
            .where(
                Company.organization_id == organization_id,
                Company.is_active.is_(True),
                Company.is_deleted.is_(False),
            )
            .group_by(Company.id, Company.name)
            .order_by(func.coalesce(func.sum(Deal.amount), 0).desc())
            .limit(5)
        )
        top_companies_rows = (await self.db.execute(top_companies_stmt)).all()
        top_companies = [
            AdminTopCompany(
                company_id=row[0],
                name=row[1],
                revenue=Decimal(str(row[2] or 0)),
                lead_count=int(row[3] or 0),
                contact_count=int(row[4] or 0),
            )
            for row in top_companies_rows
        ]

        # ── 14. Recent Activities (latest 20) ────────────────────────────────
        recent_stmt = (
            select(ActivityTimeline)
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.is_active.is_(True),
            )
            .order_by(ActivityTimeline.created_at.desc())
            .limit(20)
        )
        recent_rows = (await self.db.execute(recent_stmt)).scalars().all()
        recent_activities = [
            AdminRecentActivity(
                id=row.id,
                action=row.action,
                title=row.title,
                entity_type=row.entity_type,
                created_at=row.created_at,
                created_by=row.created_by,
            )
            for row in recent_rows
        ]

        # ── 15. Notifications Summary ────────────────────────────────────────
        high_priority_leads_stmt = (
            select(func.count(Lead.id))
            .outerjoin(LeadScore, LeadScore.lead_id == Lead.id)
            .where(*_base(Lead), LeadScore.overall_score >= 70)
        )
        high_priority_leads = int((await self.db.execute(high_priority_leads_stmt)).scalar_one() or 0)

        notifications = AdminNotificationSummary(
            overdue_tasks=overdue_tasks,
            todays_meetings=due_today,
            pending_approvals=0,          # no approval workflow yet
            high_priority_leads=high_priority_leads,
            system_alerts=0,              # no system-alert model yet
        )

        return AdminDashboardResponse(
            summary=summary,
            monthly_sales=monthly_sales,
            lead_sources=lead_sources,
            lead_funnel=lead_funnel,
            top_sales_reps=top_sales_reps,
            top_companies=top_companies,
            recent_activities=recent_activities,
            notifications=notifications,
            generated_at=now,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Manager Dashboard KPI  (manager-scoped, org-tenanted)
    # ─────────────────────────────────────────────────────────────────────────

    async def manager_kpi(self, manager_id: UUID, organization_id: UUID):  # noqa: C901
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

        # ── helpers ──────────────────────────────────────────────────────────
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
            """Return a subquery condition that excludes users with the 'admin' role."""
            admin_role_subq = (
                select(UserRole.user_id)
                .join(Role, Role.id == UserRole.role_id)
                .where(Role.name == "admin")
                .correlate(User)
                .exists()
            )
            return ~admin_role_subq

        async def _deal_count(*extra):
            r = await self.db.execute(
                select(func.count(Deal.id)).where(*_deal_base(*extra))
            )
            return int(r.scalar_one() or 0)

        async def _deal_sum(*extra):
            r = await self.db.execute(
                select(func.coalesce(func.sum(Deal.amount), 0)).where(*_deal_base(*extra))
            )
            return Decimal(str(r.scalar_one() or 0))

        # ── Team members (sales reps + managers, no admins) ──────────────────
        team_stmt = (
            select(User.id, User.full_name)
            .where(*_user_base(), _non_admin_user_filter())
        )
        team_rows = (await self.db.execute(team_stmt)).all()
        team_member_ids = [r[0] for r in team_rows]
        total_members = len(team_member_ids)

        # ── 1. Team Revenue Won ───────────────────────────────────────────────
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

        # ── 2. Forecast Projection ────────────────────────────────────────────
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

        # ── 3. Pipeline Health ────────────────────────────────────────────────
        active_pipeline_value = await _deal_sum(
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value])
        )
        total_active_deals = await _deal_count(
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value])
        )

        stage_stmt = (
            select(Deal.status, func.count(Deal.id), func.coalesce(func.sum(Deal.amount), 0))
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

        # ── 4. Rep Quota Attainment ───────────────────────────────────────────
        rep_revenue_stmt = (
            select(
                User.id,
                User.full_name,
                func.coalesce(func.sum(Deal.amount), 0),
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

        # ── 5. Already in stage_distribution (pipeline health) ───────────────

        # ── 6. Monthly Revenue Trend (12 months) ─────────────────────────────
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

        # ── 7. Top 5 Performing Reps ─────────────────────────────────────────
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

        # ── 8. Deals At Risk ──────────────────────────────────────────────────
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
                reasons.append(f"High-value deal (≥{risk_threshold:,.0f})")

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

        # ── 9. Manager Alerts ─────────────────────────────────────────────────
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
                    message=f"🎉 Team revenue target achieved! {team_revenue_won:,.2f} of {team_target:,.2f}.",
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

        # ── 10. Recent Team Activity (latest 30) ──────────────────────────────
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

        # ── 11. Team Performance Metrics ──────────────────────────────────────
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

        # ── Summary ───────────────────────────────────────────────────────────
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

    # ─────────────────────────────────────────────────────────────────────────
    # Sales Representative Dashboard KPI  (rep-scoped, owner_id = user_id)
    # ─────────────────────────────────────────────────────────────────────────

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

        # ── Period windows ────────────────────────────────────────────────────
        if period == "week":
            period_start = now - timedelta(days=now.weekday())
            period_start = period_start.replace(hour=0, minute=0, second=0, microsecond=0)
            prev_start = period_start - timedelta(weeks=1)
            prev_end = period_start
        elif period == "quarter":
            qm = ((now.month - 1) // 3) * 3 + 1
            period_start = now.replace(month=qm, day=1, hour=0, minute=0, second=0, microsecond=0)
            prev_start, prev_end = self._month_bounds(now, 3)
        elif period == "year":
            period_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            prev_start = period_start.replace(year=period_start.year - 1)
            prev_end = period_start
        else:  # month (default)
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            prev_start, prev_end = self._month_bounds(now, 1)

        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start, last_month_end = self._month_bounds(now, 1)
        thirty_days_ago = now - timedelta(days=30)

        # ── Core helpers ──────────────────────────────────────────────────────
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
                select(func.coalesce(func.sum(Deal.amount), 0)).where(
                    *_rep_deals(*extra)
                )
            )
            return Decimal(str(r.scalar_one() or 0))

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

        # ── 1. Total Revenue ──────────────────────────────────────────────────
        total_revenue = await _deal_sum(Deal.status == DealStatus.WON.value)
        prev_revenue = await _deal_sum(
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= prev_start,
            Deal.closed_at < prev_end,
        )
        rev_growth = self._percentage(int(total_revenue - prev_revenue), max(int(prev_revenue), 1))

        revenue_stat = RepRevenueStat(
            total=total_revenue,
            previous_period=prev_revenue,
            growth_pct=rev_growth,
        )

        # ── 2. Won Deals ──────────────────────────────────────────────────────
        won_deals = await _deal_count(Deal.status == DealStatus.WON.value)
        prev_won = await _deal_count(
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= prev_start,
            Deal.closed_at < prev_end,
        )
        won_growth = self._percentage(won_deals - prev_won, max(prev_won, 1))

        won_deals_stat = RepWonDealsStat(
            count=won_deals,
            previous_period=prev_won,
            growth_pct=won_growth,
        )

        # ── 3. Win Rate ───────────────────────────────────────────────────────
        lost_deals = await _deal_count(Deal.status == DealStatus.LOST.value)
        win_rate = self._percentage(won_deals, max(won_deals + lost_deals, 1))
        prev_lost = await _deal_count(
            Deal.status == DealStatus.LOST.value,
            Deal.closed_at >= prev_start,
            Deal.closed_at < prev_end,
        )
        prev_win_rate = self._percentage(prev_won, max(prev_won + prev_lost, 1))
        win_rate_growth = win_rate - prev_win_rate

        win_rate_stat = RepWinRateStat(
            win_rate=win_rate,
            previous_win_rate=prev_win_rate,
            growth_pct=win_rate_growth,
        )

        # ── 4. Average Deal Size ──────────────────────────────────────────────
        avg_stmt = select(func.coalesce(func.avg(Deal.amount), 0)).where(
            *_rep_deals(Deal.status == DealStatus.WON.value)
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
        avg_growth = self._percentage(int(avg_deal_size - prev_avg), max(int(prev_avg), 1))

        avg_deal_size_stat = RepAvgDealSizeStat(
            avg_deal_value=avg_deal_size,
            previous_avg=prev_avg,
            growth_pct=avg_growth,
        )

        # ── 5. Average Sales Cycle ────────────────────────────────────────────
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

        # ── 6. Revenue Over Time (12 months) ──────────────────────────────────
        revenue_trend: list[RepRevenuePoint] = []
        for offset in range(11, -1, -1):
            start, end = self._month_bounds(now, offset)
            m_rev = await _deal_sum(
                Deal.status == DealStatus.WON.value,
                Deal.closed_at >= start,
                Deal.closed_at < end,
            )
            revenue_trend.append(RepRevenuePoint(period=start.strftime("%Y-%m"), revenue=m_rev))

        # ── 7. Deals by Stage ─────────────────────────────────────────────────
        stage_stmt = (
            select(Deal.status, func.count(Deal.id), func.coalesce(func.sum(Deal.amount), 0))
            .where(*_rep_deals())
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

        # ── 8. Deals by Source ────────────────────────────────────────────────
        source_stmt = (
            select(
                Lead.source,
                func.count(Deal.id),
                func.coalesce(func.sum(Deal.amount), 0),
            )
            .select_from(Deal)
            .outerjoin(Lead, Lead.id == Deal.lead_id)
            .where(*_rep_deals())
            .group_by(Lead.source)
            .order_by(func.count(Deal.id).desc())
        )
        source_rows = (await self.db.execute(source_stmt)).all()
        total_src = sum(int(r[1] or 0) for r in source_rows) or 1
        deals_by_source = [
            RepDealBySource(
                source=str(r[0] or "unknown"),
                count=int(r[1] or 0),
                percentage=self._percentage(int(r[1] or 0), total_src),
                revenue=Decimal(str(r[2] or 0)),
            )
            for r in source_rows
        ]

        # ── 9. Revenue by Company Size ────────────────────────────────────────
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
                select(func.coalesce(func.sum(Deal.amount), 0))
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

        # ── 10. Activity Heatmap (last 90 days) ───────────────────────────────
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

        # ── 11. My Performance Row ────────────────────────────────────────────
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

        # ── 12. Activity Overview (current vs previous month) ─────────────────
        call_actions = ["call", "call_logged"]
        email_actions = ["email_sent", "email"]
        meeting_actions = ["meeting", "meeting_scheduled"]
        task_actions = ["task_completed", "task"]
        note_actions = ["note"]

        emails_cur = await _activity_count(email_actions, month_start)
        calls_cur = await _activity_count(call_actions, month_start)
        meetings_cur = await _activity_count(meeting_actions, month_start)
        tasks_cur = await _activity_count(task_actions, month_start)
        notes_cur = await _activity_count(note_actions, month_start)

        emails_prev = await _activity_count(email_actions, last_month_start, last_month_end)
        calls_prev = await _activity_count(call_actions, last_month_start, last_month_end)
        meetings_prev = await _activity_count(meeting_actions, last_month_start, last_month_end)
        tasks_prev = await _activity_count(task_actions, last_month_start, last_month_end)

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

        # ── 13. Key Metrics ───────────────────────────────────────────────────
        open_deals = await _deal_count(
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value])
        )
        pipeline_value = await _deal_sum(
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value])
        )
        deals_created_this_month = await _deal_count(Deal.created_at >= month_start)
        deals_lost = await _deal_count(Deal.status == DealStatus.LOST.value)
        activities_logged = await _activity_count(
            list(call_actions + email_actions + meeting_actions + task_actions + note_actions),
            month_start,
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

        key_metrics = RepKeyMetrics(
            open_deals=open_deals,
            pipeline_value=pipeline_value,
            deals_created=deals_created_this_month,
            deals_lost=deals_lost,
            activities_logged=activities_logged,
            pipeline_value_growth_pct=self._percentage(
                int(pipeline_value - prev_pipeline), max(int(prev_pipeline), 1)
            ),
            deals_created_growth_pct=self._percentage(
                deals_created_this_month - prev_deals_created, max(prev_deals_created, 1)
            ),
            activities_growth_pct=self._percentage(
                activities_logged - prev_activities, max(prev_activities, 1)
            ),
        )

        # ── 14. Recent Reports (from ActivityTimeline with action=report) ─────
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

        # ── 15. Report Templates (static catalog) ─────────────────────────────
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

        # ── Summary ───────────────────────────────────────────────────────────
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
