"""
Dashboard routes.
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import CurrentUser, DBSession, require_permission, require_role
from app.controllers.forecast_controller import ForecastController
from app.schemas.common import StandardResponse
from app.schemas.dashboard import (
    DashboardAnalyticsResponse,
    DashboardRevenuePoint,
    DashboardStatsResponse,
    DashboardSummaryResponse,
    DashboardTrendResponse,
    TopSalesRepresentativeResponse,
    AdminDashboardResponse,
    ManagerDashboardResponse,
    RedesignedDashboardResponse,
    SalesRepDashboardResponse,
    SalesRepCommandDashboardResponse,
)
from app.schemas.forecast import (
    ManagerForecastResponse,
    ForecastAccuracyStats,
    ForecastInsight,
    ForecastRecommendation,
    ForecastRisk,
    ForecastTrendPoint,
    MonthlyForecastPoint,
    QuarterlyProjectionRow,
)
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get(
    "",
    response_model=StandardResponse[DashboardSummaryResponse],
    summary="Get dashboard summary",
    dependencies=[Depends(require_permission("dashboard:read"))],
)
async def get_dashboard(current_user: CurrentUser, db: DBSession) -> dict:
    svc = DashboardService(db)
    summary = await svc.summary(current_user.organization_id)
    return {"success": True, "message": "OK", "data": summary}


@router.get(
    "/stats",
    response_model=StandardResponse[DashboardStatsResponse],
    summary="Get dashboard stats",
    dependencies=[Depends(require_permission("dashboard:read"))],
)
async def get_dashboard_stats(current_user: CurrentUser, db: DBSession) -> dict:
    svc = DashboardService(db)
    stats = await svc.stats(current_user.organization_id)
    return {"success": True, "message": "OK", "data": stats}


@router.get(
    "/analytics",
    response_model=StandardResponse[DashboardAnalyticsResponse],
    summary="Get dashboard analytics",
    dependencies=[Depends(require_permission("dashboard:read"))],
)
async def get_dashboard_analytics(current_user: CurrentUser, db: DBSession) -> dict:
    svc = DashboardService(db)
    analytics = await svc.analytics(current_user.organization_id)
    return {"success": True, "message": "OK", "data": analytics}


@router.get(
    "/pipeline",
    response_model=StandardResponse[DashboardAnalyticsResponse],
    summary="Get pipeline-focused dashboard analytics",
    dependencies=[Depends(require_permission("dashboard:read"))],
)
async def get_dashboard_pipeline(current_user: CurrentUser, db: DBSession) -> dict:
    svc = DashboardService(db)
    analytics = await svc.analytics(current_user.organization_id)
    return {"success": True, "message": "OK", "data": analytics}


@router.get(
    "/revenue",
    response_model=StandardResponse[list[DashboardRevenuePoint]],
    summary="Get monthly revenue series",
    dependencies=[Depends(require_permission("dashboard:read"))],
)
async def get_dashboard_revenue(current_user: CurrentUser, db: DBSession) -> dict:
    svc = DashboardService(db)
    series = await svc.revenue_series(current_user.organization_id)
    return {"success": True, "message": "OK", "data": series}


@router.get(
    "/top-sales-representatives",
    response_model=StandardResponse[list[TopSalesRepresentativeResponse]],
    summary="Get top sales representatives",
    dependencies=[Depends(require_permission("dashboard:read"))],
)
async def get_top_sales_representatives(current_user: CurrentUser, db: DBSession) -> dict:
    svc = DashboardService(db)
    reps = await svc.top_sales_representatives(current_user.organization_id)
    return {"success": True, "message": "OK", "data": reps}


@router.get(
    "/trends",
    response_model=StandardResponse[DashboardTrendResponse],
    summary="Get dashboard trends",
    dependencies=[Depends(require_permission("dashboard:read"))],
)
async def get_dashboard_trends(current_user: CurrentUser, db: DBSession) -> dict:
    svc = DashboardService(db)
    trends = await svc.trends(current_user.organization_id)
    return {"success": True, "message": "OK", "data": trends}



@router.get(
    "/redesigned",
    response_model=StandardResponse[RedesignedDashboardResponse],
    summary="Get redesigned dashboard cards",
    dependencies=[Depends(require_permission("dashboard:read"))],
    tags=["Dashboard"],
)
async def get_redesigned_dashboard(current_user: CurrentUser, db: DBSession) -> dict:
    svc = DashboardService(db)
    data = await svc.redesigned_dashboard(current_user.id, current_user.organization_id)
    return {"success": True, "message": "Dashboard cards retrieved successfully.", "data": data}

@router.get(
    "/admin",
    response_model=StandardResponse[AdminDashboardResponse],
    summary="Admin Dashboard KPIs",
    description=(
        "Returns all Admin Dashboard KPIs including organization stats, user counts, "
        "revenue breakdown, lead funnel, top sales reps, top companies, recent "
        "activities, and notification summary. **Admin role required.**"
    ),
    dependencies=[Depends(require_role("admin"))],
    tags=["Dashboard"],
)
async def get_admin_dashboard(
    current_user: CurrentUser,
    db: DBSession,
    lead_source_period: str = Query(default="all", pattern="^(all|year)$"),
) -> dict:
    """
    GET /api/v1/dashboard/admin?lead_source_period=all|year

    Secured: JWT required + `admin` role.
    Scoped to the caller's organization_id.
    """
    svc = DashboardService(db)
    data = await svc.admin_kpi(current_user.organization_id, lead_source_period=lead_source_period)
    return {"success": True, "message": "Admin KPIs retrieved successfully.", "data": data}


@router.get(
    "/manager",
    response_model=StandardResponse[ManagerDashboardResponse],
    summary="Manager Dashboard KPIs",
    description=(
        "Returns all Sales Manager Dashboard KPIs: team revenue, forecast, "
        "pipeline health, rep quota attainment, monthly trends, top reps, "
        "deals at risk, alerts, and team performance metrics. "
        "**Manager or Admin role required.**"
    ),
    dependencies=[Depends(require_role("manager", "admin"))],
    tags=["Dashboard"],
)
async def get_manager_dashboard(
    current_user: CurrentUser,
    db: DBSession,
    period: str = Query(
        default="quarter",
        pattern="^(week|month|quarter|year)$",
    ),
    rep_id: str | None = Query(default=None),
) -> dict:
    """
    GET /api/v1/dashboard/manager

    Secured: JWT required + `manager` or `admin` role.
    Scoped to the caller's organization_id; team = all users in the same org.
    """
    svc = DashboardService(db)

    # Admins keep the org-wide view; managers are scoped to their assigned reps.
    is_admin = any(
        ur.role.name == "admin" for ur in current_user.user_roles if ur.role
    )
    data = await svc.manager_kpi(
        current_user.id,
        current_user.organization_id,
        period=period,
        org_wide=is_admin,
    )

    return {
        "success": True,
        "message": "Manager KPIs retrieved successfully.",
        "data": data,
    }
@router.get(
    "/me",
    response_model=StandardResponse[SalesRepCommandDashboardResponse],
    summary="Sales Rep Command Center",
    description=(
        "Hydrates all 6 core widgets and top KPIs concurrently in a single request "
        "for the Next.js Sales Command Center. "
        "**Sales Rep, Manager, or Admin role required.**"
    ),
    dependencies=[Depends(require_role("sales_rep", "manager", "admin"))],
    tags=["Dashboard"],
)
async def get_my_command_dashboard(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """
    GET /api/v1/dashboard/me

    Secured: JWT required + sales_rep / manager / admin role.
    All data is strictly scoped to owner_id == current_user.id.
    Executes concurrent DB queries to prevent frontend waterfall loading.
    """
    svc = DashboardService(db)
    
    # Calls the new concurrent method built in DashboardService
    data = await svc.sales_rep_command_center(
        user_id=current_user.id, 
        organization_id=current_user.organization_id
    )
    
    return {
        "success": True, 
        "message": "Command Center data retrieved successfully.", 
        "data": data
    }

@router.get(
    "/sales-rep",
    response_model=StandardResponse[SalesRepDashboardResponse],
    summary="Sales Representative Dashboard KPIs",
    description=(
        "Returns all Sales Rep KPIs scoped to the logged-in user: revenue, "
        "won deals, win rate, avg deal size, sales cycle, revenue trend, "
        "deals by stage/source, activity heatmap, team performance table, "
        "activity overview, key metrics, recent reports, and report templates. "
        "**Sales Rep, Manager, or Admin role required.**"
    ),
    dependencies=[Depends(require_role("sales_rep", "manager", "admin"))],
    tags=["Dashboard"],
)
async def get_sales_rep_dashboard(
    current_user: CurrentUser,
    db: DBSession,
    period: str = "month",
) -> dict:
    """
    GET /api/v1/dashboard/sales-rep?period=month

    period options: week | month | quarter | year  (default: month)
    Secured: JWT required + sales_rep / manager / admin role.
    All data scoped to owner_id == current_user.id.
    """
    svc = DashboardService(db)
    data = await svc.sales_rep_kpi(current_user.id, current_user.organization_id, period)
    return {"success": True, "message": "Sales rep KPIs retrieved successfully.", "data": data}


@router.get(
    "/manager/forecast",
    response_model=StandardResponse[ManagerForecastResponse],
    summary="Sales Manager Forecast KPIs",
    description=(
        "Returns all forecast KPIs for the Sales Manager dashboard: "
        "expected revenue, best case pipeline, pipeline coverage, AI confidence score, "
        "monthly breakdown, quarterly projection matrix, forecast trend, "
        "forecast accuracy, sales velocity, and dynamic insights. "
        "**Manager or Admin role required.**"
    ),
    dependencies=[Depends(require_role("manager", "admin"))],
    tags=["Dashboard"],
)
async def get_manager_forecast(
    current_user: CurrentUser,
    db: DBSession,
    period: str = Query(
        default="monthly",
        description="Aggregation period: monthly | quarterly | yearly",
    ),
) -> dict:
    """
    GET /api/v1/dashboard/manager/forecast?period=monthly

    Secured: JWT required + manager / admin role.
    All data is scoped to the caller's organization_id.
    Zero values are returned when no forecast data exists -- never 500.
    """
    controller = ForecastController(db)
    data = await controller.get_manager_forecast(
        organization_id=current_user.organization_id,
        period=period,
    )
    return {
        "success": True,
        "message": "Forecast KPIs retrieved successfully.",
        "data": data,
    }


# -----------------------------------------------------------------------------
# Forecast sub-endpoints
# All require manager or admin role and are scoped to the caller's org.
# -----------------------------------------------------------------------------

@router.get(
    "/manager/forecast/monthly",
    response_model=StandardResponse[list[MonthlyForecastPoint]],
    summary="Monthly Forecast Breakdown",
    dependencies=[Depends(require_role("manager", "admin"))],
    tags=["Dashboard"],
)
async def get_forecast_monthly(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """GET /api/v1/dashboard/manager/forecast/monthly -- last 6 months breakdown."""
    from app.services.forecast_service import ForecastService
    svc = ForecastService(db)
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    points = await svc._build_monthly_forecast(current_user.organization_id, now)
    return {"success": True, "message": "OK", "data": points}


@router.get(
    "/manager/forecast/quarterly",
    response_model=StandardResponse[list[QuarterlyProjectionRow]],
    summary="Quarterly Projection Matrix",
    dependencies=[Depends(require_role("manager", "admin"))],
    tags=["Dashboard"],
)
async def get_forecast_quarterly(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """GET /api/v1/dashboard/manager/forecast/quarterly -- 4-quarter matrix."""
    from app.services.forecast_service import ForecastService
    svc = ForecastService(db)
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    rows = await svc._build_quarterly_projection(current_user.organization_id, now)
    return {"success": True, "message": "OK", "data": rows}


@router.get(
    "/manager/forecast/accuracy",
    response_model=StandardResponse[ForecastAccuracyStats],
    summary="Forecast Accuracy",
    dependencies=[Depends(require_role("manager", "admin"))],
    tags=["Dashboard"],
)
async def get_forecast_accuracy(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """GET /api/v1/dashboard/manager/forecast/accuracy -- current vs prev month accuracy."""
    from app.repositories.forecast_repository import ForecastRepository
    from app.services.forecast_service import ForecastService
    from datetime import datetime, timezone
    repo = ForecastRepository(db)
    svc = ForecastService(db)
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start, last_month_end = svc._month_bounds(now, 1)
    cur = await repo.get_forecast_accuracy_data(current_user.organization_id, month_start, now)
    prev = await repo.get_forecast_accuracy_data(current_user.organization_id, last_month_start, last_month_end)
    from decimal import Decimal
    def _pct(a, b): return (a * Decimal("100")) / b if b > 0 else Decimal("0")
    cur_acc = min(_pct(cur["actual"], max(cur["forecast"], Decimal("1"))), Decimal("100"))
    prev_acc = min(_pct(prev["actual"], max(prev["forecast"], Decimal("1"))), Decimal("100"))
    data = ForecastAccuracyStats(
        current_accuracy_pct=cur_acc,
        previous_accuracy_pct=prev_acc,
        difference_pct=cur_acc - prev_acc,
    )
    return {"success": True, "message": "OK", "data": data}


@router.get(
    "/manager/forecast/revenue-trend",
    response_model=StandardResponse[list[ForecastTrendPoint]],
    summary="Revenue Forecast Trend",
    dependencies=[Depends(require_role("manager", "admin"))],
    tags=["Dashboard"],
)
async def get_forecast_revenue_trend(
    current_user: CurrentUser,
    db: DBSession,
    period: str = Query(default="monthly", description="monthly | quarterly | yearly"),
) -> dict:
    """GET /api/v1/dashboard/manager/forecast/revenue-trend -- trend by period."""
    from app.services.forecast_service import ForecastService
    from datetime import datetime, timezone
    svc = ForecastService(db)
    now = datetime.now(timezone.utc)
    points = await svc._build_forecast_trend(current_user.organization_id, now, period)
    return {"success": True, "message": "OK", "data": points}


@router.get(
    "/manager/forecast/insights",
    response_model=StandardResponse[list[ForecastInsight]],
    summary="Forecast Insights",
    dependencies=[Depends(require_role("manager", "admin"))],
    tags=["Dashboard"],
)
async def get_forecast_insights(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """GET /api/v1/dashboard/manager/forecast/insights -- rule-based AI insights."""
    controller = ForecastController(db)
    data = await controller.get_manager_forecast(
        organization_id=current_user.organization_id, period="monthly"
    )
    return {"success": True, "message": "OK", "data": data.forecast_insights}


@router.get(
    "/manager/forecast/risks",
    response_model=StandardResponse[list[ForecastRisk]],
    summary="Forecast Risks",
    dependencies=[Depends(require_role("manager", "admin"))],
    tags=["Dashboard"],
)
async def get_forecast_risks(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """GET /api/v1/dashboard/manager/forecast/risks -- aging, overdue, low-prob deals."""
    from app.repositories.forecast_repository import ForecastRepository
    from app.services.forecast_service import ForecastService
    repo = ForecastRepository(db)
    svc = ForecastService(db)
    raw = await repo.get_forecast_risks(current_user.organization_id)
    risks = svc._build_forecast_risks(raw)
    return {"success": True, "message": "OK", "data": risks}


@router.get(
    "/manager/forecast/recommendations",
    response_model=StandardResponse[list[ForecastRecommendation]],
    summary="Forecast Recommendations",
    dependencies=[Depends(require_role("manager", "admin"))],
    tags=["Dashboard"],
)
async def get_forecast_recommendations(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """GET /api/v1/dashboard/manager/forecast/recommendations -- rule-based actions."""
    controller = ForecastController(db)
    data = await controller.get_manager_forecast(
        organization_id=current_user.organization_id, period="monthly"
    )
    return {"success": True, "message": "OK", "data": data.forecast_recommendations}


