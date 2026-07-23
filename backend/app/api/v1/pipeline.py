"""
Pipeline routes.
"""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import PaginatedResponse, StandardResponse
from app.schemas.deal import DealResponse
from app.schemas.pipeline import (
    PipelineBoardResponse,
    PipelineForecastResponse,
    PipelineMoveRequest,
    PipelineStageCreateRequest,
    PipelineStageResponse,
    PipelineStageUpdateRequest,
    PipelineStatisticsResponse,
)
from app.services.pipeline_service import PipelineService

router = APIRouter()


@router.get(
    "",
    response_model=StandardResponse[PipelineBoardResponse],
    summary="Get pipeline board",
    dependencies=[Depends(require_permission("pipeline:read"))],
)
async def get_pipeline(current_user: CurrentUser, db: DBSession) -> dict:
    svc = PipelineService(db)
    board = await svc.get_board(current_user.organization_id, current_user.id)
    return {"success": True, "message": "OK", "data": board}


@router.get(
    "/forecast",
    response_model=StandardResponse[PipelineForecastResponse],
    summary="Get pipeline forecast",
    dependencies=[Depends(require_permission("pipeline:read"))],
)
async def get_forecast(current_user: CurrentUser, db: DBSession) -> dict:
    svc = PipelineService(db)
    forecast = await svc.forecast(current_user.organization_id, current_user.id)
    return {"success": True, "message": "OK", "data": forecast}


@router.get(
    "/stats",
    response_model=StandardResponse[PipelineStatisticsResponse],
    summary="Get pipeline statistics",
    dependencies=[Depends(require_permission("pipeline:read"))],
)
async def get_stats(current_user: CurrentUser, db: DBSession) -> dict:
    svc = PipelineService(db)
    stats = await svc.statistics(current_user.organization_id, current_user.id)
    return {"success": True, "message": "OK", "data": stats}


@router.get(
    "/stages",
    response_model=StandardResponse[list[PipelineStageResponse]],
    summary="List pipeline stages",
    dependencies=[Depends(require_permission("pipeline:read"))],
)
async def list_stages(
    current_user: CurrentUser,
    db: DBSession,
    include_inactive: bool = Query(default=False),
) -> dict:
    svc = PipelineService(db)
    stages = await svc.list_stages(current_user.organization_id, current_user.id, include_inactive=include_inactive)
    return {"success": True, "message": "OK", "data": [PipelineStageResponse.model_validate(stage) for stage in stages]}


@router.post(
    "/stages",
    response_model=StandardResponse[PipelineStageResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create pipeline stage",
    dependencies=[Depends(require_permission("pipeline:update"))],
)
async def create_stage(
    payload: PipelineStageCreateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = PipelineService(db)
    stage = await svc.create_stage(current_user.organization_id, current_user.id, payload)
    return {"success": True, "message": "Pipeline stage created.", "data": PipelineStageResponse.model_validate(stage)}


@router.put(
    "/stages/{stage_id}",
    response_model=StandardResponse[PipelineStageResponse],
    summary="Update pipeline stage",
    dependencies=[Depends(require_permission("pipeline:update"))],
)
async def update_stage(
    stage_id: UUID,
    payload: PipelineStageUpdateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = PipelineService(db)
    stage = await svc.update_stage(current_user.organization_id, current_user.id, stage_id, payload)
    return {"success": True, "message": "Pipeline stage updated.", "data": PipelineStageResponse.model_validate(stage)}


@router.delete(
    "/stages/{stage_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Delete pipeline stage",
    dependencies=[Depends(require_permission("pipeline:update"))],
)
async def delete_stage(stage_id: UUID, current_user: CurrentUser, db: DBSession) -> None:
    svc = PipelineService(db)
    await svc.delete_stage(current_user.organization_id, stage_id)


@router.get(
    "/stages/{stage_id}/deals",
    response_model=StandardResponse[PaginatedResponse[DealResponse]],
    summary="List deals in a pipeline stage",
    dependencies=[Depends(require_permission("deal:read"))],
)
async def list_stage_deals(
    stage_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
) -> dict:
    svc = PipelineService(db)
    deals, total = await svc.list_deals_by_stage(current_user.organization_id, stage_id, page, page_size, search)
    paginated = PaginatedResponse.create(
        data=[DealResponse.model_validate(deal) for deal in deals],
        total=total,
        page=page,
        page_size=page_size,
    )
    return {"success": True, "message": "OK", "data": paginated}


@router.patch(
    "/move",
    response_model=StandardResponse[PipelineBoardResponse],
    summary="Move deal between pipeline stages",
    description="Updates the deal stage, probability, and close state in a single transactional operation.",
    dependencies=[Depends(require_permission("pipeline:update"))],
)
async def move_deal(payload: PipelineMoveRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = PipelineService(db)
    await svc.move_deal(
        current_user.organization_id,
        current_user.id,
        payload.deal_id,
        payload.stage_id,
        payload.close_reason,
    )
    board = await svc.get_board(current_user.organization_id, current_user.id)
    return {"success": True, "message": "Deal moved.", "data": board}
