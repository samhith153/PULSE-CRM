"""
AI Insights Routes
GET /api/v1/ai-insights/action-center            — full action center
GET /api/v1/ai-insights/pipeline-health          — pipeline health only
GET /api/v1/ai-insights/immediate-actions
GET /api/v1/ai-insights/follow-ups
GET /api/v1/ai-insights/risks
GET /api/v1/ai-insights/opportunities
GET /api/v1/ai-insights/high-value-deals
GET /api/v1/ai-insights/summary
GET /api/v1/ai-insights/notifications
GET /api/v1/ai-insights/recommendations
GET /api/v1/ai-insights/going-cold               — Going Cold Detection
GET /api/v1/ai-insights/going-cold/summary
GET /api/v1/ai-insights/going-cold/notifications
GET /api/v1/ai-insights/daily-priorities         — Daily Priorities
GET /api/v1/ai-insights/daily-priorities/summary
GET /api/v1/ai-insights/daily-priorities/notifications
GET /api/v1/ai-insights/conversation-intelligence           — Conversation Intelligence
GET /api/v1/ai-insights/conversation-intelligence/summary
GET /api/v1/ai-insights/conversation-intelligence/timeline
GET /api/v1/ai-insights/conversation-intelligence/notifications
GET /api/v1/ai-insights/conversation-intelligence/{id}

All require: JWT + manager / admin role
(sales_rep scope resolved inside services for going-cold, daily-priorities
 and conversation-intelligence).
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import CurrentUser, DBSession, require_permission, require_role
from app.controllers.ai_insights_controller import AIInsightsController
from app.schemas.ai_insights import (
    ActionCenterResponse,
    AIRecommendationItem,
    ConversationDetailResponse,
    ConversationIntelligenceSummaryResponse,
    ConversationItem,
    ConversationListResponse,
    ConversationNotification,
    ConversationTimelineEntry,
    DailyPrioritiesListResponse,
    DailyPriorityNotification,
    DailyPrioritiesSummaryResponse,
    DailySummaryResponse,
    FollowUpDueItem,
    GoingColdListResponse,
    GoingColdNotification,
    GoingColdSummaryResponse,
    HighValueDealItem,
    ImmediateActionItem,
    IntentItem,
    IntentListResponse,
    IntentNotification,
    IntentSummaryResponse,
    IntentTimelinePoint,
    NotificationAlert,
    OpportunityScoreItem,
    PipelineHealthResponse,
    RiskItem,
    SentimentItem,
    SentimentListResponse,
    SentimentMoodPoint,
    SentimentNotification,
    SentimentSummaryResponse,
)
from app.schemas.common import StandardResponse
from app.schemas.sales_rep_ai_insights import SalesRepAIInsightsResponse

# ── Router for manager + admin only endpoints ─────────────────────────────────
router = APIRouter(dependencies=[Depends(require_role("manager", "admin"))])

# ── Separate router for endpoints also accessible by sales_rep ───────────────
# FastAPI adds router-level dependencies on top of route-level ones, so to allow
# sales_rep we must use a router that does NOT carry the manager/admin gate.
_all_roles_router = APIRouter(
    dependencies=[Depends(require_role("admin", "manager", "sales_rep"))]
)


# ═══════════════════════════════════════════════════════════════════════════════
# Sales Rep Unified AI Insights Endpoint
# One request loads the entire AI Insights page for a Sales Representative.
# RBAC: admin | manager | sales_rep (data scoped per role inside service)
# ═══════════════════════════════════════════════════════════════════════════════

@_all_roles_router.get(
    "/sales-rep",
    response_model=StandardResponse[SalesRepAIInsightsResponse],
    summary="Sales Rep AI Insights — unified page payload",
    description=(
        "Returns all data required by the Sales Representative AI Insights page "
        "in a single request:\n\n"
        "- **AI Action Center**: Immediate Action, Follow Up Due, Rising Interest, Going Cold\n"
        "- **Pipeline Health Index**: Deterministic score 0–100\n"
        "- **Daily Priorities**: AI-ranked personalized action list\n"
        "- **Conversation Intelligence**: Sentiment Breakdown, Intent Distribution, "
        "Recent Summaries\n\n"
        "All data is derived from real CRM records. No mock data. "
        "Empty sections are returned as empty arrays when no data exists.\n\n"
        "**RBAC:** Sales Rep=own leads, Manager=team, Admin=org-wide."
    ),
    tags=["AI Insights"],
)
async def get_sales_rep_insights(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """
    GET /api/v1/ai-insights/sales-rep

    JWT required. Single request that populates the entire AI Insights page.
    Each section degrades gracefully — if one fails, the others still return.
    """
    from app.services.sales_rep_ai_insights_service import SalesRepAIInsightsService
    svc = SalesRepAIInsightsService(db)
    data = await svc.get_sales_rep_insights(current_user)
    return {
        "success": True,
        "message": "Sales Rep AI Insights data retrieved.",
        "data": data,
    }


# ── Full action center ────────────────────────────────────────────────────────

@router.get(
    "/action-center",
    response_model=StandardResponse[ActionCenterResponse],
    summary="AI Action Center — full KPI payload",
    description=(
        "Returns all AI Insights KPIs: immediate actions, overdue follow-ups, "
        "pipeline health index, daily summary, high-value deals, risk detection, "
        "opportunity scores, AI recommendations, and notification alerts. "
        "**Manager or Admin role required.** Scoped to the caller's organisation."
    ),
    tags=["AI Insights"],
)
async def get_action_center(
    current_user: CurrentUser,
    db: DBSession,
    date_filter: Optional[str] = Query(
        default=None,
        description="today | week | month"
    ),
    priority: Optional[str] = Query(
        default=None,
        description="Filter immediate actions by priority: p1 | critical | high | medium | low",
    ),
) -> dict:
    ctrl = AIInsightsController(db)
    data = await ctrl.get_action_center(
        current_user,
        date_filter=date_filter,
        priority_filter=priority,
    )
    return {"success": True, "message": "AI Action Center data retrieved.", "data": data}


# ── Pipeline health only ──────────────────────────────────────────────────────

@router.get(
    "/pipeline-health",
    response_model=StandardResponse[PipelineHealthResponse],
    summary="Pipeline Health Index",
    tags=["AI Insights"],
)
async def get_pipeline_health(current_user: CurrentUser, db: DBSession) -> dict:
    from app.repositories.ai_insights_repository import AIInsightsRepository
    from app.services.ai_insights_service import AIInsightsService
    svc  = AIInsightsService(db)
    repo = AIInsightsRepository(db)
    user_id, team_ids = await svc._scope(current_user)
    components = await repo.get_pipeline_health_components(
        current_user.organization_id, user_id, team_ids
    )
    health = svc._compute_health(components)
    return {"success": True, "message": "Pipeline health retrieved.", "data": health}


# ── Immediate actions ─────────────────────────────────────────────────────────

@router.get(
    "/immediate-actions",
    response_model=StandardResponse[list[ImmediateActionItem]],
    summary="Immediate actions requiring urgent attention",
    tags=["AI Insights"],
)
async def get_immediate_actions(current_user: CurrentUser, db: DBSession) -> dict:
    from app.repositories.ai_insights_repository import AIInsightsRepository
    from app.services.ai_insights_service import AIInsightsService
    svc  = AIInsightsService(db)
    repo = AIInsightsRepository(db)
    user_id, team_ids = await svc._scope(current_user)
    raw = await repo.get_immediate_actions(current_user.organization_id, user_id, team_ids)
    data = [ImmediateActionItem(**a) for a in raw]
    return {"success": True, "message": "Immediate actions retrieved.", "data": data}


# ── Follow-ups ────────────────────────────────────────────────────────────────

@router.get(
    "/follow-ups",
    response_model=StandardResponse[list[FollowUpDueItem]],
    summary="Overdue follow-ups",
    tags=["AI Insights"],
)
async def get_followups(current_user: CurrentUser, db: DBSession) -> dict:
    from app.repositories.ai_insights_repository import AIInsightsRepository
    from app.services.ai_insights_service import AIInsightsService
    svc  = AIInsightsService(db)
    repo = AIInsightsRepository(db)
    user_id, team_ids = await svc._scope(current_user)
    raw = await repo.get_overdue_followups(current_user.organization_id, user_id, team_ids)
    data = [FollowUpDueItem(**f) for f in raw]
    return {"success": True, "message": "Follow-ups retrieved.", "data": data}


# ── Risk detection ────────────────────────────────────────────────────────────

@router.get(
    "/risks",
    response_model=StandardResponse[list[RiskItem]],
    summary="Risky deals — no activity, low probability, overdue",
    tags=["AI Insights"],
)
async def get_risks(current_user: CurrentUser, db: DBSession) -> dict:
    from app.repositories.ai_insights_repository import AIInsightsRepository
    from app.services.ai_insights_service import AIInsightsService
    svc  = AIInsightsService(db)
    repo = AIInsightsRepository(db)
    user_id, team_ids = await svc._scope(current_user)
    raw = await repo.get_risky_deals(current_user.organization_id, user_id, team_ids)
    data = [RiskItem(**r) for r in raw]
    return {"success": True, "message": "Risk items retrieved.", "data": data}


# ── Opportunity scores ────────────────────────────────────────────────────────

@router.get(
    "/opportunities",
    response_model=StandardResponse[list[OpportunityScoreItem]],
    summary="Opportunity scores (lead 40% + prob 30% + activity 20% + size 10%)",
    tags=["AI Insights"],
)
async def get_opportunities(
    current_user: CurrentUser,
    db: DBSession,
    limit: int = Query(default=15, ge=1, le=50),
) -> dict:
    from app.repositories.ai_insights_repository import AIInsightsRepository
    from app.services.ai_insights_service import AIInsightsService
    svc  = AIInsightsService(db)
    repo = AIInsightsRepository(db)
    user_id, team_ids = await svc._scope(current_user)
    raw = await repo.get_opportunity_scores(current_user.organization_id, user_id, team_ids, limit=limit)
    data = [OpportunityScoreItem(**o) for o in raw]
    return {"success": True, "message": "Opportunity scores retrieved.", "data": data}


# ── High-value deals ──────────────────────────────────────────────────────────

@router.get(
    "/high-value-deals",
    response_model=StandardResponse[list[HighValueDealItem]],
    summary="High-value deals (≥ ₹5L)",
    tags=["AI Insights"],
)
async def get_high_value_deals(current_user: CurrentUser, db: DBSession) -> dict:
    from app.repositories.ai_insights_repository import AIInsightsRepository
    from app.services.ai_insights_service import AIInsightsService
    svc  = AIInsightsService(db)
    repo = AIInsightsRepository(db)
    user_id, team_ids = await svc._scope(current_user)
    raw = await repo.get_high_value_deals(current_user.organization_id, user_id, team_ids)
    data = [HighValueDealItem(**h) for h in raw]
    return {"success": True, "message": "High-value deals retrieved.", "data": data}


# ── Daily summary ─────────────────────────────────────────────────────────────

@router.get(
    "/summary",
    response_model=StandardResponse[DailySummaryResponse],
    summary="Daily activity summary",
    tags=["AI Insights"],
)
async def get_daily_summary(current_user: CurrentUser, db: DBSession) -> dict:
    from app.repositories.ai_insights_repository import AIInsightsRepository
    from app.services.ai_insights_service import AIInsightsService
    svc  = AIInsightsService(db)
    repo = AIInsightsRepository(db)
    user_id, team_ids = await svc._scope(current_user)
    raw = await repo.get_daily_summary(current_user.organization_id, user_id, team_ids)
    data = DailySummaryResponse(
        urgentDeals=raw["urgent_deals"],
        followUps=raw["follow_ups"],
        meetings=raw["meetings"],
        calls=raw["calls"],
        closingThisWeek=raw["closing_this_week"],
        highValueOpportunities=raw["high_value_opportunities"],
    )
    return {"success": True, "message": "Daily summary retrieved.", "data": data}


# ── Notifications ─────────────────────────────────────────────────────────────

@router.get(
    "/notifications",
    response_model=StandardResponse[list[NotificationAlert]],
    summary="AI-generated notification alerts",
    tags=["AI Insights"],
)
async def get_notifications(current_user: CurrentUser, db: DBSession) -> dict:
    from app.repositories.ai_insights_repository import AIInsightsRepository
    from app.services.ai_insights_service import AIInsightsService
    svc  = AIInsightsService(db)
    repo = AIInsightsRepository(db)
    user_id, team_ids = await svc._scope(current_user)
    components = await repo.get_pipeline_health_components(
        current_user.organization_id, user_id, team_ids
    )
    health = svc._compute_health(components)
    raw = await repo.get_notification_triggers(
        current_user.organization_id, user_id, team_ids, health.score
    )
    data = [NotificationAlert(**n) for n in raw]
    return {"success": True, "message": "Notifications retrieved.", "data": data}


# ── Recommendations ───────────────────────────────────────────────────────────

@router.get(
    "/recommendations",
    response_model=StandardResponse[list[AIRecommendationItem]],
    summary="Dynamic AI recommendations per deal/lead",
    tags=["AI Insights"],
)
async def get_recommendations(current_user: CurrentUser, db: DBSession) -> dict:
    ctrl = AIInsightsController(db)
    full = await ctrl.get_action_center(current_user)
    return {
        "success": True,
        "message": "Recommendations retrieved.",
        "data": full.recommendations,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Going Cold Detection Endpoints
# Access: manager + admin via router-level dependency.
# Sales reps can call these too — RBAC scope handled in the service.
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/going-cold",
    response_model=StandardResponse[GoingColdListResponse],
    summary="Going Cold Detection — identify leads/deals losing engagement",
    description=(
        "Detects leads and deals that are becoming inactive using a "
        "multi-factor Cold Score (0-100):\n"
        "- **30%** No-activity days\n"
        "- **20%** Missed follow-ups\n"
        "- **15%** No email replies\n"
        "- **15%** Missed meetings\n"
        "- **10%** Probability drop\n"
        "- **10%** Deal aging\n\n"
        "Risk levels: Critical (90+) | High Risk (75-89) | "
        "Medium Risk (50-74) | Low Risk (25-49) | Healthy (<25)\n\n"
        "Supports filtering by owner, industry, pipeline stage, date range, "
        "minimum risk level, and pagination. "
        "**RBAC:** Admin=org-wide, Manager=team, Sales Rep=own leads."
    ),
    tags=["AI Insights"],
)
async def get_going_cold(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="limit"),
    owner_id: Optional[UUID] = Query(default=None, description="Filter by owner user ID"),
    industry: Optional[str] = Query(default=None, description="Filter by industry (partial match)"),
    pipeline_stage: Optional[str] = Query(default=None, description="Filter by pipeline stage name"),
    date_from: Optional[datetime] = Query(default=None, description="Filter leads created after this date"),
    date_to: Optional[datetime] = Query(default=None, description="Filter leads created before this date"),
    minimum_risk: Optional[str] = Query(
        default=None,
        description="Minimum risk threshold: critical | high risk | medium risk | low risk | healthy",
    ),
    sort: str = Query(
        default="cold_score",
        description="Sort field: cold_score | days_inactive | deal_value",
    ),
) -> dict:
    """
    GET /api/v1/ai-insights/going-cold

    JWT required. RBAC scope resolved from caller's role.
    Zero values returned when no data exists — never 500.
    """
    from app.services.going_cold_service import GoingColdService
    svc = GoingColdService(db)
    data = await svc.get_going_cold(
        current_user,
        page=page,
        page_size=page_size,
        owner_id=owner_id,
        industry=industry,
        pipeline_stage=pipeline_stage,
        date_from=date_from,
        date_to=date_to,
        minimum_risk=minimum_risk,
        sort=sort,
    )
    return {"success": True, "message": "Going Cold data retrieved.", "data": data}


@router.get(
    "/going-cold/summary",
    response_model=StandardResponse[GoingColdSummaryResponse],
    summary="Going Cold Dashboard KPIs",
    description=(
        "Returns aggregated cold-lead KPIs: critical / high-risk / medium-risk counts, "
        "average cold score, inactive customers, overdue follow-ups, "
        "recovery rate, and deals re-engaged this month."
    ),
    tags=["AI Insights"],
)
async def get_going_cold_summary(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """GET /api/v1/ai-insights/going-cold/summary"""
    from app.services.going_cold_service import GoingColdService
    svc = GoingColdService(db)
    data = await svc.get_summary(current_user)
    return {"success": True, "message": "Going Cold summary retrieved.", "data": data}


@router.get(
    "/going-cold/notifications",
    response_model=StandardResponse[list[GoingColdNotification]],
    summary="Going Cold — auto-generated notification alerts",
    description=(
        "Generates alerts when:\n"
        "- Cold score exceeds 85\n"
        "- No activity for 14+ days\n"
        "- Deal enters Critical risk\n"
        "- Follow-up overdue by 7+ days\n"
        "- Deal probability drops below 25%"
    ),
    tags=["AI Insights"],
)
async def get_going_cold_notifications(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """GET /api/v1/ai-insights/going-cold/notifications"""
    from app.services.going_cold_service import GoingColdService
    svc = GoingColdService(db)
    data = await svc.get_notifications(current_user)
    return {"success": True, "message": "Going Cold notifications retrieved.", "data": data}


# ═══════════════════════════════════════════════════════════════════════════════
# Daily Priorities Endpoints
# Sales reps also have access — role override on each endpoint.
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/daily-priorities",
    response_model=StandardResponse[DailyPrioritiesListResponse],
    summary="AI Daily Priorities — personalized action list",
    description=(
        "Generates a ranked daily priority list for the authenticated user using "
        "a 7-factor AI Priority Score (0-100):\n"
        "- **25%** Overdue follow-up\n"
        "- **20%** Deal value\n"
        "- **15%** Closing soon\n"
        "- **15%** Rising interest (lead score)\n"
        "- **10%** Going cold (inactivity)\n"
        "- **10%** Open high-priority tasks\n"
        "- **5%** Today's meetings\n\n"
        "Priority levels: Critical (90+) | High (75-89) | Medium (50-74) | "
        "Low (25-49) | Informational (<25)\n\n"
        "**RBAC:** Admin=org-wide, Manager=team, Sales Rep=own leads."
    ),
    tags=["AI Insights"],
)
async def get_daily_priorities(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="limit"),
    date_filter: Optional[str] = Query(
        default=None,
        description="today | tomorrow | week",
    ),
    owner_id: Optional[UUID] = Query(default=None),
    pipeline_stage: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(
        default=None,
        description="critical | high | medium | low | informational",
    ),
    category: Optional[str] = Query(
        default=None,
        description="Follow-up | Meeting | Call | Proposal | Demo | Risk Recovery | etc.",
    ),
    sort: str = Query(
        default="ai_priority_score",
        description="ai_priority_score | deal_value | due_date",
    ),
) -> dict:
    """
    GET /api/v1/ai-insights/daily-priorities

    JWT required. RBAC scope resolved from caller's role.
    Returns zero items when no data exists — never 500.
    """
    from app.services.daily_priorities_service import DailyPrioritiesService
    svc = DailyPrioritiesService(db)
    data = await svc.get_daily_priorities(
        current_user,
        page=page,
        page_size=page_size,
        date_filter=date_filter,
        owner_id=owner_id,
        pipeline_stage=pipeline_stage,
        priority_filter=priority,
        category_filter=category,
        sort=sort,
    )
    return {"success": True, "message": "Daily priorities retrieved.", "data": data}


@router.get(
    "/daily-priorities/summary",
    response_model=StandardResponse[DailyPrioritiesSummaryResponse],
    summary="Daily Priorities — dashboard KPI summary",
    description=(
        "Returns aggregated daily priority KPIs: critical/high/medium/low counts, "
        "completed today, pending today, meetings today, follow-ups today, "
        "calls today, and deals closing this week."
    ),
    tags=["AI Insights"],
)
async def get_daily_priorities_summary(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """GET /api/v1/ai-insights/daily-priorities/summary"""
    from app.services.daily_priorities_service import DailyPrioritiesService
    svc = DailyPrioritiesService(db)
    data = await svc.get_summary(current_user)
    return {"success": True, "message": "Daily priorities summary retrieved.", "data": data}


@router.get(
    "/daily-priorities/notifications",
    response_model=StandardResponse[list[DailyPriorityNotification]],
    summary="Daily Priorities — auto-generated alerts",
    description=(
        "Generates real-time alerts for:\n"
        "- Critical priority items\n"
        "- High-value deals approaching close date\n"
        "- Overdue follow-ups\n"
        "- Meetings starting today\n"
        "- Proposals awaiting response\n"
        "- Cold leads requiring recovery"
    ),
    tags=["AI Insights"],
)
async def get_daily_priorities_notifications(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """GET /api/v1/ai-insights/daily-priorities/notifications"""
    from app.services.daily_priorities_service import DailyPrioritiesService
    svc = DailyPrioritiesService(db)
    data = await svc.get_notifications(current_user)
    return {"success": True, "message": "Daily priorities notifications retrieved.", "data": data}


# ═══════════════════════════════════════════════════════════════════════════════
# Conversation Intelligence Endpoints
# All roles have access — RBAC scope resolved in service.
# ═══════════════════════════════════════════════════════════════════════════════

_CI_ROLES = Depends(require_role("admin", "manager", "sales_rep"))


@router.get(
    "/conversation-intelligence",
    response_model=StandardResponse[ConversationListResponse],
    summary="Conversation Intelligence — unified conversation analysis",
    description=(
        "Returns a ranked list of all customer conversations (calls, meetings, "
        "emails, notes) enriched with:\n"
        "- Customer engagement score (0-100)\n"
        "- Conversation quality score (0-100)\n"
        "- Buying signal detection\n"
        "- Objection detection\n"
        "- Action item extraction\n"
        "- Dynamic AI recommendations\n\n"
        "**RBAC:** Admin=org-wide, Manager=team, Sales Rep=own conversations."
    ),
    dependencies=[_CI_ROLES],
    tags=["AI Insights"],
)
async def get_conversation_intelligence(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="limit"),
    conversation_type: Optional[str] = Query(
        default=None,
        description="Call | Meeting | Email | Internal Note | Customer Note",
    ),
    lead_id: Optional[UUID] = Query(default=None),
    company_id: Optional[UUID] = Query(default=None),
    deal_id: Optional[UUID] = Query(default=None),
    owner_id: Optional[UUID] = Query(default=None),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
) -> dict:
    from app.services.conversation_intelligence_service import ConversationIntelligenceService
    svc = ConversationIntelligenceService(db)
    data = await svc.get_conversations(
        current_user,
        page=page,
        page_size=page_size,
        conversation_type=conversation_type,
        lead_id=lead_id,
        company_id=company_id,
        deal_id=deal_id,
        date_from=date_from,
        date_to=date_to,
        owner_id_filter=owner_id,
    )
    return {"success": True, "message": "Conversation intelligence retrieved.", "data": data}


@router.get(
    "/conversation-intelligence/summary",
    response_model=StandardResponse[ConversationIntelligenceSummaryResponse],
    summary="Conversation Intelligence — dashboard KPI summary",
    dependencies=[_CI_ROLES],
    tags=["AI Insights"],
)
async def get_conversation_intelligence_summary(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.conversation_intelligence_service import ConversationIntelligenceService
    svc = ConversationIntelligenceService(db)
    data = await svc.get_summary(current_user)
    return {"success": True, "message": "Conversation intelligence summary retrieved.", "data": data}


@router.get(
    "/conversation-intelligence/timeline",
    response_model=StandardResponse[list[ConversationTimelineEntry]],
    summary="Conversation Intelligence — chronological timeline",
    dependencies=[_CI_ROLES],
    tags=["AI Insights"],
)
async def get_conversation_timeline(
    current_user: CurrentUser,
    db: DBSession,
    lead_id: Optional[UUID] = Query(default=None),
    deal_id: Optional[UUID] = Query(default=None),
) -> dict:
    from app.services.conversation_intelligence_service import ConversationIntelligenceService
    svc = ConversationIntelligenceService(db)
    data = await svc.get_timeline(current_user, lead_id=lead_id, deal_id=deal_id)
    return {"success": True, "message": "Timeline retrieved.", "data": data}


@router.get(
    "/conversation-intelligence/notifications",
    response_model=StandardResponse[list[ConversationNotification]],
    summary="Conversation Intelligence — auto-generated alerts",
    dependencies=[_CI_ROLES],
    tags=["AI Insights"],
)
async def get_conversation_notifications(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.conversation_intelligence_service import ConversationIntelligenceService
    svc = ConversationIntelligenceService(db)
    data = await svc.get_notifications(current_user)
    return {"success": True, "message": "Conversation notifications retrieved.", "data": data}


@router.get(
    "/conversation-intelligence/{conversation_id}",
    response_model=StandardResponse[ConversationDetailResponse],
    summary="Conversation Intelligence — single conversation detail",
    dependencies=[_CI_ROLES],
    tags=["AI Insights"],
)
async def get_conversation_detail(
    conversation_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.conversation_intelligence_service import ConversationIntelligenceService
    svc = ConversationIntelligenceService(db)
    data = await svc.get_conversation_detail(current_user, conversation_id)
    return {"success": True, "message": "Conversation detail retrieved.", "data": data}


# ═══════════════════════════════════════════════════════════════════════════════
# Sentiment Analysis Endpoints
# All roles have access — RBAC scope resolved in service.
# ═══════════════════════════════════════════════════════════════════════════════

_SA_ROLES = Depends(require_role("admin", "manager", "sales_rep"))


@router.get(
    "/sentiment",
    response_model=StandardResponse[SentimentListResponse],
    summary="Sentiment Analysis — customer emotional analysis",
    description=(
        "Analyzes every CRM interaction (emails, activities, notes) using a "
        "rule-based keyword engine to classify customer sentiment:\n\n"
        "**Sentiments:** Very Positive | Excited | Positive | Interested | "
        "Neutral | Confused | Negative | Frustrated | Angry | Very Negative\n\n"
        "**Score map:** Very Positive=100, Positive=80, Interested=75, "
        "Neutral=50, Confused=40, Negative=25, Frustrated=15, Angry=5, Very Negative=0\n\n"
        "Returns per-customer sentiment, score, confidence, emotional trend, "
        "risk level, mood timeline, and AI recommendation.\n\n"
        "**RBAC:** Admin=org-wide, Manager=team, Sales Rep=own customers."
    ),
    dependencies=[_SA_ROLES],
    tags=["AI Insights"],
)
async def get_sentiment(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="limit"),
    owner_id: Optional[UUID] = Query(default=None),
    lead_id: Optional[UUID] = Query(default=None),
    company_id: Optional[UUID] = Query(default=None),
    deal_id: Optional[UUID] = Query(default=None),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    sentiment: Optional[str] = Query(
        default=None,
        description="Filter by sentiment: Positive | Negative | Neutral | Interested | etc.",
    ),
    sort: str = Query(
        default="interaction_date",
        description="interaction_date | score | risk",
    ),
) -> dict:
    from app.services.sentiment_service import SentimentService
    svc = SentimentService(db)
    data = await svc.get_sentiment_list(
        current_user,
        page=page, page_size=page_size,
        owner_id=owner_id, lead_id=lead_id,
        company_id=company_id, deal_id=deal_id,
        date_from=date_from, date_to=date_to,
        sentiment_filter=sentiment, sort=sort,
    )
    return {"success": True, "message": "Sentiment analysis retrieved.", "data": data}


@router.get(
    "/sentiment/summary",
    response_model=StandardResponse[SentimentSummaryResponse],
    summary="Sentiment Analysis — dashboard KPI summary",
    description=(
        "Returns aggregated sentiment KPIs: average score, positive/neutral/negative counts, "
        "high-risk customers, improving/declining customers, average confidence."
    ),
    dependencies=[_SA_ROLES],
    tags=["AI Insights"],
)
async def get_sentiment_summary(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.sentiment_service import SentimentService
    svc = SentimentService(db)
    data = await svc.get_summary(current_user)
    return {"success": True, "message": "Sentiment summary retrieved.", "data": data}


@router.get(
    "/sentiment/timeline",
    response_model=StandardResponse[list[SentimentMoodPoint]],
    summary="Sentiment Analysis — customer mood timeline",
    description=(
        "Returns chronological sentiment history for a specific lead or "
        "across all accessible leads. Ordered by interaction date DESC."
    ),
    dependencies=[_SA_ROLES],
    tags=["AI Insights"],
)
async def get_sentiment_timeline(
    current_user: CurrentUser,
    db: DBSession,
    lead_id: Optional[UUID] = Query(default=None),
) -> dict:
    from app.services.sentiment_service import SentimentService
    svc = SentimentService(db)
    data = await svc.get_timeline(current_user, lead_id=lead_id)
    return {"success": True, "message": "Sentiment timeline retrieved.", "data": data}


@router.get(
    "/sentiment/notifications",
    response_model=StandardResponse[list[SentimentNotification]],
    summary="Sentiment Analysis — auto-generated alerts",
    description=(
        "Generates real-time alerts when:\n"
        "- Customer sentiment becomes Very Negative\n"
        "- Customer becomes Angry\n"
        "- Three consecutive negative interactions detected\n"
        "- High-value customer sentiment is declining\n"
        "- Complaint keywords detected (Critical risk)"
    ),
    dependencies=[_SA_ROLES],
    tags=["AI Insights"],
)
async def get_sentiment_notifications(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.sentiment_service import SentimentService
    svc = SentimentService(db)
    data = await svc.get_notifications(current_user)
    return {"success": True, "message": "Sentiment notifications retrieved.", "data": data}


# ═══════════════════════════════════════════════════════════════════════════════
# Intent Detection Endpoints
# All roles — RBAC scope resolved in service.
# ═══════════════════════════════════════════════════════════════════════════════

_ID_ROLES = Depends(require_role("admin", "manager", "sales_rep"))


@router.get(
    "/intents",
    response_model=StandardResponse[IntentListResponse],
    summary="Intent Detection — customer buying intent analysis",
    description=(
        "Analyzes CRM interactions (emails, activities, notes) using a "
        "rule-based keyword engine to detect 17 customer intent types:\n\n"
        "Purchase Intent | Demo Request | Pricing Inquiry | Proposal Request | "
        "Contract Review | Technical Evaluation | Security Review | "
        "Implementation Planning | Budget Approval | Decision Maker Engagement | "
        "Renewal Interest | Upsell | Cross-sell | Support Request | "
        "Cancellation Risk | Competitor Comparison | General Inquiry\n\n"
        "Returns primary/secondary intent, confidence, buying stage, trend, "
        "timeline, and AI recommendation.\n\n"
        "Default sort: confidence_score DESC.\n"
        "**RBAC:** Admin=org-wide, Manager=team, Sales Rep=own."
    ),
    dependencies=[_ID_ROLES],
    tags=["AI Insights"],
)
async def get_intents(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="limit"),
    owner_id: Optional[UUID] = Query(default=None),
    lead_id: Optional[UUID] = Query(default=None),
    company_id: Optional[UUID] = Query(default=None),
    deal_id: Optional[UUID] = Query(default=None),
    intent: Optional[str] = Query(
        default=None,
        description="Filter by intent type, e.g. Purchase Intent | Demo Request | Cancellation Risk",
    ),
    stage: Optional[str] = Query(
        default=None,
        description="Filter by buying stage: Awareness | Interest | Consideration | Evaluation | Validation | Decision | Negotiation | Closing | Expansion | At Risk | Post-Sale",
    ),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    sort: str = Query(
        default="confidence_score",
        description="confidence_score | deal_value | interaction_date",
    ),
) -> dict:
    from app.services.intent_service import IntentService
    svc = IntentService(db)
    data = await svc.get_intents(
        current_user,
        page=page, page_size=page_size,
        owner_id=owner_id, lead_id=lead_id,
        company_id=company_id, deal_id=deal_id,
        intent_filter=intent, stage_filter=stage,
        date_from=date_from, date_to=date_to,
        sort=sort,
    )
    return {"success": True, "message": "Intent detection data retrieved.", "data": data}


@router.get(
    "/intents/summary",
    response_model=StandardResponse[IntentSummaryResponse],
    summary="Intent Detection — dashboard KPI summary",
    description=(
        "Returns intent distribution KPIs: purchase intent count, demo requests, "
        "pricing inquiries, proposal requests, technical evaluations, security reviews, "
        "contract reviews, cancellation risks, average confidence, and conversion rate."
    ),
    dependencies=[_ID_ROLES],
    tags=["AI Insights"],
)
async def get_intents_summary(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.intent_service import IntentService
    svc = IntentService(db)
    data = await svc.get_summary(current_user)
    return {"success": True, "message": "Intent summary retrieved.", "data": data}


@router.get(
    "/intents/timeline",
    response_model=StandardResponse[list[IntentTimelinePoint]],
    summary="Intent Detection — chronological intent timeline",
    description=(
        "Returns chronological intent history for a specific lead, "
        "or across all accessible leads. Ordered by date DESC."
    ),
    dependencies=[_ID_ROLES],
    tags=["AI Insights"],
)
async def get_intents_timeline(
    current_user: CurrentUser,
    db: DBSession,
    lead_id: Optional[UUID] = Query(default=None),
) -> dict:
    from app.services.intent_service import IntentService
    svc = IntentService(db)
    data = await svc.get_timeline(current_user, lead_id=lead_id)
    return {"success": True, "message": "Intent timeline retrieved.", "data": data}


@router.get(
    "/intents/notifications",
    response_model=StandardResponse[list[IntentNotification]],
    summary="Intent Detection — auto-generated alerts",
    description=(
        "Generates real-time alerts when:\n"
        "- Purchase Intent detected\n"
        "- Contract Review initiated\n"
        "- Cancellation Risk detected\n"
        "- Confidence exceeds 90%\n"
        "- Deal enters Negotiation or Closing stage\n"
        "- Decision Maker Engagement identified"
    ),
    dependencies=[_ID_ROLES],
    tags=["AI Insights"],
)
async def get_intents_notifications(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.intent_service import IntentService
    svc = IntentService(db)
    data = await svc.get_notifications(current_user)
    return {"success": True, "message": "Intent notifications retrieved.", "data": data}


# ═══════════════════════════════════════════════════════════════════════════════
# Recent AI Summaries Endpoints
# All roles — RBAC scope resolved in service.
# ═══════════════════════════════════════════════════════════════════════════════

from app.schemas.ai_insights import (
    AIRecommendationSummaryResponse,
    DailyAISummaryPayload,
    ExecutiveSummaryPayload,
    MonthlyAISummaryPayload,
    OpportunitySummaryResponse,
    PerformanceSummaryResponse,
    RecentSummariesListResponse,
    RecentSummariesStatsResponse,
    RecentSummaryDetail,
    RecentSummaryItem,
    RiskSummaryResponse,
    SummaryDashboardKPIs,
    SummaryNotification,
    SummaryTimelineEntry,
    WeeklyAISummaryPayload,
)

_RS_ROLES = Depends(require_role("admin", "manager", "sales_rep"))


@router.get(
    "/recent-summaries",
    response_model=StandardResponse[RecentSummariesListResponse],
    summary="Recent AI Summaries — paginated list",
    description=(
        "Returns paginated AI summaries aggregated from all AI Insights modules. "
        "Supports filtering by period, type, priority, owner, team.\n\n"
        "**period:** today | yesterday | this_week | last_week | this_month | custom\n\n"
        "**summary_type:** daily | weekly | monthly | executive | recommendation | "
        "risk | opportunity | performance\n\n"
        "**sort:** generated_at (default, DESC) | priority | type\n\n"
        "**RBAC:** Admin=org-wide, Manager=team, Sales Rep=own summaries."
    ),
    dependencies=[_RS_ROLES],
    tags=["AI Insights"],
)
async def get_recent_summaries(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="limit"),
    period: Optional[str] = Query(
        default=None,
        description="today | yesterday | this_week | last_week | this_month | custom",
    ),
    summary_type: Optional[str] = Query(
        default=None,
        description="daily | weekly | monthly | executive | recommendation | risk | opportunity | performance",
    ),
    priority: Optional[str] = Query(
        default=None,
        description="critical | high | medium | low",
    ),
    owner_id: Optional[UUID] = Query(default=None, description="Filter by owner user ID"),
    team_id: Optional[UUID] = Query(default=None, description="Filter by team member ID"),
    sort: str = Query(
        default="generated_at",
        description="generated_at | priority | type",
    ),
) -> dict:
    from app.services.recent_summaries_service import RecentSummariesService
    svc = RecentSummariesService(db)
    team_ids = [team_id] if team_id else None
    data = await svc.get_recent_summaries(
        current_user,
        page=page,
        page_size=page_size,
        period=period,
        summary_type=summary_type,
        priority=priority,
        owner_id_filter=owner_id,
        team_id_filter=team_ids,
        sort=sort,
    )
    return {"success": True, "message": "Recent AI summaries retrieved.", "data": data}


@router.get(
    "/recent-summaries/summary",
    response_model=StandardResponse[RecentSummariesStatsResponse],
    summary="Recent AI Summaries — aggregated KPI stats",
    description=(
        "Returns aggregated KPI counts: daily/weekly/monthly summary counts, "
        "critical insights, positive/negative trends, pending recommendations."
    ),
    dependencies=[_RS_ROLES],
    tags=["AI Insights"],
)
async def get_recent_summaries_stats(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.recent_summaries_service import RecentSummariesService
    svc = RecentSummariesService(db)
    data = await svc.get_stats(current_user)
    return {"success": True, "message": "Summary stats retrieved.", "data": data}


@router.get(
    "/recent-summaries/timeline",
    response_model=StandardResponse[list[SummaryTimelineEntry]],
    summary="Recent AI Summaries — chronological timeline",
    description=(
        "Returns AI summaries in reverse-chronological order for timeline display. "
        "Limit capped at 50 entries."
    ),
    dependencies=[_RS_ROLES],
    tags=["AI Insights"],
)
async def get_recent_summaries_timeline(
    current_user: CurrentUser,
    db: DBSession,
    limit: int = Query(default=50, ge=1, le=50),
) -> dict:
    from app.services.recent_summaries_service import RecentSummariesService
    svc = RecentSummariesService(db)
    data = await svc.get_timeline(current_user, limit=limit)
    return {"success": True, "message": "Summary timeline retrieved.", "data": data}


@router.get(
    "/recent-summaries/notifications",
    response_model=StandardResponse[list[SummaryNotification]],
    summary="Recent AI Summaries — auto-generated notification alerts",
    description=(
        "Generates alerts when:\n"
        "- New executive summary generated\n"
        "- Pipeline health changes significantly\n"
        "- Critical risks detected\n"
        "- High-intent opportunities identified\n"
        "- Weekly/monthly summary available"
    ),
    dependencies=[_RS_ROLES],
    tags=["AI Insights"],
)
async def get_recent_summaries_notifications(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.recent_summaries_service import RecentSummariesService
    svc = RecentSummariesService(db)
    data = await svc.get_notifications(current_user)
    return {"success": True, "message": "Summary notifications retrieved.", "data": data}


@router.get(
    "/recent-summaries/dashboard-kpis",
    response_model=StandardResponse[SummaryDashboardKPIs],
    summary="Recent AI Summaries — dashboard KPI panel",
    description=(
        "Returns top-level KPI counters for the dashboard summary widget:\n"
        "- Total AI Summaries\n"
        "- Today's Summaries\n"
        "- Weekly / Monthly Summaries\n"
        "- Critical Insights\n"
        "- Positive / Negative Trends\n"
        "- Pending Recommendations"
    ),
    dependencies=[_RS_ROLES],
    tags=["AI Insights"],
)
async def get_recent_summaries_dashboard_kpis(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.recent_summaries_service import RecentSummariesService
    svc = RecentSummariesService(db)
    data = await svc.get_dashboard_kpis(current_user)
    return {"success": True, "message": "Dashboard KPIs retrieved.", "data": data}


@router.get(
    "/recent-summaries/daily",
    response_model=StandardResponse[DailyAISummaryPayload],
    summary="Recent AI Summaries — daily summary",
    description=(
        "Returns today's aggregated daily summary: deals won/lost, new leads, "
        "high-value opportunities, follow-ups, meetings, calls, emails, "
        "AI recommendations generated, and critical alerts."
    ),
    dependencies=[_RS_ROLES],
    tags=["AI Insights"],
)
async def get_recent_summaries_daily(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.recent_summaries_service import RecentSummariesService
    svc = RecentSummariesService(db)
    data = await svc.get_daily_summary(current_user)
    return {"success": True, "message": "Daily summary retrieved.", "data": data}


@router.get(
    "/recent-summaries/weekly",
    response_model=StandardResponse[WeeklyAISummaryPayload],
    summary="Recent AI Summaries — weekly summary",
    description=(
        "Returns this week's aggregated summary: pipeline growth, conversion rate, "
        "revenue forecast, top performers, team activity, high-risk deals, "
        "new opportunities, and customer engagement trend."
    ),
    dependencies=[_RS_ROLES],
    tags=["AI Insights"],
)
async def get_recent_summaries_weekly(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.recent_summaries_service import RecentSummariesService
    svc = RecentSummariesService(db)
    data = await svc.get_weekly_summary(current_user)
    return {"success": True, "message": "Weekly summary retrieved.", "data": data}


@router.get(
    "/recent-summaries/monthly",
    response_model=StandardResponse[MonthlyAISummaryPayload],
    summary="Recent AI Summaries — monthly summary",
    description=(
        "Returns this month's aggregated summary: total revenue, deals won/lost, "
        "pipeline growth, AI recommendations executed, customer sentiment trend, "
        "intent trend, and overall pipeline health."
    ),
    dependencies=[_RS_ROLES],
    tags=["AI Insights"],
)
async def get_recent_summaries_monthly(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.recent_summaries_service import RecentSummariesService
    svc = RecentSummariesService(db)
    data = await svc.get_monthly_summary(current_user)
    return {"success": True, "message": "Monthly summary retrieved.", "data": data}


@router.get(
    "/recent-summaries/executive",
    response_model=StandardResponse[ExecutiveSummaryPayload],
    summary="Recent AI Summaries — executive summary",
    description=(
        "Returns a concise executive overview suitable for dashboard cards. "
        "Aggregates pipeline health, critical risks, and high-intent opportunities "
        "into a single human-readable text."
    ),
    dependencies=[_RS_ROLES],
    tags=["AI Insights"],
)
async def get_recent_summaries_executive(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.recent_summaries_service import RecentSummariesService
    svc = RecentSummariesService(db)
    data = await svc.get_executive_summary(current_user)
    return {"success": True, "message": "Executive summary retrieved.", "data": data}


@router.get(
    "/recent-summaries/recommendations",
    response_model=StandardResponse[AIRecommendationSummaryResponse],
    summary="Recent AI Summaries — AI recommendation summary",
    description=(
        "Aggregates all AI module recommendations grouped by priority:\n"
        "- Critical: urgent follow-ups, high-probability going-cold deals\n"
        "- High: enterprise deals, overdue close dates\n"
        "- Medium: low-probability deals, re-engagement\n"
        "- Low: general review actions"
    ),
    dependencies=[_RS_ROLES],
    tags=["AI Insights"],
)
async def get_recent_summaries_recommendations(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.recent_summaries_service import RecentSummariesService
    svc = RecentSummariesService(db)
    data = await svc.get_recommendation_summary(current_user)
    return {"success": True, "message": "Recommendation summary retrieved.", "data": data}


@router.get(
    "/recent-summaries/risks",
    response_model=StandardResponse[RiskSummaryResponse],
    summary="Recent AI Summaries — risk summary",
    description=(
        "Aggregates all risk signals: critical risks, high risks, cold leads, "
        "negative sentiment, cancellation risks, pipeline issues, "
        "and top affected records."
    ),
    dependencies=[_RS_ROLES],
    tags=["AI Insights"],
)
async def get_recent_summaries_risk(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.recent_summaries_service import RecentSummariesService
    svc = RecentSummariesService(db)
    data = await svc.get_risk_summary(current_user)
    return {"success": True, "message": "Risk summary retrieved.", "data": data}


@router.get(
    "/recent-summaries/opportunities",
    response_model=StandardResponse[OpportunitySummaryResponse],
    summary="Recent AI Summaries — opportunity summary",
    description=(
        "Aggregates all opportunity signals: rising interest leads, purchase intent "
        "customers, high-value deals, deals closing this week, new opportunities, "
        "and top opportunity names."
    ),
    dependencies=[_RS_ROLES],
    tags=["AI Insights"],
)
async def get_recent_summaries_opportunities(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.recent_summaries_service import RecentSummariesService
    svc = RecentSummariesService(db)
    data = await svc.get_opportunity_summary(current_user)
    return {"success": True, "message": "Opportunity summary retrieved.", "data": data}


@router.get(
    "/recent-summaries/performance",
    response_model=StandardResponse[PerformanceSummaryResponse],
    summary="Recent AI Summaries — performance summary",
    description=(
        "Returns activity performance metrics: meetings/calls/tasks/follow-ups "
        "completed, total sales activities, AI recommendations completed, "
        "and completion rate for the selected period."
    ),
    dependencies=[_RS_ROLES],
    tags=["AI Insights"],
)
async def get_recent_summaries_performance(
    current_user: CurrentUser,
    db: DBSession,
    period: str = Query(
        default="today",
        description="today | this_week | this_month",
    ),
) -> dict:
    from app.services.recent_summaries_service import RecentSummariesService
    svc = RecentSummariesService(db)
    data = await svc.get_performance_summary(current_user, period=period)
    return {"success": True, "message": "Performance summary retrieved.", "data": data}


@router.post(
    "/recent-summaries/generate",
    response_model=StandardResponse[RecentSummaryItem],
    summary="Recent AI Summaries — generate and persist a new summary",
    description=(
        "Generates a fresh AI summary by aggregating all AI module outputs, "
        "persists it to the database, and returns the lightweight summary item. "
        "**Admin or Manager role required.**"
    ),
    dependencies=[Depends(require_role("admin", "manager"))],
    tags=["AI Insights"],
)
async def generate_recent_summary(
    current_user: CurrentUser,
    db: DBSession,
    period: str = Query(
        default="today",
        description="today | yesterday | this_week | last_week | this_month",
    ),
    summary_type: str = Query(
        default="daily",
        description="daily | weekly | monthly | executive | recommendation | risk | opportunity | performance",
    ),
) -> dict:
    from app.services.recent_summaries_service import RecentSummariesService
    svc = RecentSummariesService(db)
    data = await svc.generate_and_save(
        current_user,
        period=period,
        summary_type=summary_type,
    )
    return {"success": True, "message": "AI summary generated and saved.", "data": data}


# NOTE: specific sub-path routes above must be declared BEFORE the
# /{summary_id} dynamic route — FastAPI routes are matched in order.

@router.get(
    "/recent-summaries/{summary_id}",
    response_model=StandardResponse[RecentSummaryDetail],
    summary="Recent AI Summaries — full detail for a single summary",
    description=(
        "Returns the full detail for one AI summary record: KPIs, related leads, "
        "related deals, recommendations, risks, and opportunities.\n\n"
        "Returns 404 if the summary does not belong to the caller's organization."
    ),
    dependencies=[_RS_ROLES],
    tags=["AI Insights"],
)
async def get_recent_summary_detail(
    summary_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.recent_summaries_service import RecentSummariesService
    svc = RecentSummariesService(db)
    data = await svc.get_summary_detail(current_user, summary_id)
    return {"success": True, "message": "Summary detail retrieved.", "data": data}


# ── Merge the all-roles sub-router into the main router ───────────────────────
# This must appear AFTER all route definitions so FastAPI registers them
# in the correct order (specific before dynamic paths).
router.include_router(_all_roles_router)
