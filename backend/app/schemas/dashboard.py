"""
Dashboard and Analytics Schemas
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.pipeline import PipelineBoardResponse, PipelineForecastResponse, PipelineStageStatsResponse


class DashboardRevenuePoint(BaseModel):
    period: str
    revenue: Decimal
    deal_count: int


class TopSalesRepresentativeResponse(BaseModel):
    user_id: UUID
    full_name: str
    deal_count: int
    won_deals: int
    revenue: Decimal


class DashboardSummaryResponse(BaseModel):
    organization_id: UUID
    total_users: int
    total_companies: int
    total_contacts: int
    total_leads: int
    total_deals: int
    won_deals: int
    lost_deals: int
    revenue: Decimal
    monthly_revenue: list[DashboardRevenuePoint] = Field(default_factory=list)
    lead_conversion_rate: Decimal
    deal_win_rate: Decimal
    activity_count: int
    email_count: int
    recent_activity_count: int
    recent_email_count: int
    pipeline_distribution: list[PipelineStageStatsResponse] = Field(default_factory=list)
    top_sales_representatives: list[TopSalesRepresentativeResponse] = Field(default_factory=list)
    generated_at: datetime


class DashboardTrendPoint(BaseModel):
    period: str
    value: Decimal
    count: int


class DashboardTrendResponse(BaseModel):
    points: list[DashboardTrendPoint]


class DashboardAnalyticsResponse(BaseModel):
    summary: DashboardSummaryResponse
    pipeline: PipelineBoardResponse
    monthly_revenue: list[DashboardRevenuePoint]
    top_sales_representatives: list[TopSalesRepresentativeResponse]
    trends: DashboardTrendResponse


class DashboardStatsResponse(BaseModel):
    organization_id: UUID
    total_deals: int
    total_revenue: Decimal
    pipeline_value: Decimal
    lead_conversion_rate: Decimal
    win_rate: Decimal
    activity_count: int
    email_count: int
    forecast: PipelineForecastResponse
    monthly_revenue: list[DashboardRevenuePoint] = Field(default_factory=list)
    top_sales_representatives: list[TopSalesRepresentativeResponse] = Field(default_factory=list)
    generated_at: datetime
