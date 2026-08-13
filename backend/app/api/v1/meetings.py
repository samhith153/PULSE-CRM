"""
Meeting routes.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import PaginatedResponse, StandardResponse
from app.schemas.meeting import MeetingCreateRequest, MeetingResponse, MeetingUpdateRequest
from app.services.meeting_service import MeetingService

router = APIRouter()


@router.get(
    "",
    response_model=StandardResponse[PaginatedResponse[MeetingResponse]],
    summary="List meetings",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def list_meetings(
    current_user: CurrentUser,
    db: DBSession,
    status: Optional[str] = Query(default=None),
    start_datetime: Optional[datetime] = Query(default=None),
    end_datetime: Optional[datetime] = Query(default=None),
    related_lead_id: Optional[UUID] = Query(default=None),
    related_contact_id: Optional[UUID] = Query(default=None),
    related_company_id: Optional[UUID] = Query(default=None),
    related_deal_id: Optional[UUID] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    svc = MeetingService(db)
    meetings, total = await svc.list_meetings(
        current_user,
        status=status,
        start=start_datetime,
        end=end_datetime,
        related_lead_id=related_lead_id,
        related_contact_id=related_contact_id,
        related_company_id=related_company_id,
        related_deal_id=related_deal_id,
        page=page,
        page_size=page_size,
    )
    data = PaginatedResponse.create(data=meetings, total=total, page=page, page_size=page_size)
    return {"success": True, "message": "Meetings retrieved.", "data": data}


@router.get(
    "/today",
    response_model=StandardResponse[list[MeetingResponse]],
    summary="Get today's meetings",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def get_today_meetings(current_user: CurrentUser, db: DBSession) -> dict:
    svc = MeetingService(db)
    data = await svc.today_meetings(current_user)
    return {"success": True, "message": "Today's meetings retrieved.", "data": data}


@router.get(
    "/upcoming",
    response_model=StandardResponse[list[MeetingResponse]],
    summary="Get upcoming meetings",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def get_upcoming_meetings(
    current_user: CurrentUser,
    db: DBSession,
    limit: int = Query(default=10, ge=1, le=50),
) -> dict:
    svc = MeetingService(db)
    data = await svc.upcoming_meetings(current_user, limit=limit)
    return {"success": True, "message": "Upcoming meetings retrieved.", "data": data}


@router.post(
    "",
    response_model=StandardResponse[MeetingResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create meeting",
    dependencies=[Depends(require_permission("activity:create"))],
)
async def create_meeting(
    payload: MeetingCreateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = MeetingService(db)
    data = await svc.create_meeting(current_user, payload)
    return {"success": True, "message": "Meeting created.", "data": data}


@router.get(
    "/{meeting_id}",
    response_model=StandardResponse[MeetingResponse],
    summary="Get meeting",
    dependencies=[Depends(require_permission("activity:read"))],
)
async def get_meeting(meeting_id: UUID, current_user: CurrentUser, db: DBSession) -> dict:
    svc = MeetingService(db)
    data = await svc.get_meeting(current_user, meeting_id)
    return {"success": True, "message": "OK", "data": data}


@router.put(
    "/{meeting_id}",
    response_model=StandardResponse[MeetingResponse],
    summary="Update meeting",
    dependencies=[Depends(require_permission("activity:update"))],
)
async def update_meeting(
    meeting_id: UUID,
    payload: MeetingUpdateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = MeetingService(db)
    data = await svc.update_meeting(current_user, meeting_id, payload)
    return {"success": True, "message": "Meeting updated.", "data": data}


@router.delete(
    "/{meeting_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
    summary="Delete meeting",
    dependencies=[Depends(require_permission("activity:update"))],
)
async def delete_meeting(meeting_id: UUID, current_user: CurrentUser, db: DBSession) -> None:
    svc = MeetingService(db)
    await svc.delete_meeting(current_user, meeting_id)
