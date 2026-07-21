"""
Timeline routes.
"""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.activity import ActivityTimelineResponse
from app.schemas.common import PaginatedResponse, StandardResponse
from app.services.activity_service import ActivityService
from app.utils.enums import SortOrder

router = APIRouter()


@router.get(
    "",
    response_model=StandardResponse[PaginatedResponse[ActivityTimelineResponse]],
    summary="Get organization timeline",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def get_timeline(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    entity_type: Optional[str] = Query(default=None),
    entity_id: Optional[UUID] = Query(default=None),
    action: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    sort_order: SortOrder = Query(default=SortOrder.DESC),
) -> dict:
    service = ActivityService(db)
    events, total = await service.list(
        current_user.organization_id,
        entity_type,
        entity_id,
        action,
        search,
        page,
        page_size,
        sort_order=sort_order,
    )
    paginated = PaginatedResponse.create(
        data=[ActivityTimelineResponse.model_validate(event) for event in events],
        total=total,
        page=page,
        page_size=page_size,
    )
    return {"success": True, "message": "OK", "data": paginated}


@router.get(
    "/{deal_id}",
    response_model=StandardResponse[PaginatedResponse[ActivityTimelineResponse]],
    summary="Get deal timeline",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def get_deal_timeline(
    deal_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    sort_order: SortOrder = Query(default=SortOrder.DESC),
) -> dict:
    service = ActivityService(db)
    events, total = await service.get_deal_timeline(current_user.organization_id, deal_id, page, page_size, search, sort_order)
    paginated = PaginatedResponse.create(
        data=[ActivityTimelineResponse.model_validate(event) for event in events],
        total=total,
        page=page,
        page_size=page_size,
    )
    return {"success": True, "message": "OK", "data": paginated}
