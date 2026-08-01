"""
Pipeline Schemas
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PipelineStageCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=50)
    color: Optional[str] = Field(default=None, max_length=20)
    sort_order: int = Field(default=0, ge=0)
    probability: int = Field(default=0, ge=0, le=100)
    is_default: bool = False


class PipelineStageUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    slug: Optional[str] = Field(default=None, min_length=1, max_length=50)
    color: Optional[str] = Field(default=None, max_length=20)
    sort_order: Optional[int] = Field(default=None, ge=0)
    probability: Optional[int] = Field(default=None, ge=0, le=100)
    is_default: Optional[bool] = None


class PipelineStageResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    color: Optional[str]
    sort_order: int
    probability: int
    is_default: bool
    organization_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PipelineStageStatsResponse(BaseModel):
    stage: PipelineStageResponse
    deal_count: int
    total_amount: Decimal
    weighted_amount: Decimal


class PipelineBoardResponse(BaseModel):
    stages: list[PipelineStageStatsResponse]
    total_deals: int
    total_amount: Decimal
    weighted_amount: Decimal


class PipelineForecastStageResponse(BaseModel):
    stage: PipelineStageResponse
    deal_count: int
    pipeline_value: Decimal
    weighted_value: Decimal
    win_probability: int


class PipelineForecastResponse(BaseModel):
    organization_id: UUID
    total_pipeline_value: Decimal
    weighted_pipeline_value: Decimal
    revenue_forecast: Decimal
    win_probability: Decimal
    stage_wise_forecast: list[PipelineForecastStageResponse]
    generated_at: datetime


class PipelineStatisticsResponse(BaseModel):
    organization_id: UUID
    total_pipeline_value: Decimal
    weighted_pipeline_value: Decimal
    revenue_forecast: Decimal
    win_probability: Decimal
    total_deals: int
    open_deals: int
    won_deals: int
    lost_deals: int
    stage_wise_forecast: list[PipelineForecastStageResponse]
    generated_at: datetime


class PipelineMoveRequest(BaseModel):
    deal_id: UUID
    stage_id: UUID
    close_reason: Optional[str] = Field(default=None, max_length=1000)
