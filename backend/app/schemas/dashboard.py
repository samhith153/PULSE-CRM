"""
Dashboard and Analytics Schemas
"""
from datetime import datetime, date
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


class DashboardDealItem(BaseModel):
    id: UUID
    name: str
    status: str
    amount: Optional[Decimal] = None
    expected_close_date: Optional[str] = None


class DashboardOpenDealsCard(BaseModel):
    count: int
    recent_deals: list[DashboardDealItem] = Field(default_factory=list)


class DashboardUntouchedDealsCard(BaseModel):
    count: int
    threshold_days: int
    deal_ids: list[UUID] = Field(default_factory=list)


class DashboardLeadsCard(BaseModel):
    count: int


class DashboardCallsTodayCard(BaseModel):
    count: int
    pending: int = 0
    completed: int = 0
    total: int = 0


class DashboardTaskItem(BaseModel):
    id: UUID
    title: str
    due_date: datetime
    priority: str
    status: str
    overdue: bool
    fit_score: Optional[int] = None


class DashboardTasksCard(BaseModel):
    count: int
    today: int = 0
    upcoming: int = 0
    overdue: int = 0
    items: list[DashboardTaskItem] = Field(default_factory=list)


class DashboardMeetingItem(BaseModel):
    id: UUID
    title: str
    start_datetime: datetime
    end_datetime: datetime
    status: str
    meeting_link: Optional[str] = None
    location: Optional[str] = None


class DashboardMeetingsCard(BaseModel):
    count: int
    today: list[DashboardMeetingItem] = Field(default_factory=list)
    upcoming: list[DashboardMeetingItem] = Field(default_factory=list)


class DashboardPriorityQueueItem(BaseModel):
    task_id: UUID
    title: str
    priority_score: int
    label: str = "Task"
    reason: Optional[str] = None
    reasons: list[str] = Field(default_factory=list)
    due_date: datetime
    overdue: bool


class DashboardPriorityQueueCard(BaseModel):
    items: list[DashboardPriorityQueueItem] = Field(default_factory=list)


class DashboardDealRiskItem(BaseModel):
    deal_id: UUID
    deal_name: str
    risk_score: int
    risk_reason: str
    risk_level: str = "low"
    last_activity_at: Optional[datetime] = None
    days_since_activity: Optional[int] = None
    amount: Optional[Decimal] = None
    company_name: Optional[str] = None


class DashboardDealsAtRiskCard(BaseModel):
    items: list[DashboardDealRiskItem] = Field(default_factory=list)


class DashboardQuotaCard(BaseModel):
    target: Optional[Decimal] = None
    achieved: Decimal
    expected: Optional[Decimal] = None
    gap_to_goal: Decimal = Decimal("0")
    percentage: Optional[Decimal] = None
    won_deals: int = 0
    average_deal_size: Decimal = Decimal("0")
    status: str


class DashboardPipelineStage(BaseModel):
    label: str
    count: int
    conversion_percentage: Decimal


class DashboardPipelineFunnelCard(BaseModel):
    stages: list[DashboardPipelineStage] = Field(default_factory=list)


class DashboardWorkSummaryCard(BaseModel):
    total: int
    completed: int
    completion_percentage: Decimal


class RedesignedDashboardResponse(BaseModel):
    open_deals: DashboardOpenDealsCard = Field(alias="openDeals")
    untouched_deals: DashboardUntouchedDealsCard = Field(alias="untouchedDeals")
    calls_today: DashboardCallsTodayCard = Field(alias="callsToday")
    my_leads: DashboardLeadsCard = Field(alias="myLeads")
    tasks: DashboardTasksCard
    meetings: DashboardMeetingsCard
    priority_queue: DashboardPriorityQueueCard = Field(alias="priorityQueue")
    deals_at_risk: DashboardDealsAtRiskCard = Field(alias="dealsAtRisk")
    quota: DashboardQuotaCard
    pipeline_funnel: DashboardPipelineFunnelCard = Field(alias="pipelineFunnel")
    todays_work_summary: DashboardWorkSummaryCard = Field(alias="todaysWorkSummary")
    last_updated: datetime = Field(alias="lastUpdated")

    model_config = {"populate_by_name": True}

# -----------------------------------------------------------------------------
# Admin Dashboard KPI Schemas
# -----------------------------------------------------------------------------

class AdminOrganizationStats(BaseModel):
    total: int
    added_this_month: int
    monthly_growth_pct: Decimal


class AdminUserStats(BaseModel):
    total: int
    active: int
    inactive: int
    new_this_month: int


class AdminCompanyStats(BaseModel):
    total: int
    added_this_month: int
    monthly_growth_pct: Decimal


class AdminContactStats(BaseModel):
    total: int
    new_this_month: int
    monthly_growth_pct: Decimal


class AdminLeadStats(BaseModel):
    total: int
    new_today: int
    new_this_month: int
    monthly_growth_pct: Decimal
    converted: int
    conversion_rate: Decimal


class AdminRevenueStats(BaseModel):
    today: Decimal
    this_week: Decimal
    this_month: Decimal
    this_year: Decimal
    growth_pct: Decimal


class AdminTaskStats(BaseModel):
    pending: int
    overdue: int
    due_today: int


class AdminMonthlySalesPoint(BaseModel):
    month: str
    leads_created: int
    leads_converted: int
    revenue: Decimal


class AdminLeadSourceBreakdown(BaseModel):
    source: str
    count: int
    percentage: Decimal


class AdminLeadFunnelStage(BaseModel):
    stage: str
    count: int
    percentage: Decimal


class AdminTopSalesRep(BaseModel):
    user_id: UUID
    full_name: str
    deals_closed: int
    revenue: Decimal
    conversion_rate: Decimal


class AdminTopCompany(BaseModel):
    company_id: UUID
    name: str
    revenue: Decimal
    lead_count: int
    contact_count: int


class AdminRecentActivity(BaseModel):
    id: UUID
    action: str
    title: str
    entity_type: str
    created_at: datetime
    created_by: Optional[UUID]


class AdminNotificationSummary(BaseModel):
    overdue_tasks: int
    todays_meetings: int
    pending_approvals: int
    high_priority_leads: int
    system_alerts: int


class AdminDashboardSummary(BaseModel):
    organizations: AdminOrganizationStats
    users: AdminUserStats
    companies: AdminCompanyStats
    contacts: AdminContactStats
    leads: AdminLeadStats
    revenue: AdminRevenueStats
    tasks: AdminTaskStats


class AdminMetricAvailability(BaseModel):
    value: Optional[Decimal | int | str] = None
    available: bool = False
    reason: str


class AdminOverviewMetric(BaseModel):
    current_value: Decimal
    previous_value: Decimal
    percentage_change: Decimal


class AdminOverviewCards(BaseModel):
    revenue_month: AdminOverviewMetric
    active_users: AdminOverviewMetric
    companies: AdminOverviewMetric
    new_leads: AdminOverviewMetric


class AdminRevenueTrendPoint(BaseModel):
    month: str
    revenue: Decimal
    lead_count: int


class AdminRevenueLeadSummary(BaseModel):
    revenue_year: Decimal
    converted_leads: int
    contacts: int
    tasks_pending: int


class AdminRoleDistributionItem(BaseModel):
    role: str
    count: int


class AdminUserManagement(BaseModel):
    active_seats: int
    invites_pending: Optional[int] = None
    invites_pending_state: Optional[AdminMetricAvailability] = None
    role_distribution: list[AdminRoleDistributionItem] = Field(default_factory=list)


class AdminServiceHealthItem(BaseModel):
    service: str
    status: str
    message: Optional[str] = None


class AdminSystemHealth(BaseModel):
    services: list[AdminServiceHealthItem] = Field(default_factory=list)
    critical_logs_24h: Optional[int] = None
    critical_logs_24h_state: Optional[AdminMetricAvailability] = None
    warning_logs_24h: Optional[int] = None
    warning_logs_24h_state: Optional[AdminMetricAvailability] = None


class AdminDataQuality(BaseModel):
    duplicates_detected: int
    incomplete_fields: int
    orphaned_leads: int


class AdminLicenseUsage(BaseModel):
    storage_used: Optional[int] = None
    storage_used_state: Optional[AdminMetricAvailability] = None
    storage_limit: Optional[int] = None
    storage_limit_state: Optional[AdminMetricAvailability] = None
    active_seats: int
    seat_limit: Optional[int] = None
    usage_percentage: Optional[Decimal] = None


class AdminAuditLogItem(BaseModel):
    event_type: str
    description: Optional[str] = None
    performed_by: Optional[str] = None
    timestamp: datetime
    ip_address: Optional[str] = None
    metadata: Optional[dict] = None


class AdminIntegrationStatus(BaseModel):
    integration: str
    status: str
    last_sync: Optional[datetime] = None
    message: Optional[str] = None


class AdminCustomWorkflowStats(BaseModel):
    custom_fields_active: Optional[int] = None
    custom_fields_active_state: Optional[AdminMetricAvailability] = None
    custom_fields_idle: Optional[int] = None
    custom_fields_idle_state: Optional[AdminMetricAvailability] = None
    automations_active: int
    automations_idle: int
    lead_scoring_usage: int


class AdminSecurityStats(BaseModel):
    failed_logins_24h: Optional[int] = None
    failed_logins_24h_state: Optional[AdminMetricAvailability] = None
    active_api_keys: Optional[int] = None
    active_api_keys_state: Optional[AdminMetricAvailability] = None
    unusual_exports: int
    security_status: str


class AdminDashboardResponse(BaseModel):
    summary: AdminDashboardSummary
    overview: Optional[AdminOverviewCards] = None
    revenue_trend: list[AdminRevenueTrendPoint] = Field(default_factory=list)
    revenue_lead_summary: Optional[AdminRevenueLeadSummary] = None
    monthly_sales: list[AdminMonthlySalesPoint] = Field(default_factory=list)
    lead_sources: list[AdminLeadSourceBreakdown] = Field(default_factory=list)
    lead_funnel: list[AdminLeadFunnelStage] = Field(default_factory=list)
    user_management: Optional[AdminUserManagement] = None
    system_health: Optional[AdminSystemHealth] = None
    data_quality: Optional[AdminDataQuality] = None
    license_usage: Optional[AdminLicenseUsage] = None
    audit_logs: list[AdminAuditLogItem] = Field(default_factory=list)
    integrations: list[AdminIntegrationStatus] = Field(default_factory=list)
    custom_fields: Optional[AdminCustomWorkflowStats] = None
    security: Optional[AdminSecurityStats] = None
    top_sales_reps: list[AdminTopSalesRep] = Field(default_factory=list)
    top_companies: list[AdminTopCompany] = Field(default_factory=list)
    recent_activities: list[AdminRecentActivity] = Field(default_factory=list)
    notifications: AdminNotificationSummary = Field(
        default_factory=lambda: AdminNotificationSummary(
            overdue_tasks=0,
            todays_meetings=0,
            pending_approvals=0,
            high_priority_leads=0,
            system_alerts=0,
        )
    )
    generated_at: datetime


# -----------------------------------------------------------------------------
# Manager Dashboard KPI Schemas
# -----------------------------------------------------------------------------

class ManagerRevenueStats(BaseModel):
    team_revenue_won: Decimal
    team_target: Decimal
    achievement_pct: Decimal
    monthly_growth_pct: Decimal


class ManagerForecastStats(BaseModel):
    projected_revenue: Decimal
    forecast_accuracy: Decimal
    confidence_score: Decimal
    expected_quarter_revenue: Decimal


class ManagerPipelineHealth(BaseModel):
    active_pipeline_value: Decimal
    total_deals: int
    health_score: Decimal
    stage_distribution: list["ManagerPipelineStage"] = Field(default_factory=list)


class ManagerPipelineStage(BaseModel):
    stage: str
    deal_count: int
    total_value: Decimal
    percentage: Decimal


ManagerPipelineHealth.model_rebuild()


class RepQuotaAttainment(BaseModel):
    user_id: UUID
    full_name: str
    assigned_target: Decimal
    revenue_generated: Decimal
    quota_achievement_pct: Decimal
    rank: int


class ManagerMonthlyRevenue(BaseModel):
    month: str
    revenue: Decimal
    target: Decimal
    growth_pct: Decimal


class ManagerTopRep(BaseModel):
    user_id: UUID
    full_name: str
    revenue: Decimal
    deals_closed: int
    conversion_rate: Decimal
    quota_achievement_pct: Decimal


class DealAtRisk(BaseModel):
    deal_id: UUID
    deal_name: str
    company: Optional[str]
    owner_name: Optional[str]
    deal_value: Decimal
    risk_reason: str
    days_since_last_activity: int


class ManagerAlert(BaseModel):
    severity: str           # "high" | "medium" | "low"
    message: str
    timestamp: datetime


class ManagerRecentActivity(BaseModel):
    id: UUID
    action: str
    title: str
    entity_type: str
    created_at: datetime
    created_by: Optional[UUID]


class ManagerTeamMetrics(BaseModel):
    total_members: int
    active_reps: int
    avg_deal_size: Decimal
    avg_sales_cycle_days: Decimal
    team_conversion_rate: Decimal
    win_rate: Decimal
    forecast_accuracy: Decimal


class ManagerDashboardSummary(BaseModel):
    team_revenue: Decimal
    forecast_projection: Decimal
    pipeline_value: Decimal
    quota_achievement: Decimal
    team_members: int
    conversion_rate: Decimal
    win_rate: Decimal
    average_sales_cycle: Decimal


class ManagerDashboardResponse(BaseModel):
    summary: ManagerDashboardSummary
    revenue_stats: ManagerRevenueStats
    forecast: ManagerForecastStats
    pipeline_health: ManagerPipelineHealth
    rep_quota_attainment: list[RepQuotaAttainment] = Field(default_factory=list)
    monthly_revenue_trend: list[ManagerMonthlyRevenue] = Field(default_factory=list)
    top_reps: list[ManagerTopRep] = Field(default_factory=list)
    deals_at_risk: list[DealAtRisk] = Field(default_factory=list)
    alerts: list[ManagerAlert] = Field(default_factory=list)
    recent_activities: list[ManagerRecentActivity] = Field(default_factory=list)
    team_metrics: ManagerTeamMetrics
    generated_at: datetime


# -----------------------------------------------------------------------------
# Sales Representative Dashboard KPI Schemas
# -----------------------------------------------------------------------------

class RepRevenueStat(BaseModel):
    total: Decimal
    previous_period: Decimal
    growth_pct: Decimal


class RepWonDealsStat(BaseModel):
    count: int
    previous_period: int
    growth_pct: Decimal


class RepWinRateStat(BaseModel):
    win_rate: Decimal
    previous_win_rate: Decimal
    growth_pct: Decimal


class RepAvgDealSizeStat(BaseModel):
    avg_deal_value: Decimal
    previous_avg: Decimal
    growth_pct: Decimal


class RepAvgSalesCycleStat(BaseModel):
    avg_days: Decimal
    previous_avg_days: Decimal
    difference_days: Decimal


class RepRevenuePoint(BaseModel):
    period: str
    revenue: Decimal


class RepDealByStage(BaseModel):
    stage: str
    count: int
    percentage: Decimal
    conversion_rate: Decimal


class RepDealBySource(BaseModel):
    source: str
    count: int
    percentage: Decimal
    revenue: Decimal


class RepRevenueByCompanySize(BaseModel):
    size_bucket: str
    revenue: Decimal
    percentage: Decimal


class RepActivityHeatmapPoint(BaseModel):
    date: str
    activity_type: str
    count: int
    intensity: str       # "low" | "medium" | "high"


class RepTeamPerformanceRow(BaseModel):
    user_id: UUID
    full_name: str
    revenue: Decimal
    won_deals: int
    win_rate: Decimal


class RepActivityOverview(BaseModel):
    emails_sent: int
    calls_made: int
    meetings_held: int
    tasks_completed: int
    notes_added: int
    emails_growth_pct: Decimal
    calls_growth_pct: Decimal
    meetings_growth_pct: Decimal
    tasks_growth_pct: Decimal


class RepKeyMetrics(BaseModel):
    open_deals: int
    pipeline_value: Decimal
    deals_created: int
    deals_lost: int
    activities_logged: int
    pipeline_value_growth_pct: Decimal
    deals_created_growth_pct: Decimal
    activities_growth_pct: Decimal


class RepRecentReport(BaseModel):
    report_name: str
    created_at: datetime
    created_by: Optional[str]
    report_type: str


class RepReportTemplate(BaseModel):
    name: str
    description: str
    primary_metrics: list[str]
    group_by_options: list[str]


class SalesRepDashboardSummary(BaseModel):
    total_revenue: Decimal
    won_deals: int
    win_rate: Decimal
    average_deal_size: Decimal
    average_sales_cycle: Decimal


class SalesRepDashboardResponse(BaseModel):
    summary: SalesRepDashboardSummary
    revenue_stat: RepRevenueStat
    won_deals_stat: RepWonDealsStat
    win_rate_stat: RepWinRateStat
    avg_deal_size_stat: RepAvgDealSizeStat
    avg_sales_cycle_stat: RepAvgSalesCycleStat
    revenue_trend: list[RepRevenuePoint] = Field(default_factory=list)
    deals_by_stage: list[RepDealByStage] = Field(default_factory=list)
    deals_by_source: list[RepDealBySource] = Field(default_factory=list)
    revenue_by_company_size: list[RepRevenueByCompanySize] = Field(default_factory=list)
    activity_heatmap: list[RepActivityHeatmapPoint] = Field(default_factory=list)
    team_performance: list[RepTeamPerformanceRow] = Field(default_factory=list)
    activity_overview: RepActivityOverview
    key_metrics: RepKeyMetrics
    recent_reports: list[RepRecentReport] = Field(default_factory=list)
    report_templates: list[RepReportTemplate] = Field(default_factory=list)
    generated_at: datetime


# -----------------------------------------------------------------------------
# Sales Command Center (6 Core Widgets + Top KPIs)
# -----------------------------------------------------------------------------

class RepDashboardKPIs(BaseModel):
    """Top 4 Stat Cards for Individual Sales Reps."""
    open_deals: int = Field(default=0, description="Total open deals owned by rep")
    untouched_deals: int = Field(default=0, description="Deals with no activity in >5 days")
    calls_today: int = Field(default=0, description="Phone/call activities logged today")
    leads_assigned: int = Field(default=0, description="Total active leads assigned to rep")


class RepQuotaPace(BaseModel):
    """Widget 5: Live Quota Progress vs Target."""
    closed_won_revenue: Decimal = Field(default=Decimal("0.00"), description="Closed won revenue this month/quarter")
    target_revenue: Decimal = Field(default=Decimal("50000.00"), description="Target quota set for rep")
    attained_percentage: Decimal = Field(default=Decimal("0.0"), description="Percentage of quota completed")
    pace_status: str = Field(default="Behind Pace", description="'On Pace' | 'Behind Pace' | 'Ahead of Pace'")


class RepTaskItem(BaseModel):
    """Widget 1: My Tasks Today (AI-extracted & manual)."""
    id: UUID
    title: str
    due_date: date
    status: str  # "pending" | "completed" | "overdue"
    source: Optional[str] = "manual"  # "ai_extracted" | "manual"
    lead_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None


class RepMeetingItem(BaseModel):
    """Widget 2: My Meetings Today."""
    id: UUID
    title: str
    start_time: datetime
    end_time: datetime
    zoom_link: Optional[str] = None
    contact_name: Optional[str] = None
    transcript_status: Optional[str] = "pending"  # "pending" | "processing" | "completed"


class RepPriorityLeadItem(BaseModel):
    """Widget 3: Priority Leads (Fit + Engagement Score >= 70)."""
    lead_id: UUID
    first_name: str
    last_name: str
    company_name: Optional[str] = None
    email: str
    score: int
    tier: str  # "Hot" | "Warm" | "Cold"
    top_reason: Optional[str] = None  # e.g., "+25 Demo Requested"
    top_reasons: Optional[list[str]] = None  # full AI reasoning list from lead_scores


class RepDealAtRiskItem(BaseModel):
    """Widget 4: At-Risk Deals (Stalled > 5 Days or Negative Sentiment)."""
    deal_id: UUID
    deal_title: str
    value: Decimal
    stalled_days: int
    risk_reason: str  # "Stalled >5 Days" | "Negative Buyer Sentiment"
    sentiment: Optional[str] = None  # "positive" | "neutral" | "negative"
    probability: Optional[int] = None  # stored Deal.probability (win likelihood %)
    company_name: Optional[str] = None
    owner_name: Optional[str] = None


class RepQuickCaptureRequest(BaseModel):
    """Widget 6: Quick Log / Capture (Ctrl+K Hotkey)."""
    entry_type: str  # "quick_note" | "create_lead" | "log_call"
    content: str
    lead_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None


class RepQuickCaptureResponse(BaseModel):
    status: str = "success"
    message: str
    created_id: Optional[UUID] = None


class SalesRepCommandDashboardResponse(BaseModel):
    """
    Unified Payload returned by GET /api/v1/dashboard/me 
    Hydrates all 6 core widgets + 4 top KPI cards in 1 single HTTP request.
    """
    kpis: RepDashboardKPIs
    open_tasks: list[RepTaskItem] = Field(default_factory=list)
    meetings_today: list[RepMeetingItem] = Field(default_factory=list)
    priority_queue: list[RepPriorityLeadItem] = Field(default_factory=list)
    deals_at_risk: list[RepDealAtRiskItem] = Field(default_factory=list)
    quota_pace: RepQuotaPace
    generated_at: datetime
