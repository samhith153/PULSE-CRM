"""
Manual activity routes.
"""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.activity import ActivityTimelineCreateRequest, ActivityTimelineResponse
from app.schemas.common import PaginatedResponse, StandardResponse
from app.services.activity_service import ActivityService

router = APIRouter()


@router.get(
    "",
    response_model=StandardResponse[PaginatedResponse[ActivityTimelineResponse]],
    summary="List activity timeline events",
    description="Compatibility alias for /activity so frontend clients can use /activities.",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def list_activities(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    entity_type: Optional[str] = Query(default=None),
    entity_id: Optional[UUID] = Query(default=None),
    action: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
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
    )
    paginated = PaginatedResponse.create(
        data=[ActivityTimelineResponse.model_validate(event) for event in events],
        total=total,
        page=page,
        page_size=page_size,
    )
    return {"success": True, "message": "OK", "data": paginated}


@router.post(
    "",
    response_model=StandardResponse[ActivityTimelineResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a manual activity",
    dependencies=[Depends(require_permission("activity:create"))],
)
async def create_activity(payload: ActivityTimelineCreateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    service = ActivityService(db)
    activity = await service.create(current_user.organization_id, current_user.id, payload)
    return {"success": True, "message": "Activity created.", "data": ActivityTimelineResponse.model_validate(activity)}
