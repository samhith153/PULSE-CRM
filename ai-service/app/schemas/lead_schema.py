"""Lead scoring request/response schemas."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Version constants (returned in every /assess response) ─────────────
ASSESSMENT_VERSION = "1.0"
MODEL_VERSION = "rule-based-v1"
PROMPT_VERSION = "rule-based-v1"


class LeadAssessRequest(BaseModel):
    """Raw lead data — the AI service computes features internally."""
    lead_id: str = Field(..., min_length=1)
    # ── Fit fields ──────────────────────────────────────────────────────
    employees: Optional[int] = None
    company_size: Optional[int] = None
    industry: Optional[str] = None
    current_crm: Optional[str] = None
    operational_system: Optional[str] = None
    customizations: Optional[str] = None
    # ── Engagement fields ───────────────────────────────────────────────
    intent: Optional[str] = None            # from email_summaries.summary_word / intent
    current_stage: Optional[str] = None     # buying-stage slug (new/contacted/qualified/…)
    inbound_count: Optional[int] = None
    initiated_count: Optional[int] = None
    inbound_email_count: Optional[int] = None  # alias → inbound_count
    outbound_email_count: Optional[int] = None
    last_inbound_at: Optional[str] = None   # ISO-8601
    days_since_last_outbound: Optional[int] = None
    # ── Legacy fields (kept for /score compat) ──────────────────────────
    intent_today: Optional[str] = None
    intent_7_days_ago: Optional[float] = None
    buying_stage: Optional[str] = None
    response_time_hours: Optional[float] = None
    is_outbound: Optional[bool] = None
    # ── Recommendation fields ───────────────────────────────────────────
    deal_value: Optional[float] = None
    tags: Optional[List[str]] = None
    context: Dict[str, Any] = Field(default_factory=dict)


# ── Legacy alias (used by /score endpoint) ─────────────────────────────
LeadScoreRequest = LeadAssessRequest


class FitFeatures(BaseModel):
    company_size_score: Optional[float] = None
    industry_complexity_score: Optional[float] = None
    software_gap_score: Optional[float] = None
    operational_system_score: Optional[float] = None
    customization_potential_score: Optional[float] = None


class EngagementFeatures(BaseModel):
    intent_score: Optional[float] = None
    buying_stage_score: Optional[float] = None
    initiative_score: Optional[float] = None
    decay_penalty: Optional[int] = None
    days_since_last_inbound: Optional[int] = None


class FitResult(BaseModel):
    score: float
    reasons: List[str] = Field(default_factory=list)
    features: FitFeatures = Field(default_factory=FitFeatures)


class EngagementResult(BaseModel):
    score: float
    reasons: List[str] = Field(default_factory=list)
    features: EngagementFeatures = Field(default_factory=EngagementFeatures)


class OverallResult(BaseModel):
    score: float
    tier: str
    raw_score: float
    top_reasons: List[str] = Field(default_factory=list)


class RecommendationSummary(BaseModel):
    status: str = "no_recommendation"
    action: Optional[str] = None
    score: Optional[float] = None
    reasons: List[str] = Field(default_factory=list)
    all_recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    lead_id: Optional[str] = None
    stage: Optional[str] = None
    engagement_score: Optional[float] = None
    contact_time: Optional[float] = None
    deal_value: Optional[float] = None


class VersionInfo(BaseModel):
    assessment_version: str = ASSESSMENT_VERSION
    model_version: str = MODEL_VERSION
    prompt_version: str = PROMPT_VERSION


class LeadAssessResponse(BaseModel):
    lead_id: str
    fit: FitResult
    engagement: EngagementResult
    overall: OverallResult
    recommendation: RecommendationSummary
    versions: VersionInfo = Field(default_factory=VersionInfo)


# ── Legacy response (kept for /score compat) ───────────────────────────
class LeadScoreResponse(BaseModel):
    lead_id: str
    fit: FitResult
    engagement: EngagementResult
    overall: OverallResult
