"""
Sales Manager Forecast Schemas
Pydantic models for GET /api/v1/dashboard/manager/forecast
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


# ── 1. Expected Revenue ───────────────────────────────────────────────────────

class ExpectedRevenueStats(BaseModel):
    expected_revenue: Decimal
    quarter: str                        # e.g. "Q3 2026"
    previous_forecast: Decimal
    growth_pct: Decimal
    target_achievement_pct: Decimal


# ── 2. Best Case Pipeline ─────────────────────────────────────────────────────

class BestCasePipelineStats(BaseModel):
    best_case_pipeline: Decimal
    active_pipeline_value: Decimal
    difference_from_expected: Decimal


# ── 3. Active Pipe Coverage ───────────────────────────────────────────────────

class PipelineCoverageStats(BaseModel):
    coverage_ratio: Decimal
    coverage_status: str                # Critical / Moderate / Healthy / Excellent


# ── 4. AI Confidence Score ────────────────────────────────────────────────────

class ConfidenceScore(BaseModel):
    score: int
    status: str                         # Very High / High / Medium / Low
    description: str


# ── 5. Monthly Forecast Breakdown ────────────────────────────────────────────

class MonthlyForecastPoint(BaseModel):
    month: str                          # e.g. "May"
    pipeline: Decimal
    expected: Decimal
    maximum: Decimal


# ── 6. Quarterly Projection Matrix ───────────────────────────────────────────

class QuarterlyProjectionRow(BaseModel):
    quarter: str                        # e.g. "Q1 2026"
    quota_target: Decimal
    expected_closed_revenue: Decimal
    best_case_close: Decimal
    open_pipeline: Decimal
    target_achievement_pct: Decimal


# ── 7. Revenue Forecast Trend ─────────────────────────────────────────────────

class ForecastTrendPoint(BaseModel):
    month: str                          # "YYYY-MM" or display label
    forecast: Decimal


# ── 8. Forecast Accuracy ─────────────────────────────────────────────────────

class ForecastAccuracyStats(BaseModel):
    current_accuracy_pct: Decimal
    previous_accuracy_pct: Decimal
    difference_pct: Decimal


# ── 9. Sales Velocity ────────────────────────────────────────────────────────

class SalesVelocityStats(BaseModel):
    sales_velocity: Decimal
    previous_velocity: Decimal
    growth_pct: Decimal


# ── 10. Forecast Insight ─────────────────────────────────────────────────────

class ForecastInsight(BaseModel):
    message: str
    type: str = "info"                  # info / warning / success / tip


# ── Root Response ─────────────────────────────────────────────────────────────

class ManagerForecastResponse(BaseModel):
    # KPI cards
    expected_revenue: ExpectedRevenueStats
    best_case_pipeline: BestCasePipelineStats
    pipeline_coverage: PipelineCoverageStats
    confidence_score: ConfidenceScore

    # Breakdowns
    monthly_forecast: list[MonthlyForecastPoint] = Field(default_factory=list)
    quarterly_projection: list[QuarterlyProjectionRow] = Field(default_factory=list)
    forecast_trend: list[ForecastTrendPoint] = Field(default_factory=list)

    # Accuracy & velocity
    forecast_accuracy: ForecastAccuracyStats
    sales_velocity: SalesVelocityStats

    # AI-generated insights
    forecast_insights: list[ForecastInsight] = Field(default_factory=list)

    # Meta
    quarter: str
    period: str                         # "monthly" | "quarterly" | "yearly"
    generated_at: datetime

    # Flat aliases for simple consumers (mirrors prompt's top-level fields)
    @property
    def expectedRevenue(self) -> Decimal:           # noqa: N802
        return self.expected_revenue.expected_revenue

    @property
    def bestCasePipeline(self) -> Decimal:          # noqa: N802
        return self.best_case_pipeline.best_case_pipeline

    @property
    def pipelineCoverage(self) -> Decimal:          # noqa: N802
        return self.pipeline_coverage.coverage_ratio

    @property
    def confidenceScore(self) -> int:               # noqa: N802
        return self.confidence_score.score

    model_config = {"populate_by_name": True}
