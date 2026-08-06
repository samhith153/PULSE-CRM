"""
Forecast Service
All business logic for the Sales Manager Forecast module.
Consumes ForecastRepository (data) and produces ManagerForecastResponse (schema).
"""
from __future__ import annotations

import math
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.forecast_repository import ForecastRepository
from app.schemas.forecast import (
    BestCasePipelineStats,
    ConfidenceScore,
    ExpectedRevenueStats,
    ForecastAccuracyStats,
    ForecastInsight,
    ForecastRecommendation,
    ForecastRisk,
    ForecastTrendPoint,
    ManagerForecastResponse,
    MonthlyForecastPoint,
    PipelineCoverageStats,
    QuarterlyProjectionRow,
    SalesVelocityStats,
)


# Heuristic annual quota per organisation (configurable / can be stored in DB later)
_DEFAULT_QUARTER_QUOTA = Decimal("3_000_000")


class ForecastService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ForecastRepository(db)

    # ── Public entry point ────────────────────────────────────────────────────

    async def get_forecast(
        self,
        organization_id: UUID,
        period: str = "monthly",
    ) -> ManagerForecastResponse:
        """
        Compute all forecast KPIs and return a fully-populated ManagerForecastResponse.
        period: "monthly" | "quarterly" | "yearly"
        """
        now = datetime.now(timezone.utc)

        # Quarter metadata
        quarter_num = math.ceil(now.month / 3)
        quarter_label = f"Q{quarter_num} {now.year}"
        quarter_month = (quarter_num - 1) * 3 + 1
        q_start = now.replace(month=quarter_month, day=1, hour=0, minute=0, second=0, microsecond=0)
        if quarter_month + 3 > 12:
            q_end = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            q_end = now.replace(month=quarter_month + 3, day=1, hour=0, minute=0, second=0, microsecond=0)

        # Previous quarter
        prev_q_start, prev_q_end = self._prev_quarter_bounds(now)

        # Month helpers
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start, last_month_end = self._month_bounds(now, 1)

        # ── Gather raw data (parallel-friendly but kept sequential for clarity) ──

        expected_revenue = await self.repo.get_expected_revenue(organization_id)
        best_case = await self.repo.get_best_case_pipeline(organization_id)
        prev_forecast = await self.repo.get_prev_quarter_expected_revenue(
            organization_id, prev_q_start, prev_q_end
        )
        historical_win_rate = await self.repo.get_historical_win_rate(organization_id)
        avg_probability = await self.repo.get_avg_deal_probability(organization_id)
        velocity_data = await self.repo.get_sales_velocity_components(organization_id)
        avg_cycle = velocity_data["avg_sales_cycle_days"]

        # ── 1. Expected Revenue ───────────────────────────────────────────────
        quarter_target = _DEFAULT_QUARTER_QUOTA
        growth_pct = self._pct_change(expected_revenue, prev_forecast)
        target_achievement_pct = self._percentage(expected_revenue, quarter_target)

        expected_revenue_stats = ExpectedRevenueStats(
            expected_revenue=expected_revenue,
            quarter=quarter_label,
            previous_forecast=prev_forecast,
            growth_pct=growth_pct,
            target_achievement_pct=target_achievement_pct,
        )

        # ── 2. Best Case Pipeline ─────────────────────────────────────────────
        best_case_stats = BestCasePipelineStats(
            best_case_pipeline=best_case,
            active_pipeline_value=best_case,
            difference_from_expected=best_case - expected_revenue,
        )

        # ── 3. Pipeline Coverage ──────────────────────────────────────────────
        coverage_ratio = (
            (best_case / quarter_target).quantize(Decimal("0.01"))
            if quarter_target > 0
            else Decimal("0")
        )
        coverage_status = self._coverage_status(coverage_ratio)

        coverage_stats = PipelineCoverageStats(
            coverage_ratio=coverage_ratio,
            coverage_status=coverage_status,
        )

        # ── 4. AI Confidence Score ────────────────────────────────────────────
        confidence = self._compute_confidence_score(
            historical_win_rate=historical_win_rate,
            avg_probability=avg_probability,
            coverage_ratio=coverage_ratio,
            avg_deal_age_days=velocity_data.get("avg_deal_age_days", Decimal("30")),
            sales_velocity=self._calc_velocity(velocity_data),
        )

        # ── 5. Monthly Forecast Breakdown (6 months) ──────────────────────────
        monthly_forecast = await self._build_monthly_forecast(organization_id, now)

        # ── 6. Quarterly Projection Matrix (4 quarters) ───────────────────────
        quarterly_projection = await self._build_quarterly_projection(organization_id, now)

        # ── 7. Forecast Trend ─────────────────────────────────────────────────
        forecast_trend = await self._build_forecast_trend(organization_id, now, period)

        # ── 8. Forecast Accuracy (current vs previous month) ──────────────────
        cur_accuracy_data = await self.repo.get_forecast_accuracy_data(
            organization_id, month_start, now
        )
        prev_accuracy_data = await self.repo.get_forecast_accuracy_data(
            organization_id, last_month_start, last_month_end
        )

        cur_accuracy = self._percentage(
            cur_accuracy_data["actual"], max(cur_accuracy_data["forecast"], Decimal("1"))
        )
        prev_accuracy = self._percentage(
            prev_accuracy_data["actual"], max(prev_accuracy_data["forecast"], Decimal("1"))
        )
        accuracy_stats = ForecastAccuracyStats(
            current_accuracy_pct=min(cur_accuracy, Decimal("100")),
            previous_accuracy_pct=min(prev_accuracy, Decimal("100")),
            difference_pct=cur_accuracy - prev_accuracy,
        )

        # ── 9. Sales Velocity ─────────────────────────────────────────────────
        cur_velocity = self._calc_velocity(velocity_data)

        # Previous velocity: use last-month expected revenue as surrogate
        prev_expected = await self.repo.get_monthly_expected_revenue(
            organization_id, last_month_start, last_month_end
        )
        prev_velocity = prev_expected / max(avg_cycle, Decimal("1"))
        velocity_growth = self._pct_change(cur_velocity, prev_velocity)

        velocity_stats = SalesVelocityStats(
            sales_velocity=cur_velocity.quantize(Decimal("0.01")),
            previous_velocity=prev_velocity.quantize(Decimal("0.01")),
            growth_pct=velocity_growth,
        )

        # ── 10. Forecast Insights ─────────────────────────────────────────────
        prob_change = await self.repo.get_avg_probability_change(
            organization_id, month_start, last_month_start, last_month_end
        )
        prev_monthly_expected = await self.repo.get_monthly_expected_revenue(
            organization_id, last_month_start, last_month_end
        )
        cur_monthly_expected = await self.repo.get_monthly_expected_revenue(
            organization_id, month_start, now
        )

        insights = self._generate_insights(
            expected_revenue=expected_revenue,
            quarter_target=quarter_target,
            target_achievement_pct=target_achievement_pct,
            coverage_ratio=coverage_ratio,
            coverage_status=coverage_status,
            prob_change=prob_change,
            cur_monthly_expected=cur_monthly_expected,
            prev_monthly_expected=prev_monthly_expected,
            historical_win_rate=historical_win_rate,
            confidence=confidence,
        )

        # ── 11. Forecast Risks ────────────────────────────────────────────────
        raw_risks = await self.repo.get_forecast_risks(organization_id)
        forecast_risks = self._build_forecast_risks(raw_risks)

        # ── 12. Forecast Recommendations ─────────────────────────────────────
        forecast_recommendations = self._generate_recommendations(
            expected_revenue=expected_revenue,
            quarter_target=quarter_target,
            target_achievement_pct=target_achievement_pct,
            coverage_ratio=coverage_ratio,
            raw_risks=raw_risks,
            historical_win_rate=historical_win_rate,
            avg_probability=avg_probability,
        )

        return ManagerForecastResponse(
            expected_revenue=expected_revenue_stats,
            best_case_pipeline=best_case_stats,
            pipeline_coverage=coverage_stats,
            confidence_score=confidence,
            monthly_forecast=monthly_forecast,
            quarterly_projection=quarterly_projection,
            forecast_trend=forecast_trend,
            forecast_accuracy=accuracy_stats,
            sales_velocity=velocity_stats,
            forecast_insights=insights,
            forecast_risks=forecast_risks,
            forecast_recommendations=forecast_recommendations,
            quarter=quarter_label,
            period=period,
            generated_at=now,
        )

    # ── Monthly Breakdown ─────────────────────────────────────────────────────

    async def _build_monthly_forecast(
        self, organization_id: UUID, now: datetime
    ) -> list[MonthlyForecastPoint]:
        points: list[MonthlyForecastPoint] = []
        for offset in range(5, -1, -1):
            start, end = self._month_bounds(now, offset)
            data = await self.repo.get_monthly_forecast_data(organization_id, start, end)
            points.append(
                MonthlyForecastPoint(
                    month=start.strftime("%b"),
                    pipeline=data["pipeline"],
                    expected=data["expected"],
                    maximum=data["maximum"],
                )
            )
        return points

    # ── Quarterly Projection ──────────────────────────────────────────────────

    async def _build_quarterly_projection(
        self, organization_id: UUID, now: datetime
    ) -> list[QuarterlyProjectionRow]:
        rows: list[QuarterlyProjectionRow] = []
        current_quarter = math.ceil(now.month / 3)

        for q in range(1, 5):
            q_month = (q - 1) * 3 + 1
            q_start = now.replace(year=now.year, month=q_month, day=1, hour=0, minute=0, second=0, microsecond=0)
            q_end_month = q_month + 3
            q_end_year = now.year
            if q_end_month > 12:
                q_end_month -= 12
                q_end_year += 1
            q_end = q_start.replace(year=q_end_year, month=q_end_month, day=1)

            # Won revenue closed in this quarter
            won_rev = await self.repo.get_quarterly_won_revenue(organization_id, q_start, q_end)

            # Open pipeline (all active open deals whose effective date is in this quarter)
            open_pipe = await self.repo.get_quarterly_open_pipeline(organization_id, q_start, q_end)

            # Expected revenue from open deals (weighted by probability)
            expected_open = await self.repo.get_quarterly_expected_revenue(organization_id, q_start, q_end)

            # For past/current quarters: expected = won + weighted open
            # For future quarters: expected = weighted open only (nothing closed yet)
            expected_closed = won_rev + expected_open
            best_close = won_rev + open_pipe
            achievement_pct = self._percentage(expected_closed, _DEFAULT_QUARTER_QUOTA)

            rows.append(
                QuarterlyProjectionRow(
                    quarter=f"Q{q} {now.year}",
                    quota_target=_DEFAULT_QUARTER_QUOTA,
                    expected_closed_revenue=expected_closed,
                    best_case_close=best_close,
                    open_pipeline=open_pipe,
                    target_achievement_pct=achievement_pct,
                )
            )
        return rows

    # ── Forecast Trend ────────────────────────────────────────────────────────

    async def _build_forecast_trend(
        self, organization_id: UUID, now: datetime, period: str
    ) -> list[ForecastTrendPoint]:
        points: list[ForecastTrendPoint] = []

        if period == "yearly":
            # 4 quarters of this year
            for q in range(1, 5):
                q_month = (q - 1) * 3 + 1
                q_start = now.replace(month=q_month, day=1, hour=0, minute=0, second=0, microsecond=0)
                q_end_month = q_month + 3
                q_end_year = now.year
                if q_end_month > 12:
                    q_end_month -= 12
                    q_end_year += 1
                q_end = q_start.replace(year=q_end_year, month=q_end_month, day=1)
                data = await self.repo.get_monthly_forecast_data(organization_id, q_start, q_end)
                points.append(ForecastTrendPoint(month=f"Q{q} {now.year}", forecast=data["expected"]))
        elif period == "quarterly":
            # 3 months of current quarter
            quarter_num = math.ceil(now.month / 3)
            for m_offset in range(3):
                q_month = (quarter_num - 1) * 3 + 1 + m_offset
                if q_month > 12:
                    break
                start = now.replace(month=q_month, day=1, hour=0, minute=0, second=0, microsecond=0)
                end_month = q_month + 1 if q_month < 12 else 1
                end_year = now.year if q_month < 12 else now.year + 1
                end = start.replace(year=end_year, month=end_month, day=1)
                data = await self.repo.get_monthly_forecast_data(organization_id, start, end)
                points.append(ForecastTrendPoint(month=start.strftime("%b"), forecast=data["expected"]))
        else:
            # Monthly: last 6 months
            for offset in range(5, -1, -1):
                start, end = self._month_bounds(now, offset)
                data = await self.repo.get_monthly_forecast_data(organization_id, start, end)
                points.append(ForecastTrendPoint(month=start.strftime("%b %Y"), forecast=data["expected"]))

        return points

    # ── Confidence Score ──────────────────────────────────────────────────────

    def _compute_confidence_score(
        self,
        historical_win_rate: Decimal,
        avg_probability: Decimal,
        coverage_ratio: Decimal,
        avg_deal_age_days: Decimal,
        sales_velocity: Decimal,
    ) -> ConfidenceScore:
        """
        Weighted score:
          Historical Win Rate   40%
          Avg Probability       25%
          Pipeline Coverage     15%
          Deal Age (inverse)    10%
          Sales Velocity        10%
        """
        # Normalise each component to 0–100
        win_rate_norm = float(min(historical_win_rate, Decimal("100")))

        prob_norm = float(min(avg_probability, Decimal("100")))

        # Coverage: cap at 3x = 100 points
        coverage_norm = float(min((coverage_ratio / Decimal("3")) * 100, Decimal("100")))

        # Deal age: fresh deals (< 30 days) = high score; > 180 days = 0
        max_age = 180.0
        age_float = float(avg_deal_age_days)
        age_norm = max(0.0, (1.0 - age_float / max_age) * 100)

        # Velocity: normalise against 50k/day as "excellent"
        vel_float = float(sales_velocity)
        velocity_norm = min(vel_float / 50_000.0 * 100, 100.0) if vel_float > 0 else 0.0

        score = (
            win_rate_norm * 0.40
            + prob_norm * 0.25
            + coverage_norm * 0.15
            + age_norm * 0.10
            + velocity_norm * 0.10
        )
        score_int = int(round(score))

        if score_int >= 90:
            status = "Very High"
            description = (
                "Very high confidence based on exceptional win rate and strong pipeline coverage."
            )
        elif score_int >= 75:
            status = "High"
            description = (
                "High confidence ranking based on historical conversion rates and healthy pipeline."
            )
        elif score_int >= 60:
            status = "Medium"
            description = (
                "Moderate confidence. Pipeline coverage and deal probability could be improved."
            )
        else:
            status = "Low"
            description = (
                "Low confidence. Win rate and pipeline health need attention to improve forecast accuracy."
            )

        return ConfidenceScore(score=score_int, status=status, description=description)

    # ── Insights Generator ────────────────────────────────────────────────────

    def _generate_insights(
        self,
        expected_revenue: Decimal,
        quarter_target: Decimal,
        target_achievement_pct: Decimal,
        coverage_ratio: Decimal,
        coverage_status: str,
        prob_change: Decimal,
        cur_monthly_expected: Decimal,
        prev_monthly_expected: Decimal,
        historical_win_rate: Decimal,
        confidence: ConfidenceScore,
    ) -> list[ForecastInsight]:
        insights: list[ForecastInsight] = []

        # 1. Expected revenue vs target
        if expected_revenue > 0 and quarter_target > 0:
            pct = float(target_achievement_pct)
            if pct >= 100:
                insights.append(ForecastInsight(
                    message=f"Expected revenue exceeds quarterly target by {pct - 100:.1f}%.",
                    type="success",
                ))
            elif pct >= 80:
                insights.append(ForecastInsight(
                    message=f"Expected revenue is {pct:.1f}% of quarterly target. On track.",
                    type="info",
                ))
            else:
                insights.append(ForecastInsight(
                    message=f"Expected revenue is only {pct:.1f}% of quarterly target. Pipeline needs strengthening.",
                    type="warning",
                ))

        # 2. Pipeline coverage
        ratio = float(coverage_ratio)
        insights.append(ForecastInsight(
            message=f"Pipeline coverage is {coverage_status.lower()} at {ratio:.2f}x.",
            type="info" if coverage_status in ("Healthy", "Excellent") else "warning",
        ))

        # 3. Probability change
        if abs(prob_change) >= Decimal("1"):
            direction = "increased" if prob_change > 0 else "decreased"
            insights.append(ForecastInsight(
                message=f"Average probability {direction} {abs(prob_change):.1f}% this month.",
                type="success" if prob_change > 0 else "warning",
            ))

        # 4. Monthly forecast change
        delta = cur_monthly_expected - prev_monthly_expected
        if abs(delta) >= Decimal("10000"):
            direction = "improved" if delta > 0 else "declined"
            delta_lac = abs(delta) / Decimal("100000")
            insights.append(ForecastInsight(
                message=f"Revenue forecast {direction} by ₹{delta_lac:.1f}L compared to last month.",
                type="success" if delta > 0 else "warning",
            ))

        # 5. Confidence insight
        if float(historical_win_rate) > 0:
            insights.append(ForecastInsight(
                message=(
                    f"Forecast confidence is {confidence.status} because historical win rate "
                    f"is {float(historical_win_rate):.1f}%."
                ),
                type="info",
            ))

        return insights

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _build_forecast_risks(self, raw_risks: list[dict]) -> list[ForecastRisk]:
        """Convert raw risk dicts from repository into ForecastRisk schema objects."""
        return [
            ForecastRisk(
                deal_id=r["deal_id"],
                deal_name=r["deal_name"],
                company=r.get("company"),
                owner_name=r.get("owner_name"),
                deal_value=r["deal_value"],
                risk_type=r["risk_type"],
                risk_description=r["risk_description"],
                days_overdue=r["days_overdue"],
                probability=r["probability"],
            )
            for r in raw_risks
        ]

    def _generate_recommendations(
        self,
        expected_revenue: Decimal,
        quarter_target: Decimal,
        target_achievement_pct: Decimal,
        coverage_ratio: Decimal,
        raw_risks: list[dict],
        historical_win_rate: Decimal,
        avg_probability: Decimal,
    ) -> list[ForecastRecommendation]:
        """Rule-based recommendation engine driven by live CRM data."""
        recs: list[ForecastRecommendation] = []
        pct = float(target_achievement_pct)

        # 1. Target at risk
        if pct < 60:
            recs.append(ForecastRecommendation(
                priority="high",
                title="Increase Pipeline Volume",
                description=f"Current forecast covers only {pct:.0f}% of quarterly target. More opportunities are needed.",
                action="Review lead sources and increase outbound prospecting to fill pipeline gaps.",
                impact="Each new qualified deal with 50% probability adds directly to expected revenue.",
            ))

        # 2. Overdue deals
        overdue = [r for r in raw_risks if r["risk_type"] == "overdue"]
        if overdue:
            recs.append(ForecastRecommendation(
                priority="high",
                title=f"Follow Up on {len(overdue)} Overdue Deal(s)",
                description=f"{len(overdue)} deal(s) have passed their expected close date without being won or lost.",
                action="Schedule immediate discovery calls to assess deal health and update close dates.",
                impact="Recovering even one overdue deal can meaningfully improve quarterly close rate.",
            ))

        # 3. Low probability deals
        low_prob = [r for r in raw_risks if r["risk_type"] == "low_probability"]
        if low_prob:
            recs.append(ForecastRecommendation(
                priority="medium",
                title=f"Recover {len(low_prob)} Low-Probability Deal(s)",
                description=f"{len(low_prob)} deal(s) have probability below 25%. These inflate pipeline without contributing to forecast.",
                action="Reassess deal fit or disqualify to maintain an accurate pipeline.",
                impact="Cleaning up low-probability deals improves forecast accuracy and focus.",
            ))

        # 4. Stale deals
        stale = [r for r in raw_risks if r["risk_type"] in ("no_activity", "aging")]
        if stale:
            recs.append(ForecastRecommendation(
                priority="medium",
                title=f"Re-engage {len(stale)} Inactive Deal(s)",
                description=f"{len(stale)} deal(s) have had no activity for 14+ days or have been open 60+ days.",
                action="Assign follow-up tasks, schedule calls, and send personalised check-ins to reactivate.",
                impact="Consistent engagement improves win rates by 20–30% on stalled deals.",
            ))

        # 5. Coverage healthy — accelerate
        if float(coverage_ratio) >= Decimal("2.0"):
            recs.append(ForecastRecommendation(
                priority="low",
                title="Strong Coverage — Focus on Velocity",
                description=f"Pipeline coverage is {float(coverage_ratio):.1f}x target. The priority now is closing, not filling.",
                action="Prioritise deals in proposal and negotiation stages to accelerate closes this quarter.",
                impact="Reducing average sales cycle by 10% can increase quarterly revenue by 5–8%.",
            ))

        # 6. Win rate low
        if float(historical_win_rate) < 30:
            recs.append(ForecastRecommendation(
                priority="medium",
                title="Improve Win Rate Through Better Qualification",
                description=f"Historical win rate is {float(historical_win_rate):.1f}%. Below 30% typically indicates qualification issues.",
                action="Review ICP (Ideal Customer Profile), tighten qualification criteria, and add discovery steps.",
                impact="Improving win rate from 25% to 35% can increase revenue by 40% on the same pipeline.",
            ))

        # 7. Deal pricing review
        if float(avg_probability) < 50 and pct < 80:
            recs.append(ForecastRecommendation(
                priority="low",
                title="Review Pricing and Proposal Quality",
                description="Average deal probability is below 50% and forecast is behind target. Pricing may be a friction point.",
                action="Audit recent lost deals for pricing objections. Consider introducing flexible payment terms.",
                impact="Addressing pricing objections can increase close rates on proposals by 15–25%.",
            ))

        # 8. Meetings — universal recommendation
        recs.append(ForecastRecommendation(
            priority="low",
            title="Increase Customer Meetings",
            description="Consistent face-time with decision-makers is one of the strongest predictors of close.",
            action="Each rep should target at least 3 discovery or closing calls per week with top opportunities.",
            impact="Deals with 3+ recorded meetings close at 2x the rate of deals with fewer interactions.",
        ))

        return recs

    def _calc_velocity(self, velocity_data: dict) -> Decimal:
        """
        Sales Velocity = (Opportunities × Avg Deal Size × Win Rate%) / Avg Cycle Days
        """
        n = Decimal(str(velocity_data["num_opportunities"]))
        ads = Decimal(str(velocity_data["avg_deal_size"]))
        wr = Decimal(str(velocity_data["win_rate"])) / Decimal("100")
        cycle = max(Decimal(str(velocity_data["avg_sales_cycle_days"])), Decimal("1"))
        return (n * ads * wr) / cycle

    def _percentage(self, numerator: Decimal, denominator: Decimal) -> Decimal:
        if denominator <= 0:
            return Decimal("0")
        return (numerator * Decimal("100")) / denominator

    def _pct_change(self, current: Decimal, previous: Decimal) -> Decimal:
        if previous <= 0:
            return Decimal("0")
        return ((current - previous) * Decimal("100")) / previous

    def _coverage_status(self, ratio: Decimal) -> str:
        if ratio < Decimal("1.0"):
            return "Critical"
        elif ratio < Decimal("1.5"):
            return "Moderate"
        elif ratio <= Decimal("2.5"):
            return "Healthy"
        else:
            return "Excellent"

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

    def _prev_quarter_bounds(self, now: datetime) -> tuple[datetime, datetime]:
        current_q = math.ceil(now.month / 3)
        prev_q = current_q - 1
        year = now.year
        if prev_q <= 0:
            prev_q = 4
            year -= 1
        start_month = (prev_q - 1) * 3 + 1
        start = datetime(year, start_month, 1, tzinfo=timezone.utc)
        end_month = start_month + 3
        end_year = year
        if end_month > 12:
            end_month -= 12
            end_year += 1
        end = datetime(end_year, end_month, 1, tzinfo=timezone.utc)
        return start, end
