"""
Lead Score Schemas
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class LeadScoreResponse(BaseModel):
    id: UUID
    lead_id: UUID
    organization_id: UUID
    created_by: Optional[UUID] = None
    fit_score: Optional[int] = None
    fit_reasons: Optional[list[str]] = None
    engagement_score: Optional[int] = None
    engagement_reasons: Optional[list[str]] = None
    overall_score: Optional[int] = None
    priority_tier: Optional[str] = None
    top_reasons: Optional[list[str]] = None
    scored_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_lead_score(cls, ls) -> "LeadScoreResponse":
        return cls.model_validate(ls)
