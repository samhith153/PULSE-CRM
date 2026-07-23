"""
Activity Timeline Routes
GET /api/v1/activity
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.activity import ActivityTimelineResponse
from app.schemas.common import PaginatedResponse, StandardResponse
from app.services.activity_service import ActivityService

router = APIRouter()


@router.get(
    "",
    response_model=StandardResponse[PaginatedResponse[ActivityTimelineResponse]],
    summary="List activity timeline events",
    description="Returns audit/activity events for the current organization, with filters and pagination.",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def list_activity(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    entity_type: Optional[str] = Query(default=None),
    entity_id: Optional[UUID] = Query(default=None),
    action: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
) -> dict:
    svc = ActivityService(db)
    events, total = await svc.list(
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
