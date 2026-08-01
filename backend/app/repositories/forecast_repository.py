"""
Forecast Repository
Raw SQL aggregation queries for the Sales Manager Forecast module.
All queries are scoped to the caller's organization (multi-tenant).
"""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import case, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.deal import Deal
from app.models.lead import Lead
from app.models.user import User
from app.utils.enums import DealStatus


class ForecastRepository:
    """
    Pure data-access layer for forecast calculations.
    Returns raw scalar / row data — all business logic lives in the service.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── helpers ──────────────────────────────────────────────────────────────

    def _active_open_deals(self, organization_id: UUID):
        """Base filter: deals that are open (not Won / Lost)."""
        return [
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
        ]

    def _active_deals(self, organization_id: UUID):
        """Base filter: all deals (including Won / Lost)."""
        return [
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
        ]

    # ── 1. Expected Revenue ───────────────────────────────────────────────────

    async def get_expected_revenue(self, organization_id: UUID) -> Decimal:
        """
        SUM(amount * probability / 100) for all active open deals.
        """
        stmt = select(
            func.coalesce(
                func.sum(
                    case(
                        (Deal.amount.isnot(None), Deal.amount * (Deal.probability / 100.0)),
                        else_=0,
                    )
                ),
                0,
            )
        ).where(*self._active_open_deals(organization_id))
        result = await self.db.execute(stmt)
        return Decimal(str(result.scalar_one() or 0))

    # ── 2. Best Case Pipeline ─────────────────────────────────────────────────

    async def get_best_case_pipeline(self, organization_id: UUID) -> Decimal:
        """
        SUM(amount) for all active open deals (assuming 100% close rate).
        """
        stmt = select(
            func.coalesce(func.sum(Deal.amount), 0)
        ).where(*self._active_open_deals(organization_id))
        result = await self.db.execute(stmt)
        return Decimal(str(result.scalar_one() or 0))

    # ── 3. Previous Quarter Expected Revenue ──────────────────────────────────

    async def get_prev_quarter_expected_revenue(
        self, organization_id: UUID, prev_q_start: datetime, prev_q_end: datetime
    ) -> Decimal:
        """
        Expected revenue for deals created in the previous quarter window.
        Used for growth % comparison.
        """
        stmt = select(
            func.coalesce(
                func.sum(
                    case(
                        (Deal.amount.isnot(None), Deal.amount * (Deal.probability / 100.0)),
                        else_=0,
                    )
                ),
                0,
            )
        ).where(
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
            Deal.created_at >= prev_q_start,
            Deal.created_at < prev_q_end,
        )
        result = await self.db.execute(stmt)
        return Decimal(str(result.scalar_one() or 0))

    # ── 4. Historical Win Rate ────────────────────────────────────────────────

    async def get_historical_win_rate(self, organization_id: UUID) -> Decimal:
        """
        won_deals / (won_deals + lost_deals) × 100
        """
        stmt = select(
            func.coalesce(
                func.sum(case((Deal.status == DealStatus.WON.value, 1), else_=0)), 0
            ).label("won"),
            func.coalesce(
                func.sum(case((Deal.status == DealStatus.LOST.value, 1), else_=0)), 0
            ).label("lost"),
        ).where(*self._active_deals(organization_id))
        result = await self.db.execute(stmt)
        row = result.one()
        won, lost = int(row[0] or 0), int(row[1] or 0)
        total = won + lost
        if total == 0:
            return Decimal("0")
        return (Decimal(won) * Decimal("100")) / Decimal(total)

    # ── 5. Average Deal Probability ───────────────────────────────────────────

    async def get_avg_deal_probability(self, organization_id: UUID) -> Decimal:
        stmt = select(
            func.coalesce(func.avg(Deal.probability), 0)
        ).where(*self._active_open_deals(organization_id))
        result = await self.db.execute(stmt)
        return Decimal(str(result.scalar_one() or 0))

    # ── 6. Average Deal Age (days, open deals) ────────────────────────────────

    async def get_avg_deal_age_days(self, organization_id: UUID) -> Decimal:
        now = datetime.now(timezone.utc)
        stmt = select(
            func.coalesce(
                func.avg(
                    func.extract("epoch", text(f"'{now.isoformat()}'::timestamptz") - Deal.created_at)
                    / 86400.0
                ),
                0,
            )
        ).where(*self._active_open_deals(organization_id))
        result = await self.db.execute(stmt)
        return Decimal(str(result.scalar_one() or 0))

    # ── 7. Sales Velocity ─────────────────────────────────────────────────────

    async def get_sales_velocity_components(self, organization_id: UUID) -> dict[str, Any]:
        """
        Returns: num_opportunities, avg_deal_size, win_rate, avg_sales_cycle_days
        """
        # Number of open opportunities
        opp_stmt = select(func.count(Deal.id)).where(*self._active_open_deals(organization_id))
        opp_result = await self.db.execute(opp_stmt)
        num_opportunities = int(opp_result.scalar_one() or 0)

        # Average deal size (open deals)
        avg_stmt = select(func.coalesce(func.avg(Deal.amount), 0)).where(
            *self._active_open_deals(organization_id)
        )
        avg_result = await self.db.execute(avg_stmt)
        avg_deal_size = Decimal(str(avg_result.scalar_one() or 0))

        # Win rate
        win_rate = await self.get_historical_win_rate(organization_id)

        # Average sales cycle (days between lead.created_at and deal.closed_at)
        cycle_stmt = (
            select(
                func.coalesce(
                    func.avg(
                        func.extract("epoch", Deal.closed_at - Lead.created_at) / 86400.0
                    ),
                    30,  # fallback: 30 days if no closed deals yet
                )
            )
            .select_from(Deal)
            .outerjoin(Lead, Lead.id == Deal.lead_id)
            .where(
                Deal.organization_id == organization_id,
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
                Deal.status == DealStatus.WON.value,
                Deal.closed_at.isnot(None),
            )
        )
        cycle_result = await self.db.execute(cycle_stmt)
        avg_cycle = Decimal(str(cycle_result.scalar_one() or 30))

        return {
            "num_opportunities": num_opportunities,
            "avg_deal_size": avg_deal_size,
            "win_rate": win_rate,
            "avg_sales_cycle_days": avg_cycle,
        }

    # ── 8. Monthly Breakdown ──────────────────────────────────────────────────

    async def get_monthly_forecast_data(
        self, organization_id: UUID, month_start: datetime, month_end: datetime
    ) -> dict[str, Decimal]:
        """
        For a given month window returns: pipeline_value, expected_revenue, maximum_revenue.
        Deals are bucketed by their expected_close_date falling within the month.
        Falls back to all open deals when no expected_close_date is set.
        """
        # Pipeline: SUM(amount) for open deals closing this month
        pipeline_stmt = select(
            func.coalesce(func.sum(Deal.amount), 0)
        ).where(
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
            Deal.expected_close_date >= month_start.date(),
            Deal.expected_close_date < month_end.date(),
        )
        pipeline_result = await self.db.execute(pipeline_stmt)
        pipeline = Decimal(str(pipeline_result.scalar_one() or 0))

        # Expected: SUM(amount * probability/100)
        expected_stmt = select(
            func.coalesce(
                func.sum(
                    case(
                        (Deal.amount.isnot(None), Deal.amount * (Deal.probability / 100.0)),
                        else_=0,
                    )
                ),
                0,
            )
        ).where(
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
            Deal.expected_close_date >= month_start.date(),
            Deal.expected_close_date < month_end.date(),
        )
        expected_result = await self.db.execute(expected_stmt)
        expected = Decimal(str(expected_result.scalar_one() or 0))

        return {
            "pipeline": pipeline,
            "expected": expected,
            "maximum": pipeline,  # maximum = full pipeline value
        }

    # ── 9. Quarterly Projection ───────────────────────────────────────────────

    async def get_quarterly_won_revenue(
        self, organization_id: UUID, q_start: datetime, q_end: datetime
    ) -> Decimal:
        stmt = select(
            func.coalesce(func.sum(Deal.amount), 0)
        ).where(
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= q_start,
            Deal.closed_at < q_end,
        )
        result = await self.db.execute(stmt)
        return Decimal(str(result.scalar_one() or 0))

    async def get_quarterly_open_pipeline(
        self, organization_id: UUID, q_start: datetime, q_end: datetime
    ) -> Decimal:
        stmt = select(
            func.coalesce(func.sum(Deal.amount), 0)
        ).where(
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
            Deal.expected_close_date >= q_start.date(),
            Deal.expected_close_date < q_end.date(),
        )
        result = await self.db.execute(stmt)
        return Decimal(str(result.scalar_one() or 0))

    # ── 10. Forecast Accuracy ─────────────────────────────────────────────────

    async def get_forecast_accuracy_data(
        self, organization_id: UUID, period_start: datetime, period_end: datetime
    ) -> dict[str, Decimal]:
        """
        Returns forecast_revenue (expected at period start) and
        actual_revenue (won during period).
        """
        # Actual = WON deals closed in period
        actual_stmt = select(
            func.coalesce(func.sum(Deal.amount), 0)
        ).where(
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= period_start,
            Deal.closed_at < period_end,
        )
        actual_result = await self.db.execute(actual_stmt)
        actual = Decimal(str(actual_result.scalar_one() or 0))

        # Forecast = expected revenue from open deals created before period end
        forecast_stmt = select(
            func.coalesce(
                func.sum(
                    case(
                        (Deal.amount.isnot(None), Deal.amount * (Deal.probability / 100.0)),
                        else_=0,
                    )
                ),
                0,
            )
        ).where(
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.created_at >= period_start,
            Deal.created_at < period_end,
        )
        forecast_result = await self.db.execute(forecast_stmt)
        forecast = Decimal(str(forecast_result.scalar_one() or 0))

        return {"actual": actual, "forecast": forecast}

    # ── 11. Average Probability Change ────────────────────────────────────────

    async def get_avg_probability_change(
        self,
        organization_id: UUID,
        current_month_start: datetime,
        last_month_start: datetime,
        last_month_end: datetime,
    ) -> Decimal:
        """
        Compare avg probability of deals created this month vs last month.
        """
        cur_stmt = select(func.coalesce(func.avg(Deal.probability), 0)).where(
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.created_at >= current_month_start,
        )
        prev_stmt = select(func.coalesce(func.avg(Deal.probability), 0)).where(
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.created_at >= last_month_start,
            Deal.created_at < last_month_end,
        )
        cur_result = await self.db.execute(cur_stmt)
        prev_result = await self.db.execute(prev_stmt)
        cur_avg = Decimal(str(cur_result.scalar_one() or 0))
        prev_avg = Decimal(str(prev_result.scalar_one() or 0))
        return cur_avg - prev_avg

    # ── 12. Previous Month Expected Revenue (for insight comparison) ──────────

    async def get_monthly_expected_revenue(
        self, organization_id: UUID, month_start: datetime, month_end: datetime
    ) -> Decimal:
        stmt = select(
            func.coalesce(
                func.sum(
                    case(
                        (Deal.amount.isnot(None), Deal.amount * (Deal.probability / 100.0)),
                        else_=0,
                    )
                ),
                0,
            )
        ).where(
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.created_at >= month_start,
            Deal.created_at < month_end,
        )
        result = await self.db.execute(stmt)
        return Decimal(str(result.scalar_one() or 0))
