"""
Unified CRM Activities API
All activity types (task / call / meeting / email / note) under /api/v1/crm-activities
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.activity_timeline import (
    ActivitySummaryResponse,
    TimelineListResponse,
)
from app.schemas.common import PaginatedResponse, StandardResponse
from app.schemas.crm_activities import (
    BulkDeleteRequest,
    BulkOperationResponse,
    BulkUpdateRequest,
    CallCreateRequest,
    CallResponse,
    CallUpdateRequest,
    EmailCreateRequest,
    EmailResponse,
    EmailUpdateRequest,
    NoteCreateRequest,
    NoteResponse,
    NoteUpdateRequest,
    OwnerItem,
    TaskCreateRequest,
    TaskResponse,
    TaskUpdateRequest,
    UnifiedActivityItem,
)
from app.schemas.meeting import MeetingCreateRequest, MeetingResponse, MeetingUpdateRequest
from app.services.activity_timeline_service import ActivityTimelineService
from app.services.crm_activities_service import CrmActivitiesService
from app.services.meeting_service import MeetingService

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# UNIFIED LIST  GET /crm-activities
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=StandardResponse[PaginatedResponse[UnifiedActivityItem]],
    summary="List all activities (unified)",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def list_activities(
    current_user: CurrentUser,
    db: DBSession,
    view: Optional[str] = Query(default=None, description="timeline|task|call|meeting|email|note"),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None),
    owner_id: Optional[UUID] = Query(default=None),
    from_date: Optional[datetime] = Query(default=None),
    to_date: Optional[datetime] = Query(default=None),
    quick_tab: Optional[str] = Query(default=None, description="all|today|upcoming|overdue"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    svc = CrmActivitiesService(db)
    items, total = await svc.list_unified(
        current_user,
        view=view,
        search=search,
        status=status,
        priority=priority,
        owner_id=owner_id,
        from_date=from_date,
        to_date=to_date,
        quick_tab=quick_tab,
        page=page,
        page_size=page_size,
        sort_order=sort_order,
    )
    paginated = PaginatedResponse.create(data=items, total=total, page=page, page_size=page_size)
    return {"success": True, "message": "OK", "data": paginated}


# ─────────────────────────────────────────────────────────────────────────────
# OWNERS list  GET /crm-activities/owners
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/owners",
    response_model=StandardResponse[list[OwnerItem]],
    summary="List activity owners for filter dropdown",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def list_owners(current_user: CurrentUser, db: DBSession) -> dict:
    svc = CrmActivitiesService(db)
    owners = await svc.list_owners(current_user)
    return {"success": True, "message": "OK", "data": owners}


# ─────────────────────────────────────────────────────────────────────────────
# EXPORT  GET /crm-activities/export
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/export",
    summary="Export filtered activities as CSV",
    dependencies=[Depends(require_permission("activity:read"))],
    response_class=Response,
)
async def export_activities(
    current_user: CurrentUser,
    db: DBSession,
    view: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None),
    owner_id: Optional[UUID] = Query(default=None),
    from_date: Optional[datetime] = Query(default=None),
    to_date: Optional[datetime] = Query(default=None),
    quick_tab: Optional[str] = Query(default=None),
) -> Response:
    svc = CrmActivitiesService(db)
    csv_bytes = await svc.export_csv(
        current_user,
        view=view,
        search=search,
        status=status,
        priority=priority,
        owner_id=owner_id,
        from_date=from_date,
        to_date=to_date,
        quick_tab=quick_tab,
    )
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=activities_export.csv",
            "Content-Length": str(len(csv_bytes)),
            "Cache-Control": "no-cache",
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
# BULK  POST /crm-activities/bulk-delete  /bulk-update
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/bulk-delete",
    response_model=StandardResponse[BulkOperationResponse],
    summary="Bulk delete activities",
    dependencies=[Depends(require_permission("activity:delete"))],
)
async def bulk_delete(payload: BulkDeleteRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = CrmActivitiesService(db)
    result = await svc.bulk_delete(current_user, payload)
    return {"success": True, "message": result.message, "data": result}


@router.post(
    "/bulk-update",
    response_model=StandardResponse[BulkOperationResponse],
    summary="Bulk update activities (status / owner / archive)",
    dependencies=[Depends(require_permission("activity:update"))],
)
async def bulk_update(payload: BulkUpdateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = CrmActivitiesService(db)
    result = await svc.bulk_update(current_user, payload)
    return {"success": True, "message": result.message, "data": result}


# ─────────────────────────────────────────────────────────────────────────────
# TASKS  /crm-activities/tasks
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/tasks",
    response_model=StandardResponse[TaskResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create task",
    dependencies=[Depends(require_permission("activity:create"))],
)
async def create_task(payload: TaskCreateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = CrmActivitiesService(db)
    data = await svc.create_task(current_user, payload)
    return {"success": True, "message": "Task created.", "data": data}


@router.get(
    "/tasks",
    response_model=StandardResponse[PaginatedResponse[TaskResponse]],
    summary="List tasks",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def list_tasks(
    current_user: CurrentUser,
    db: DBSession,
    status: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None),
    owner_id: Optional[UUID] = Query(default=None),
    search: Optional[str] = Query(default=None),
    quick_tab: Optional[str] = Query(default=None),
    from_date: Optional[datetime] = Query(default=None),
    to_date: Optional[datetime] = Query(default=None),
    sort_order: str = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    svc = CrmActivitiesService(db)
    from app.repositories.crm_task_repository import CrmTaskRepository
    repo = CrmTaskRepository(db)
    scoped_owner = svc._scoped_owner_id(current_user)
    rows, total = await repo.list(
        current_user.organization_id,
        owner_id=owner_id or scoped_owner,
        status=status,
        priority=priority,
        search=search,
        from_date=from_date,
        to_date=to_date,
        quick_tab=quick_tab,
        page=page,
        page_size=page_size,
        sort_order=sort_order,
    )
    items = [TaskResponse(**r) for r in rows]
    paginated = PaginatedResponse.create(data=items, total=total, page=page, page_size=page_size)
    return {"success": True, "message": "OK", "data": paginated}


@router.get(
    "/tasks/{task_id}",
    response_model=StandardResponse[TaskResponse],
    summary="Get task",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def get_task(task_id: UUID, current_user: CurrentUser, db: DBSession) -> dict:
    svc = CrmActivitiesService(db)
    data = await svc.get_task(current_user, task_id)
    return {"success": True, "message": "OK", "data": data}


@router.patch(
    "/tasks/{task_id}",
    response_model=StandardResponse[TaskResponse],
    summary="Update task",
    dependencies=[Depends(require_permission("activity:update"))],
)
async def update_task(task_id: UUID, payload: TaskUpdateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = CrmActivitiesService(db)
    data = await svc.update_task(current_user, task_id, payload)
    return {"success": True, "message": "Task updated.", "data": data}


@router.delete(
    "/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
    summary="Delete task",
    dependencies=[Depends(require_permission("activity:delete"))],
)
async def delete_task(task_id: UUID, current_user: CurrentUser, db: DBSession) -> None:
    svc = CrmActivitiesService(db)
    await svc.delete_task(current_user, task_id)


# ─────────────────────────────────────────────────────────────────────────────
# CALLS  /crm-activities/calls
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/calls",
    response_model=StandardResponse[CallResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Log call",
    dependencies=[Depends(require_permission("activity:create"))],
)
async def create_call(payload: CallCreateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = CrmActivitiesService(db)
    data = await svc.create_call(current_user, payload)
    return {"success": True, "message": "Call logged.", "data": data}


@router.get(
    "/calls",
    response_model=StandardResponse[PaginatedResponse[CallResponse]],
    summary="List calls",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def list_calls(
    current_user: CurrentUser,
    db: DBSession,
    status: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None),
    owner_id: Optional[UUID] = Query(default=None),
    search: Optional[str] = Query(default=None),
    quick_tab: Optional[str] = Query(default=None),
    from_date: Optional[datetime] = Query(default=None),
    to_date: Optional[datetime] = Query(default=None),
    sort_order: str = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    svc = CrmActivitiesService(db)
    from app.repositories.crm_call_repository import CrmCallRepository
    repo = CrmCallRepository(db)
    scoped_owner = svc._scoped_owner_id(current_user)
    rows, total = await repo.list(
        current_user.organization_id,
        owner_id=owner_id or scoped_owner,
        status=status,
        priority=priority,
        search=search,
        from_date=from_date,
        to_date=to_date,
        quick_tab=quick_tab,
        page=page,
        page_size=page_size,
        sort_order=sort_order,
    )
    items = [CallResponse(**r) for r in rows]
    paginated = PaginatedResponse.create(data=items, total=total, page=page, page_size=page_size)
    return {"success": True, "message": "OK", "data": paginated}


@router.get(
    "/calls/{call_id}",
    response_model=StandardResponse[CallResponse],
    summary="Get call",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def get_call(call_id: UUID, current_user: CurrentUser, db: DBSession) -> dict:
    svc = CrmActivitiesService(db)
    data = await svc.get_call(current_user, call_id)
    return {"success": True, "message": "OK", "data": data}


@router.patch(
    "/calls/{call_id}",
    response_model=StandardResponse[CallResponse],
    summary="Update call",
    dependencies=[Depends(require_permission("activity:update"))],
)
async def update_call(call_id: UUID, payload: CallUpdateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = CrmActivitiesService(db)
    data = await svc.update_call(current_user, call_id, payload)
    return {"success": True, "message": "Call updated.", "data": data}


@router.delete(
    "/calls/{call_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
    summary="Delete call",
    dependencies=[Depends(require_permission("activity:delete"))],
)
async def delete_call(call_id: UUID, current_user: CurrentUser, db: DBSession) -> None:
    svc = CrmActivitiesService(db)
    await svc.delete_call(current_user, call_id)


# ─────────────────────────────────────────────────────────────────────────────
# MEETINGS  /crm-activities/meetings  (delegates to existing MeetingService)
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/meetings",
    response_model=StandardResponse[MeetingResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Schedule meeting",
    dependencies=[Depends(require_permission("activity:create"))],
)
async def create_meeting(payload: MeetingCreateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = MeetingService(db)
    data = await svc.create_meeting(current_user, payload)
    return {"success": True, "message": "Meeting scheduled.", "data": data}


@router.get(
    "/meetings",
    response_model=StandardResponse[PaginatedResponse[MeetingResponse]],
    summary="List meetings",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def list_meetings(
    current_user: CurrentUser,
    db: DBSession,
    status: Optional[str] = Query(default=None),
    from_date: Optional[datetime] = Query(default=None),
    to_date: Optional[datetime] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    svc = MeetingService(db)
    meetings, total = await svc.list_meetings(
        current_user, status=status, start=from_date, end=to_date, page=page, page_size=page_size
    )
    paginated = PaginatedResponse.create(data=meetings, total=total, page=page, page_size=page_size)
    return {"success": True, "message": "OK", "data": paginated}


@router.patch(
    "/meetings/{meeting_id}",
    response_model=StandardResponse[MeetingResponse],
    summary="Update meeting",
    dependencies=[Depends(require_permission("activity:update"))],
)
async def update_meeting(meeting_id: UUID, payload: MeetingUpdateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = MeetingService(db)
    data = await svc.update_meeting(current_user, meeting_id, payload)
    return {"success": True, "message": "Meeting updated.", "data": data}


@router.delete(
    "/meetings/{meeting_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
    summary="Delete meeting",
    dependencies=[Depends(require_permission("activity:delete"))],
)
async def delete_meeting(meeting_id: UUID, current_user: CurrentUser, db: DBSession) -> None:
    svc = MeetingService(db)
    await svc.delete_meeting(current_user, meeting_id)


# ─────────────────────────────────────────────────────────────────────────────
# NOTES  /crm-activities/notes
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/notes",
    response_model=StandardResponse[NoteResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Add note",
    dependencies=[Depends(require_permission("activity:create"))],
)
async def create_note(payload: NoteCreateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = CrmActivitiesService(db)
    data = await svc.create_note(current_user, payload)
    return {"success": True, "message": "Note added.", "data": data}


@router.get(
    "/notes",
    response_model=StandardResponse[PaginatedResponse[NoteResponse]],
    summary="List notes",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def list_notes(
    current_user: CurrentUser,
    db: DBSession,
    owner_id: Optional[UUID] = Query(default=None),
    search: Optional[str] = Query(default=None),
    sort_order: str = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    svc = CrmActivitiesService(db)
    from app.repositories.crm_note_repository import CrmNoteRepository
    repo = CrmNoteRepository(db)
    scoped_owner = svc._scoped_owner_id(current_user)
    rows, total = await repo.list(
        current_user.organization_id,
        owner_id=owner_id or scoped_owner,
        search=search,
        page=page,
        page_size=page_size,
        sort_order=sort_order,
    )
    items = [NoteResponse(**r) for r in rows]
    paginated = PaginatedResponse.create(data=items, total=total, page=page, page_size=page_size)
    return {"success": True, "message": "OK", "data": paginated}


@router.get(
    "/notes/{note_id}",
    response_model=StandardResponse[NoteResponse],
    summary="Get note",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def get_note(note_id: UUID, current_user: CurrentUser, db: DBSession) -> dict:
    svc = CrmActivitiesService(db)
    data = await svc.get_note(current_user, note_id)
    return {"success": True, "message": "OK", "data": data}


@router.patch(
    "/notes/{note_id}",
    response_model=StandardResponse[NoteResponse],
    summary="Update note",
    dependencies=[Depends(require_permission("activity:update"))],
)
async def update_note(note_id: UUID, payload: NoteUpdateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = CrmActivitiesService(db)
    data = await svc.update_note(current_user, note_id, payload)
    return {"success": True, "message": "Note updated.", "data": data}


@router.delete(
    "/notes/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
    summary="Delete note",
    dependencies=[Depends(require_permission("activity:delete"))],
)
async def delete_note(note_id: UUID, current_user: CurrentUser, db: DBSession) -> None:
    svc = CrmActivitiesService(db)
    await svc.delete_note(current_user, note_id)


# ─────────────────────────────────────────────────────────────────────────────
# EMAILS  /crm-activities/emails
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/emails",
    response_model=StandardResponse[EmailResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Log email activity",
    dependencies=[Depends(require_permission("activity:create"))],
)
async def create_email(payload: EmailCreateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = CrmActivitiesService(db)
    data = await svc.create_email(current_user, payload)
    return {"success": True, "message": "Email logged.", "data": data}


@router.get(
    "/emails",
    response_model=StandardResponse[PaginatedResponse[EmailResponse]],
    summary="List email activities",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def list_emails(
    current_user: CurrentUser,
    db: DBSession,
    owner_id: Optional[UUID] = Query(default=None),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None),
    direction: Optional[str] = Query(default=None),
    sort_order: str = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    svc = CrmActivitiesService(db)
    rows, total = await svc.list_emails(
        current_user,
        owner_id=owner_id,
        search=search,
        status=status,
        priority=priority,
        direction=direction,
        page=page,
        page_size=page_size,
        sort_order=sort_order,
    )
    items = [EmailResponse(**r) for r in rows]
    paginated = PaginatedResponse.create(data=items, total=total, page=page, page_size=page_size)
    return {"success": True, "message": "OK", "data": paginated}


@router.get(
    "/emails/{email_id}",
    response_model=StandardResponse[EmailResponse],
    summary="Get email activity",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def get_email(email_id: UUID, current_user: CurrentUser, db: DBSession) -> dict:
    svc = CrmActivitiesService(db)
    data = await svc.get_email(current_user, email_id)
    return {"success": True, "message": "OK", "data": data}


@router.patch(
    "/emails/{email_id}",
    response_model=StandardResponse[EmailResponse],
    summary="Update email activity",
    dependencies=[Depends(require_permission("activity:update"))],
)
async def update_email(email_id: UUID, payload: EmailUpdateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = CrmActivitiesService(db)
    data = await svc.update_email(current_user, email_id, payload)
    return {"success": True, "message": "Email updated.", "data": data}


@router.delete(
    "/emails/{email_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
    summary="Delete email activity",
    dependencies=[Depends(require_permission("activity:delete"))],
)
async def delete_email(email_id: UUID, current_user: CurrentUser, db: DBSession) -> None:
    svc = CrmActivitiesService(db)
    await svc.delete_email(current_user, email_id)


# ─────────────────────────────────────────────────────────────────────────────
# TIMELINE HISTORY  GET /crm-activities/{entity_type}/{entity_id}/timeline
#
# entity_type: task | call | meeting | email | note | lead | deal | contact | company
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{entity_type}/{entity_id}/timeline",
    response_model=StandardResponse[TimelineListResponse],
    summary="Get timeline history for any CRM activity entity",
    description=(
        "Returns real database-backed timeline events for the given entity.\n\n"
        "Supported entity_type values: `task`, `call`, `meeting`, `email`, `note`, "
        "`lead`, `deal`, `contact`, `company`.\n\n"
        "Results are sorted newest-first by default. "
        "Soft-deleted events are automatically excluded."
    ),
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["CRM Activities"],
)
async def get_entity_timeline(
    entity_type: str,
    entity_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    activity_type: Optional[str] = Query(
        default=None,
        description="Filter by exact action, e.g. task_created, call_logged",
    ),
    search: Optional[str] = Query(
        default=None,
        description="Search across title and description",
    ),
    date_from: Optional[datetime] = Query(default=None, description="Filter events from this datetime"),
    date_to: Optional[datetime] = Query(default=None, description="Filter events to this datetime"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$", description="Sort order"),
) -> dict:
    svc = ActivityTimelineService(db)
    result = await svc.get_entity_timeline(
        organization_id=current_user.organization_id,
        entity_type=entity_type,
        entity_id=entity_id,
        page=page,
        page_size=page_size,
        activity_type=activity_type,
        search=search,
        date_from=date_from,
        date_to=date_to,
        sort_order=sort_order,
    )
    return {"success": True, "message": "Timeline retrieved.", "data": result}


# ─────────────────────────────────────────────────────────────────────────────
# ACTIVITY SUMMARY  GET /crm-activities/{entity_type}/{entity_id}/summary
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{entity_type}/{entity_id}/summary",
    response_model=StandardResponse[ActivitySummaryResponse],
    summary="Get activity summary counts for a CRM entity",
    description=(
        "Returns aggregate counts: total_events, emails, calls, meetings, "
        "tasks, notes, latest_activity, last_updated."
    ),
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["CRM Activities"],
)
async def get_entity_summary(
    entity_type: str,
    entity_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = ActivityTimelineService(db)
    result = await svc.get_entity_summary(
        organization_id=current_user.organization_id,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    return {"success": True, "message": "Summary retrieved.", "data": result}
