"""
Feature Vector Schemas
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class FeatureVectorResponse(BaseModel):
    id: UUID
    lead_id: UUID
    organization_id: UUID
    created_by: Optional[UUID] = None
    average_response_time: Optional[float] = None
    response_time_score: Optional[float] = None
    days_since_last_outbound: Optional[int] = None
    engagement_decay_penalty: Optional[float] = None
    ai_intent_category_score: Optional[float] = None
    buying_stage_score: Optional[float] = None
    customer_initiative_score: Optional[float] = None
    engagement_trend_score: Optional[float] = None
    company_size_score: Optional[float] = None
    industry_complexity_score: Optional[float] = None
    software_gap_score: Optional[float] = None
    operational_system_score: Optional[float] = None
    customization_potential_score: Optional[float] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_feature_vector(cls, fv) -> "FeatureVectorResponse":
        return cls.model_validate(fv)
