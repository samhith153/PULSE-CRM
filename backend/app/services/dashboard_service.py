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
from app.models.user import User
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
