"""
Dashboard routes.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import StandardResponse
from app.schemas.dashboard import (
    DashboardAnalyticsResponse,
    DashboardRevenuePoint,
    DashboardStatsResponse,
    DashboardSummaryResponse,
    DashboardTrendResponse,
    TopSalesRepresentativeResponse,
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
