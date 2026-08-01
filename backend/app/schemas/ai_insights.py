"""
AI Insights Schemas — AI Action Center & Pipeline Health Index.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── 1. Immediate Action ───────────────────────────────────────────────────────

class ImmediateActionItem(BaseModel):
    id: UUID
    lead_name: str
    deal_name: Optional[str] = None
    score: int
    priority: str           # P1 | Critical | High | Medium
    reason: str
    deal_value: float
    probability: int
    owner_name: Optional[str] = None
    last_activity_at: Optional[datetime] = None


# ── 2. Follow-Up Due ──────────────────────────────────────────────────────────

class FollowUpDueItem(BaseModel):
    id: UUID
    company: str
    deal_name: str
    days_overdue: int
    deal_value: float
    probability: int
    owner_name: Optional[str] = None


# ── 3. Pipeline Health ────────────────────────────────────────────────────────

class PipelineHealthResponse(BaseModel):
    score: float
    status: str             # Excellent | Healthy | Average | Poor
    change: str             # e.g. "+3%" or "-2%"
    description: str
    components: dict[str, float] = Field(default_factory=dict)


# ── 4. Daily Summary ──────────────────────────────────────────────────────────

class DailySummaryResponse(BaseModel):
    urgent_deals: int = Field(alias="urgentDeals")
    follow_ups: int   = Field(alias="followUps")
    meetings: int
    calls: int
    closing_this_week: int  = Field(alias="closingThisWeek")
    high_value_opportunities: int = Field(alias="highValueOpportunities")

    model_config = {"populate_by_name": True}


# ── 5. High-Value Deal ────────────────────────────────────────────────────────

class HighValueDealItem(BaseModel):
    id: UUID
    deal: str
    value: float
    probability: int
    status: str
    expected_close_date: Optional[date] = None
    owner_name: Optional[str] = None


# ── 6. Risk Item ──────────────────────────────────────────────────────────────

class RiskItem(BaseModel):
    id: UUID
    deal_name: str
    deal_value: float
    probability: int
    risk_level: str         # Critical | High | Medium | Low
    risk_factors: list[str] = Field(default_factory=list)
    owner_name: Optional[str] = None
    last_activity_at: Optional[datetime] = None


# ── 7. Opportunity Score ──────────────────────────────────────────────────────

class OpportunityScoreItem(BaseModel):
    id: UUID
    deal_name: str
    opportunity_score: int  # 0-100
    lead_score: int
    probability: int
    deal_value: float
    owner_name: Optional[str] = None


# ── 8. AI Recommendation ─────────────────────────────────────────────────────

class AIRecommendationItem(BaseModel):
    id: UUID
    entity_type: str        # lead | deal
    entity_name: str
    action: str             # "Schedule follow-up", "Send proposal", etc.
    reasoning: str
    priority: str           # critical | high | medium | low
    owner_name: Optional[str] = None


# ── 9. Notification Alert ─────────────────────────────────────────────────────

class NotificationAlert(BaseModel):
    type: str
    severity: str           # critical | high | medium | low
    message: str


# ── Root response ─────────────────────────────────────────────────────────────

class ActionCenterResponse(BaseModel):
    immediate_actions: list[ImmediateActionItem]   = Field(default_factory=list, alias="immediateActions")
    follow_ups: list[FollowUpDueItem]               = Field(default_factory=list, alias="followUps")
    pipeline_health: PipelineHealthResponse
    summary: DailySummaryResponse
    high_value_deals: list[HighValueDealItem]       = Field(default_factory=list, alias="highValueDeals")
    risk_items: list[RiskItem]                      = Field(default_factory=list, alias="riskItems")
    opportunity_scores: list[OpportunityScoreItem]  = Field(default_factory=list, alias="opportunityScores")
    recommendations: list[AIRecommendationItem]     = Field(default_factory=list)
    notifications: list[NotificationAlert]          = Field(default_factory=list)
    generated_at: datetime

    model_config = {"populate_by_name": True}


# ═══════════════════════════════════════════════════════════════════════════════
# Going Cold Detection Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class ColdScoreComponents(BaseModel):
    """Breakdown of the cold score weighted factors."""
    no_activity_days_score: float       # 30%
    missed_followups_score: float       # 20%
    no_email_replies_score: float       # 15%
    missed_meetings_score: float        # 15%
    probability_drop_score: float       # 10%
    deal_aging_score: float             # 10%


class TrendAnalysis(BaseModel):
    trend: str          # Improving | Stable | Declining
    change: str         # e.g. "-22%" or "+8%"
    current_period_activities: int
    previous_period_activities: int


class ColdLeadItem(BaseModel):
    """A single going-cold lead/deal record."""
    lead_id: UUID
    lead_name: str
    deal_id: Optional[UUID] = None
    deal_name: Optional[str] = None
    owner: Optional[str] = None
    owner_id: Optional[UUID] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    pipeline_stage: Optional[str] = None
    cold_score: int                         # 0–100
    risk: str                               # Critical | High Risk | Medium Risk | Low Risk | Healthy
    days_inactive: int
    overdue_followups: int
    deal_value: float
    probability: int
    trend: str
    change: str
    recommendation: str
    warning_indicators: list[str] = Field(default_factory=list)
    score_components: Optional[ColdScoreComponents] = None
    last_activity_at: Optional[datetime] = None
    deal_created_at: Optional[datetime] = None


class GoingColdListResponse(BaseModel):
    """Paginated going-cold list."""
    total_records: int
    page: int
    page_size: int
    has_next: bool
    data: list[ColdLeadItem] = Field(default_factory=list)


class GoingColdSummaryResponse(BaseModel):
    """Dashboard KPI summary for Going Cold."""
    critical: int
    high_risk: int          = Field(alias="highRisk")
    medium_risk: int        = Field(alias="mediumRisk")
    low_risk: int           = Field(alias="lowRisk")
    healthy: int
    average_cold_score: float = Field(alias="averageColdScore")
    total_cold_leads: int
    critical_deals: int
    inactive_customers: int
    overdue_followups: int
    recovery_rate: float            # % of cold leads re-engaged this month
    deals_reengaged_this_month: int

    model_config = {"populate_by_name": True}


class GoingColdNotification(BaseModel):
    lead_id: UUID
    lead_name: str
    type: str       # cold_score_high | inactive_14d | critical_risk | followup_overdue | prob_drop
    severity: str   # critical | high | medium
    message: str


# ═══════════════════════════════════════════════════════════════════════════════
# Daily Priorities Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class PriorityScoreComponents(BaseModel):
    """Weighted factor breakdown for the AI Priority Score."""
    overdue_followup_score: float    # 25%
    deal_value_score: float          # 20%
    closing_soon_score: float        # 15%
    rising_interest_score: float     # 15%
    going_cold_score: float          # 10%
    open_tasks_score: float          # 10%
    todays_meetings_score: float     # 5%


class DailyPriorityItem(BaseModel):
    """A single AI-generated daily priority task."""
    priority_id: UUID
    title: str
    category: str           # Follow-up | Meeting | Call | Proposal | Demo | Risk Recovery | etc.
    priority_score: int     # 0–100
    priority_level: str     # Critical | High | Medium | Low | Informational
    related_lead: Optional[str] = None
    related_lead_id: Optional[UUID] = None
    related_deal: Optional[str] = None
    related_deal_id: Optional[UUID] = None
    related_company: Optional[str] = None
    owner: Optional[str] = None
    owner_id: Optional[UUID] = None
    deal_value: float = 0.0
    due_date: Optional[date] = None
    recommendation: str
    reason: str
    score_components: Optional[PriorityScoreComponents] = None
    is_overdue: bool = False
    days_until_close: Optional[int] = None
    pipeline_stage: Optional[str] = None


class DailyPrioritiesListResponse(BaseModel):
    """Paginated daily priorities list."""
    total_records: int
    page: int
    page_size: int
    has_next: bool
    data: list[DailyPriorityItem] = Field(default_factory=list)


class DailyPrioritiesSummaryResponse(BaseModel):
    """Dashboard KPIs for the Daily Priorities panel."""
    critical: int
    high: int
    medium: int
    low: int
    informational: int
    completed_today: int
    pending_today: int
    meetings_today: int        = Field(alias="meetingsToday")
    follow_ups_today: int      = Field(alias="followUpsToday")
    calls_today: int           = Field(alias="callsToday")
    closing_deals: int         = Field(alias="closingDeals")

    model_config = {"populate_by_name": True}


class DailyPriorityNotification(BaseModel):
    """Alert generated from a high-priority item."""
    priority_id: UUID
    title: str
    type: str       # critical_priority | closing_soon | followup_overdue
                    # meeting_soon | proposal_pending | cold_lead
    severity: str   # critical | high | medium
    message: str


# ═══════════════════════════════════════════════════════════════════════════════
# Conversation Intelligence Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class ConversationTimelineEntry(BaseModel):
    """One item in the unified conversation timeline."""
    id: UUID
    type: str               # Call | Meeting | Email | Internal Note | Customer Note
    title: str
    date: datetime
    owner: Optional[str] = None
    owner_id: Optional[UUID] = None
    description: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[UUID] = None


class ActionItemDetected(BaseModel):
    title: str
    priority: str           # High | Medium | Low


class BuyingSignal(BaseModel):
    signal: str             # Pricing Request | Requested Demo | etc.
    confidence: str         # High | Medium | Low


class ObjectionDetected(BaseModel):
    type: str               # Budget | Competitor | Approval | etc.
    severity: str           # High | Medium | Low
    description: str


class EngagementScoreComponents(BaseModel):
    email_replies: float        # 20%
    meetings_attended: float    # 20%
    calls_completed: float      # 20%
    response_time: float        # 15%
    notes_added: float          # 10%
    followups_completed: float  # 15%


class ConversationQualityComponents(BaseModel):
    customer_participation: float   # 25%
    positive_responses: float       # 20%
    questions_asked: float          # 15%
    action_items_created: float     # 15%
    buying_signals: float           # 15%
    objections_resolved: float      # 10%


class ConversationItem(BaseModel):
    """Full analysis of a single conversation."""
    id: UUID
    type: str
    title: str
    date: datetime
    owner: Optional[str] = None
    owner_id: Optional[UUID] = None
    related_lead: Optional[str] = None
    related_lead_id: Optional[UUID] = None
    related_deal: Optional[str] = None
    related_deal_id: Optional[UUID] = None
    related_company: Optional[str] = None
    related_contact: Optional[str] = None
    summary: str
    engagement_score: int
    quality_score: int
    health_status: str          # Excellent | Healthy | Average | Needs Attention
    buying_signals: list[BuyingSignal] = Field(default_factory=list)
    objections: list[ObjectionDetected] = Field(default_factory=list)
    action_items: list[ActionItemDetected] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    description: Optional[str] = None


class ConversationListResponse(BaseModel):
    total_records: int
    page: int
    page_size: int
    has_next: bool
    data: list[ConversationItem] = Field(default_factory=list)


class ConversationDetailResponse(BaseModel):
    """Detailed view of one conversation."""
    id: UUID
    type: str
    summary: str
    engagement_score: int
    quality_score: int
    health_status: str
    buying_signals: list[BuyingSignal] = Field(default_factory=list)
    objections: list[ObjectionDetected] = Field(default_factory=list)
    action_items: list[ActionItemDetected] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    timeline: list[ConversationTimelineEntry] = Field(default_factory=list)
    engagement_components: Optional[EngagementScoreComponents] = None
    quality_components: Optional[ConversationQualityComponents] = None


class ConversationIntelligenceSummaryResponse(BaseModel):
    total_conversations: int
    calls: int
    meetings: int
    emails: int
    notes: int
    average_engagement: float
    average_quality: float
    buying_signals: int
    open_actions: int


class ConversationNotification(BaseModel):
    conversation_id: UUID
    title: str
    type: str       # buying_signal | critical_objection | no_response
                    # meeting_cancelled | proposal_requested | decision_maker
    severity: str   # critical | high | medium
    message: str


# ═══════════════════════════════════════════════════════════════════════════════
# Sentiment Analysis Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class SentimentMoodPoint(BaseModel):
    """One point in the customer mood timeline."""
    date: datetime
    sentiment: str      # Very Positive | Positive | Neutral | Negative | etc.
    score: int          # 0–100
    confidence: int
    source_type: str    # email | activity | note
    title: Optional[str] = None


class SentimentTrend(BaseModel):
    trend: str          # Improving | Stable | Declining
    change: str         # e.g. "+15%" or "-8%"
    current_avg: float
    previous_avg: float


class SentimentDistribution(BaseModel):
    very_positive: float = 0.0
    positive: float      = 0.0
    neutral: float       = 0.0
    negative: float      = 0.0
    very_negative: float = 0.0
    interested: float    = 0.0
    frustrated: float    = 0.0
    excited: float       = 0.0
    confused: float      = 0.0
    angry: float         = 0.0


class SentimentItem(BaseModel):
    """Full sentiment record for one customer/lead."""
    lead_id: Optional[UUID] = None
    customer: str
    owner: Optional[str] = None
    owner_id: Optional[UUID] = None
    company: Optional[str] = None
    deal_name: Optional[str] = None
    deal_value: float = 0.0
    sentiment: str
    score: int                  # 0–100
    confidence: int             # 0–100
    trend: str
    change: str
    risk: str                   # Critical | High | Medium | Low
    recommendation: str
    mood_timeline: list[SentimentMoodPoint] = Field(default_factory=list)
    distribution: Optional[SentimentDistribution] = None
    total_interactions: int = 0
    negative_streak: int = 0    # consecutive negatives
    last_interaction_at: Optional[datetime] = None


class SentimentListResponse(BaseModel):
    total_records: int
    page: int
    page_size: int
    has_next: bool
    data: list[SentimentItem] = Field(default_factory=list)


class SentimentSummaryResponse(BaseModel):
    average_score: float        = Field(alias="averageScore")
    positive: int
    neutral: int
    negative: int
    interested: int
    frustrated: int
    high_risk_customers: int    = Field(alias="highRiskCustomers")
    improving_customers: int    = Field(alias="improvingCustomers")
    declining_customers: int    = Field(alias="decliningCustomers")
    average_confidence: float   = Field(alias="averageConfidence")
    total_analyzed: int

    model_config = {"populate_by_name": True}


class SentimentNotification(BaseModel):
    lead_id: Optional[UUID] = None
    customer: str
    type: str       # very_negative | angry | consecutive_negative
                    # high_value_decline | complaint_detected
    severity: str   # critical | high | medium
    message: str


# ═══════════════════════════════════════════════════════════════════════════════
# Intent Detection Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class IntentTimelinePoint(BaseModel):
    date: datetime
    intent: str
    confidence: int
    source_type: str    # email | activity
    title: Optional[str] = None


class IntentTrend(BaseModel):
    trend: str          # Increasing | Stable | Declining
    change: str         # "+18%" | "-5%"
    current_score: float
    previous_score: float


class IntentItem(BaseModel):
    """Full intent record for one customer/lead."""
    lead_id: Optional[UUID] = None
    customer: str
    owner: Optional[str] = None
    owner_id: Optional[UUID] = None
    company: Optional[str] = None
    deal_name: Optional[str] = None
    deal_value: float = 0.0
    primary_intent: str
    secondary_intent: Optional[str] = None
    confidence: int             # 0–100
    buying_stage: str
    trend: str
    change: str
    recommendation: str
    intent_timeline: list[IntentTimelinePoint] = Field(default_factory=list)
    total_interactions: int = 0
    last_interaction_at: Optional[datetime] = None
    is_cancellation_risk: bool = False


class IntentListResponse(BaseModel):
    total_records: int
    page: int
    page_size: int
    has_next: bool
    data: list[IntentItem] = Field(default_factory=list)


class IntentSummaryResponse(BaseModel):
    purchase_intent: int        = Field(alias="purchaseIntent")
    demo_requests: int          = Field(alias="demoRequests")
    pricing_inquiries: int      = Field(alias="pricingInquiries")
    proposal_requests: int      = Field(alias="proposalRequests")
    technical_evaluations: int  = Field(alias="technicalEvaluations")
    security_reviews: int       = Field(alias="securityReviews")
    contract_reviews: int       = Field(alias="contractReviews")
    cancellation_risks: int     = Field(alias="cancellationRisks")
    average_confidence: float   = Field(alias="averageConfidence")
    intent_conversion_rate: float = Field(alias="intentConversionRate")
    total_analyzed: int

    model_config = {"populate_by_name": True}


class IntentNotification(BaseModel):
    lead_id: Optional[UUID] = None
    customer: str
    type: str       # purchase_intent | contract_review | cancellation_risk
                    # high_confidence | stage_escalation | decision_maker
    severity: str   # critical | high | medium
    message: str


# ═══════════════════════════════════════════════════════════════════════════════
# Recent AI Summaries Schemas
# ═══════════════════════════════════════════════════════════════════════════════

# ── Summary list item (lightweight, for paginated list) ───────────────────────

class RecentSummaryItem(BaseModel):
    """One row in the paginated recent-summaries list."""
    summary_id: UUID
    type: str                       # daily | weekly | monthly | executive | etc.
    title: str
    generated_at: datetime
    period: str                     # today | this_week | this_month | etc.
    priority: str                   # critical | high | medium | low
    executive_summary: Optional[str] = None
    critical_insights: int = 0
    recommendations: int = 0
    related_deals: int = 0
    related_leads: int = 0
    positive_trends: int = 0
    negative_trends: int = 0
    source_modules: list[str] = Field(default_factory=list)
    owner_id: Optional[UUID] = None


class RecentSummariesListResponse(BaseModel):
    """Paginated response for GET /recent-summaries."""
    total_records: int
    page: int
    page_size: int
    has_next: bool
    data: list[RecentSummaryItem] = Field(default_factory=list)


# ── Full summary detail (for GET /recent-summaries/{id}) ─────────────────────

class SummaryKPI(BaseModel):
    label: str
    value: Any
    unit: Optional[str] = None      # "₹" | "%" | "count"
    trend: Optional[str] = None     # "up" | "down" | "stable"
    change: Optional[str] = None    # "+4%" | "-2 deals"


class SummaryRelatedLead(BaseModel):
    lead_id: UUID
    title: str
    status: str
    score: Optional[int] = None
    owner: Optional[str] = None


class SummaryRelatedDeal(BaseModel):
    deal_id: UUID
    name: str
    status: str
    amount: Optional[float] = None
    probability: Optional[int] = None
    owner: Optional[str] = None


class SummaryRecommendation(BaseModel):
    action: str
    reasoning: str
    priority: str
    entity_name: Optional[str] = None
    entity_type: Optional[str] = None


class SummaryRisk(BaseModel):
    risk_type: str                  # cold_lead | overdue | low_probability | negative_sentiment
    severity: str                   # critical | high | medium | low
    description: str
    count: int = 1
    affected_records: list[str] = Field(default_factory=list)


class SummaryOpportunity(BaseModel):
    opportunity_type: str           # rising_interest | purchase_intent | high_value | closing_soon
    description: str
    count: int = 1
    affected_records: list[str] = Field(default_factory=list)


class RecentSummaryDetail(BaseModel):
    """Full detail for a single AI summary."""
    summary_id: UUID
    type: str
    title: str
    period: str
    priority: str
    generated_at: datetime
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    executive_summary: Optional[str] = None
    kpis: list[SummaryKPI] = Field(default_factory=list)
    related_leads: list[SummaryRelatedLead] = Field(default_factory=list)
    related_deals: list[SummaryRelatedDeal] = Field(default_factory=list)
    recommendations: list[SummaryRecommendation] = Field(default_factory=list)
    risks: list[SummaryRisk] = Field(default_factory=list)
    opportunities: list[SummaryOpportunity] = Field(default_factory=list)
    critical_insights: int = 0
    positive_trends: int = 0
    negative_trends: int = 0
    source_modules: list[str] = Field(default_factory=list)


# ── Daily summary payload ─────────────────────────────────────────────────────

class DailyAISummaryPayload(BaseModel):
    """Structured payload for a 'daily' summary type."""
    date: str                           # "2026-07-29"
    summary: str                        # human-readable sentence
    deals_won_today: int = 0
    deals_lost_today: int = 0
    new_leads: int = 0
    high_value_opportunities: int = 0
    follow_ups_completed: int = 0
    meetings_completed: int = 0
    calls_completed: int = 0
    emails_sent: int = 0
    ai_recommendations_generated: int = 0
    critical_alerts: int = 0
    revenue_won_today: float = 0.0


# ── Weekly summary payload ────────────────────────────────────────────────────

class WeeklyAISummaryPayload(BaseModel):
    """Structured payload for a 'weekly' summary type."""
    week_label: str                     # "Jul 21–27, 2026"
    pipeline_growth: float = 0.0        # % change
    conversion_rate: float = 0.0
    revenue_forecast: float = 0.0
    top_performers: list[str] = Field(default_factory=list)
    team_activities: int = 0
    high_risk_deals: int = 0
    new_opportunities: int = 0
    customer_engagement_trend: str = "Stable"
    deals_won: int = 0
    deals_lost: int = 0
    summary: str = ""


# ── Monthly summary payload ───────────────────────────────────────────────────

class MonthlyAISummaryPayload(BaseModel):
    """Structured payload for a 'monthly' summary type."""
    month_label: str                    # "July 2026"
    total_revenue: float = 0.0
    total_deals_won: int = 0
    total_deals_lost: int = 0
    pipeline_growth: float = 0.0
    ai_recommendations_executed: int = 0
    customer_sentiment_trend: str = "Stable"
    intent_trend: str = "Stable"
    overall_pipeline_health: float = 0.0
    summary: str = ""


# ── Executive summary payload ─────────────────────────────────────────────────

class ExecutiveSummaryPayload(BaseModel):
    """Structured payload for an 'executive' summary type."""
    title: str = "Executive Summary"
    text: str
    pipeline_status: str = "Healthy"
    critical_count: int = 0
    opportunity_count: int = 0
    generated_at: str = ""


# ── Timeline entry ────────────────────────────────────────────────────────────

class SummaryTimelineEntry(BaseModel):
    """One entry in the summary timeline response."""
    generated_at: datetime
    type: str
    title: str
    description: str
    summary_id: UUID
    priority: str
    period: str


# ── Summary stats (GET /recent-summaries/summary) ────────────────────────────

class RecentSummariesStatsResponse(BaseModel):
    """Aggregated KPI counts for the dashboard summary card."""
    daily_summaries: int        = Field(alias="dailySummaries")
    weekly_summaries: int       = Field(alias="weeklySummaries")
    monthly_summaries: int      = Field(alias="monthlySummaries")
    critical_insights: int      = Field(alias="criticalInsights")
    positive_trends: int        = Field(alias="positiveTrends")
    negative_trends: int        = Field(alias="negativeTrends")
    pending_recommendations: int = Field(alias="pendingRecommendations")
    executive_summaries: int    = Field(alias="executiveSummaries")
    total_summaries: int        = Field(alias="totalSummaries")

    model_config = {"populate_by_name": True}


# ── Notification item ─────────────────────────────────────────────────────────

class SummaryNotification(BaseModel):
    """A notification/alert generated from AI summaries."""
    summary_id: Optional[UUID] = None
    type: str       # new_executive | pipeline_health_change | critical_risk
                    # high_intent | weekly_ready | monthly_ready
    severity: str   # critical | high | medium | low
    title: str
    message: str
    generated_at: datetime


# ── AI Recommendation Summary (grouped by priority) ──────────────────────────

class RecommendationGroup(BaseModel):
    """A group of AI recommendations by priority."""
    priority: str
    count: int
    actions: list[str] = Field(default_factory=list)
    entity_names: list[str] = Field(default_factory=list)


class AIRecommendationSummaryResponse(BaseModel):
    """Aggregated recommendation summary grouped by priority."""
    total: int
    critical: RecommendationGroup
    high: RecommendationGroup
    medium: RecommendationGroup
    low: RecommendationGroup
    generated_at: datetime


# ── Risk summary ──────────────────────────────────────────────────────────────

class RiskSummaryResponse(BaseModel):
    """Aggregated risk summary across all AI modules."""
    total_risks: int
    critical_risks: int
    high_risks: int
    cold_leads: int
    negative_sentiment: int
    cancellation_risks: int
    pipeline_issues: int
    top_affected: list[str] = Field(default_factory=list)


# ── Opportunity summary ───────────────────────────────────────────────────────

class OpportunitySummaryResponse(BaseModel):
    """Aggregated opportunity summary across all AI modules."""
    total_opportunities: int
    rising_interest_leads: int
    purchase_intent_customers: int
    high_value_deals: int
    closing_this_week: int
    new_opportunities: int
    top_opportunities: list[str] = Field(default_factory=list)


# ── Performance summary ───────────────────────────────────────────────────────

class PerformanceSummaryResponse(BaseModel):
    """Aggregated activity performance summary."""
    meetings_completed: int
    calls_completed: int
    tasks_completed: int
    follow_ups_completed: int
    sales_activities: int
    ai_recommendations_completed: int
    completion_rate: float          # % of scheduled activities completed
    period_label: str               # "Today" | "This Week" | "This Month"


# ── Dashboard KPIs ────────────────────────────────────────────────────────────

class SummaryDashboardKPIs(BaseModel):
    """Top-level KPI counters for the recent summaries dashboard panel."""
    total_ai_summaries: int
    todays_summaries: int
    weekly_summaries: int
    monthly_summaries: int
    critical_insights: int
    positive_trends: int
    negative_trends: int
    pending_recommendations: int
