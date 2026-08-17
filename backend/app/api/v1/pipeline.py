"""
Pipeline routes.
"""
from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status

logger = logging.getLogger(__name__)

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


async def _run_assessment_in_background(
    lead_id: UUID,
    organization_id: UUID,
    created_by: UUID,
    stage_slug: Optional[str] = None,
) -> None:
    """Run AI assessment after the response is sent (fire-and-forget)."""
    from app.database.connection import AsyncSessionFactory
    from app.services.ai_pipeline import run_lead_assessment

    logger.info("[PIPELINE] Starting background assessment for lead=%s org=%s stage_slug=%s", lead_id, organization_id, stage_slug)
    async with AsyncSessionFactory() as session:
        try:
            result = await run_lead_assessment(
                session, lead_id, organization_id, created_by,
                trigger="deal_stage_changed",
                stage_override=stage_slug,
            )
            if result is None:
                logger.warning("[PIPELINE] Background assessment returned None for lead=%s (lead not found or AI unavailable)", lead_id)
            else:
                overall = result.get("overall", {}).get("score") if isinstance(result, dict) else None
                logger.info("[PIPELINE] Background assessment succeeded for lead=%s — score=%s", lead_id, overall)
            await session.commit()
        except Exception:
            logger.exception("[PIPELINE] Background assessment FAILED for lead=%s", lead_id)
            await session.rollback()


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
        data=[DealResponse.from_deal(deal) for deal in deals],
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
async def move_deal(
    payload: PipelineMoveRequest,
    current_user: CurrentUser,
    db: DBSession,
    background_tasks: BackgroundTasks,
) -> dict:
    svc = PipelineService(db)
    deal = await svc.move_deal(
        current_user.organization_id,
        current_user.id,
        payload.deal_id,
        payload.stage_id,
        payload.close_reason,
    )
    await db.flush()
    if deal.lead_id:
        from sqlalchemy import select
        from app.models.pipeline import PipelineStage
        stage_stmt = select(PipelineStage.slug).where(
            PipelineStage.id == payload.stage_id,
            PipelineStage.organization_id == current_user.organization_id,
        )
        stage_result = await db.execute(stage_stmt)
        stage_slug = stage_result.scalar_one_or_none()
        background_tasks.add_task(
            _run_assessment_in_background,
            deal.lead_id, current_user.organization_id, current_user.id,
            stage_slug=stage_slug,
        )
    return {"success": True, "message": "Deal moved."}
