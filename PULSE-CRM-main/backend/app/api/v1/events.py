from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.event_repository import EventRepository
from app.schemas.event_outbox import EventCreate, EventListResponse, EventRead
from app.services.event_service import EventService

try:
    from app.database.connection import get_db as get_session
except ImportError:  # pragma: no cover
    try:
        from app.database.connection import get_session  # type: ignore
    except ImportError:  # pragma: no cover
        from app.database.connection import get_async_session as get_session  # type: ignore


router = APIRouter(tags=["Events"])


def get_event_service(session: AsyncSession = Depends(get_session)) -> EventService:
    return EventService(EventRepository(session))


@router.get("", response_model=EventListResponse)
async def list_events(
    service: Annotated[EventService, Depends(get_event_service)],
    organization_id: UUID | None = None,
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
            organization_id=organization_id,
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


@router.get("/{event_id}", response_model=EventRead)
async def get_event(
    event_id: UUID,
    service: Annotated[EventService, Depends(get_event_service)],
) -> EventRead:
    event = await service.get_event(event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventCreate,
    service: Annotated[EventService, Depends(get_event_service)],
) -> EventRead:
    try:
        return await service.create(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
