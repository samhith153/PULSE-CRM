"""Recommendation request/response schemas."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    """Raw lead data — the AI service computes features internally."""
    lead_id: str = Field(..., min_length=1)
    employees: Optional[int] = None
    company_size: Optional[int] = None
    industry: Optional[str] = None
    current_crm: Optional[str] = None
    operational_system: Optional[str] = None
    customizations: Optional[str] = None
    intent_today: Optional[str] = None
    intent_7_days_ago: Optional[float] = None
    buying_stage: Optional[str] = None
    current_stage: Optional[str] = None
    response_time_hours: Optional[float] = None
    days_since_last_outbound: Optional[int] = None
    is_outbound: Optional[bool] = None
    score: Optional[float] = None
    engagement_score: Optional[float] = None
    deal_value: Optional[float] = None
    outbound_thread: Optional[list] = None
    inbound_thread: Optional[list] = None
    tags: Optional[List[str]] = None
    last_outbound_date: Optional[str] = None
    context: dict[str, Any] = Field(default_factory=dict)


class SingleRecommendation(BaseModel):
    action: str
    score: float
    reasons: List[str] = Field(default_factory=list)


class RecommendationResponse(BaseModel):
    lead_id: str
    stage: str
    recommendations: List[SingleRecommendation] = Field(default_factory=list)
    engagement_score: Optional[float] = None
    contact_time: Optional[float] = None
    deal_value: Optional[float] = None


class BatchRecommendationRequest(BaseModel):
    leads: List[RecommendationRequest] = Field(..., min_length=1, max_length=100)


class BatchRecommendationResponse(BaseModel):
    recommendations: Dict[str, RecommendationResponse] = Field(default_factory=dict)
