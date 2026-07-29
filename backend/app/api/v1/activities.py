"""
Activities routes — timeline list, manual creation, and Audit Logs sub-module.
"""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.controllers.audit_log_controller import AuditLogController
from app.schemas.activity import ActivityTimelineCreateRequest, ActivityTimelineResponse
from app.schemas.audit_log import (
    AuditLogEntry,
    AuditLogListResponse,
    AuditLogStatisticsResponse,
)
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


# ─────────────────────────────────────────────────────────────────────────────
# Audit Logs sub-module
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/audit-logs",
    response_model=StandardResponse[AuditLogListResponse],
    summary="Audit Logs — chronological CRM activity history",
    description=(
        "Returns a paginated, chronological list of all CRM audit log entries "
        "scoped by the caller's RBAC role:\n"
        "- **sales_rep** → own activities only\n"
        "- **manager** → own + entire team\n"
        "- **admin** → entire organization\n\n"
        "Supports `date_filter` (today | week | month | all), `activity_type`, "
        "`search` (ILIKE on title, description, action, entity_type, user name), "
        "and standard `page` / `page_size` pagination."
    ),
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["Activities"],
)
async def get_audit_logs(
    current_user: CurrentUser,
    db: DBSession,
    date_filter: Optional[str] = Query(
        default=None,
        description="Time window: today | week | month | all",
    ),
    activity_type: Optional[str] = Query(
        default=None,
        description="Filter by exact action type, e.g. deal_won, email_sent",
    ),
    search: Optional[str] = Query(
        default=None,
        description="Global ILIKE search across title, description, action, entity_type, user name",
    ),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    """
    GET /api/v1/activities/audit-logs

    JWT required + activity:read permission.
    RBAC scope is resolved automatically from the caller's role.
    """
    ctrl = AuditLogController(db)
    data = await ctrl.get_audit_logs(
        current_user,
        date_filter=date_filter,
        activity_type=activity_type,
        search=search,
        page=page,
        page_size=page_size,
    )
    return {"success": True, "message": "Audit logs retrieved successfully.", "data": data}


@router.get(
    "/statistics",
    response_model=StandardResponse[AuditLogStatisticsResponse],
    summary="Activity statistics — today / week / month counts + type breakdown",
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["Activities"],
)
async def get_activity_statistics(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """
    GET /api/v1/activities/statistics

    Returns:
      todayActivities, weekActivities, monthActivities,
      emails, calls, meetings, notes
    """
    ctrl = AuditLogController(db)
    data = await ctrl.get_statistics(current_user)
    return {"success": True, "message": "Statistics retrieved successfully.", "data": data}


@router.get(
    "/recent",
    response_model=StandardResponse[list[AuditLogEntry]],
    summary="Recent activities — latest N audit log entries",
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["Activities"],
)
async def get_recent_activities(
    current_user: CurrentUser,
    db: DBSession,
    limit: int = Query(default=10, ge=1, le=50),
) -> dict:
    """
    GET /api/v1/activities/recent?limit=10

    Returns the most recent audit log entries within the caller's RBAC scope.
    """
    ctrl = AuditLogController(db)
    data = await ctrl.get_recent(current_user, limit=limit)
    return {"success": True, "message": "Recent activities retrieved successfully.", "data": data}


@router.get(
    "/search",
    response_model=StandardResponse[AuditLogListResponse],
    summary="Search audit logs",
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["Activities"],
)
async def search_audit_logs(
    current_user: CurrentUser,
    db: DBSession,
    q: str = Query(description="Search term — matches user name, lead, company, deal, description, activity type"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    """
    GET /api/v1/activities/search?q=Sarah

    Full-text ILIKE search across all audit log text fields.
    RBAC scope is applied automatically.
    """
    ctrl = AuditLogController(db)
    data = await ctrl.search(current_user, q, page=page, page_size=page_size)
    return {"success": True, "message": "Search results retrieved successfully.", "data": data}
