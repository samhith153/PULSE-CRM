"""
Dashboard routes.
"""
from __future__ import annotations

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
)
from app.schemas.forecast import ManagerForecastResponse
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
async def get_admin_dashboard(current_user: CurrentUser, db: DBSession) -> dict:
    """
    GET /api/v1/dashboard/admin

    Secured: JWT required + `admin` role.
    Scoped to the caller's organization_id.
    """
    svc = DashboardService(db)
    data = await svc.admin_kpi(current_user.organization_id)
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
async def get_manager_dashboard(current_user: CurrentUser, db: DBSession) -> dict:
    """
    GET /api/v1/dashboard/manager

    Secured: JWT required + `manager` or `admin` role.
    Scoped to the caller's organization_id; team = all users in the same org.
    """
    svc = DashboardService(db)
    data = await svc.manager_kpi(current_user.id, current_user.organization_id)
    return {"success": True, "message": "Manager KPIs retrieved successfully.", "data": data}


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
    Zero values are returned when no forecast data exists — never 500.
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


