"""
AI-ready placeholder schemas.
"""
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AIContextRequest(BaseModel):
    entity_type: str = Field(min_length=1, max_length=50)
    entity_id: Optional[UUID] = None
    prompt: Optional[str] = None
    context: dict[str, Any] = Field(default_factory=dict)


class AILeadScoreRequest(BaseModel):
    lead_id: UUID
    context: dict[str, Any] = Field(default_factory=dict)


class AILeadScoreResponse(BaseModel):
    lead_id: UUID
    status: str = "placeholder"
    score: Optional[int] = None
    confidence: Optional[int] = None
    factors: list[str] = Field(default_factory=list)
    next_best_actions: list[str] = Field(default_factory=list)
    generated_at: datetime


class AINextBestActionRequest(BaseModel):
    entity_type: str = Field(min_length=1, max_length=50)
    entity_id: UUID
    context: dict[str, Any] = Field(default_factory=dict)


class AINextBestActionResponse(BaseModel):
    entity_type: str
    entity_id: UUID
    status: str = "placeholder"
    actions: list[str] = Field(default_factory=list)
    rationale: Optional[str] = None
    generated_at: datetime


class AIConversationSummaryRequest(BaseModel):
    thread_id: str = Field(min_length=1, max_length=255)
    email_ids: list[UUID] = Field(default_factory=list)
    context: dict[str, Any] = Field(default_factory=dict)


class AIConversationSummaryResponse(BaseModel):
    thread_id: str
    status: str = "placeholder"
    summary: Optional[str] = None
    bullets: list[str] = Field(default_factory=list)
    generated_at: datetime


class AIEmailSummaryRequest(BaseModel):
    email_id: UUID
    context: dict[str, Any] = Field(default_factory=dict)


class AIEmailSummaryResponse(BaseModel):
    email_id: UUID
    status: str = "placeholder"
    summary: Optional[str] = None
    key_points: list[str] = Field(default_factory=list)
    generated_at: datetime


class AIRecommendationRequest(BaseModel):
    entity_type: str = Field(min_length=1, max_length=50)
    entity_id: Optional[UUID] = None
    context: dict[str, Any] = Field(default_factory=dict)


class AIRecommendationResponse(BaseModel):
    entity_type: str
    entity_id: Optional[UUID] = None
    status: str = "placeholder"
    recommendations: list[str] = Field(default_factory=list)
    generated_at: datetime


class AIJobRequest(BaseModel):
    job_type: str = Field(min_length=1, max_length=100)
    entity_type: str = Field(min_length=1, max_length=50)
    entity_id: Optional[UUID] = None
    context: dict[str, Any] = Field(default_factory=dict)


class AIJobResponse(BaseModel):
    job_id: UUID
    job_type: str
    entity_type: str
    entity_id: Optional[UUID] = None
    status: str = "queued"
    generated_at: datetime


class DealInsightRequest(BaseModel):
    deal_id: UUID
    context: dict[str, Any] = Field(default_factory=dict)


class DealInsightResponse(BaseModel):
    deal_id: UUID
    status: str = "placeholder"
    score: Optional[int] = None
    confidence: Optional[int] = None
    factors: list[str] = Field(default_factory=list)
    next_best_actions: list[str] = Field(default_factory=list)
    generated_at: datetime


class SummaryRequest(AIContextRequest):
    pass


class SummaryResponse(BaseModel):
    entity_type: str
    entity_id: Optional[UUID] = None
    status: str = "placeholder"
    summary: Optional[str] = None
    bullets: list[str] = Field(default_factory=list)
    generated_at: datetime
