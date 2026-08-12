"""
Sales Rep AI Insights — Pydantic schemas for the unified
GET /api/v1/ai-insights/sales-rep endpoint.

These are thin, UI-ready DTOs — only the fields the frontend needs.
Internal DB IDs, model versions, prompt versions, and org IDs are
NOT included unless the frontend click-navigation requires an entity ID.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── Action Center ─────────────────────────────────────────────────────────────

class SalesRepActionItem(BaseModel):
    """One card in Immediate Action or Rising Interest."""
    lead_id: UUID
    lead_name: str
    company: Optional[str] = None
    score: int                  # overall lead score 0-100
    reason: str                 # human-readable, derived from signals
    deal_id: Optional[UUID] = None
    deal_name: Optional[str] = None
    deal_value: float = 0.0
    trend: Optional[str] = None     # Improving | Stable | Declining (Rising Interest only)
    change: Optional[str] = None    # e.g. "+12%" (Rising Interest only)


class SalesRepFollowUpItem(BaseModel):
    """One card in Follow Up Due."""
    lead_id: UUID
    lead_name: str
    company: Optional[str] = None
    days_overdue: int           # calculated dynamically
    reason: str                 # e.g. "Missed scheduled demo call"
    deal_id: Optional[UUID] = None
    deal_value: float = 0.0


class SalesRepColdItem(BaseModel):
    """One card in Going Cold."""
    lead_id: UUID
    lead_name: str
    company: Optional[str] = None
    score: int                  # overall lead score 0-100
    reason: str                 # e.g. "No response to follow-ups in 14d"
    days_inactive: int
    deal_id: Optional[UUID] = None


class SalesRepActionCenter(BaseModel):
    immediate_action: list[SalesRepActionItem] = Field(default_factory=list)
    follow_up_due: list[SalesRepFollowUpItem] = Field(default_factory=list)
    rising_interest: list[SalesRepActionItem] = Field(default_factory=list)
    going_cold: list[SalesRepColdItem] = Field(default_factory=list)


# ── Pipeline Health Index ─────────────────────────────────────────────────────

class SalesRepPipelineHealth(BaseModel):
    score: int                  # 0-100
    status: str                 # Excellent | Healthy | Needs Attention | At Risk | Critical
    trend_label: str            # e.g. "Excellent Velocity (+3% vs yesterday)"
    explanation: str            # one or two sentences


# ── Daily Priorities ──────────────────────────────────────────────────────────

class SalesRepPriorityItem(BaseModel):
    priority_id: UUID
    title: str
    description: str            # recommendation text
    priority_level: str         # High | Medium | Low | Critical
    related_lead: Optional[str] = None
    related_lead_id: Optional[UUID] = None
    related_deal: Optional[str] = None
    related_deal_id: Optional[UUID] = None
    related_company: Optional[str] = None
    deal_value: float = 0.0
    due_date: Optional[str] = None   # ISO date string


# ── Conversation Intelligence ─────────────────────────────────────────────────

class SalesRepSentimentBreakdown(BaseModel):
    positive: int = 0
    neutral: int = 0
    negative: int = 0


class SalesRepIntentItem(BaseModel):
    label: str
    count: int


class SalesRepRecentSummary(BaseModel):
    id: UUID
    contact_name: str
    company: Optional[str] = None
    summary: str
    sentiment: str              # positive | neutral | negative
    category: str               # sales | support | urgent | etc.
    follow_up_suggestion: Optional[str] = None
    date: datetime


class SalesRepConversationIntelligence(BaseModel):
    sentiment: SalesRepSentimentBreakdown = Field(
        default_factory=SalesRepSentimentBreakdown
    )
    intent_distribution: list[SalesRepIntentItem] = Field(default_factory=list)
    recent_summaries: list[SalesRepRecentSummary] = Field(default_factory=list)
    powered_by: str = "Rule-based engine"


# ── Unified response ──────────────────────────────────────────────────────────

class SalesRepAIInsightsResponse(BaseModel):
    action_center: SalesRepActionCenter = Field(
        default_factory=SalesRepActionCenter
    )
    pipeline_health: SalesRepPipelineHealth
    daily_priorities: list[SalesRepPriorityItem] = Field(default_factory=list)
    conversation_intelligence: SalesRepConversationIntelligence = Field(
        default_factory=SalesRepConversationIntelligence
    )
    generated_at: datetime
