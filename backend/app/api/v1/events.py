from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DBSession, require_permission
from app.database.connection import get_db
from app.repositories.event_repository import EventRepository
from app.schemas.event_outbox import EventCreate, EventListResponse, EventRead
from app.services.event_service import EventService


router = APIRouter(tags=["Events"])


def get_event_service(session: AsyncSession = Depends(get_db)) -> EventService:
    return EventService(EventRepository(session))


@router.get(
    "",
    response_model=EventListResponse,
    dependencies=[Depends(require_permission("event:read"))],
)
async def list_events(
    current_user: CurrentUser,
    service: Annotated[EventService, Depends(get_event_service)],
    event_type: str | None = None,
    aggregate_type: str | None = None,
    aggregate_id: str | None = None,
    actor_id: UUID | None = None,
    source: str | None = None,
    since: datetime | None = None,
    until: datetime | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> EventListResponse:
    try:
        return await service.list_events(
            limit=limit,
            offset=offset,
            organization_id=current_user.organization_id,
            event_type=event_type,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            actor_id=actor_id,
            source=source,
            since=since,
            until=until,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get(
    "/{event_id}",
    response_model=EventRead,
    dependencies=[Depends(require_permission("event:read"))],
)
async def get_event(
    event_id: UUID,
    current_user: CurrentUser,
    service: Annotated[EventService, Depends(get_event_service)],
) -> EventRead:
    event = await service.get_event(event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if event.organization_id and str(event.organization_id) != str(current_user.organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


@router.post(
    "",
    response_model=EventRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("event:create"))],
)
async def create_event(
    current_user: CurrentUser,
    payload: EventCreate,
    service: Annotated[EventService, Depends(get_event_service)],
) -> EventRead:
    payload.organization_id = current_user.organization_id
    try:
        return await service.create(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
