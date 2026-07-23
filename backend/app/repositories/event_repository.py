from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event_outbox import EventOutbox


class EventRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, event: EventOutbox) -> EventOutbox:
        self.session.add(event)
        await self.session.flush()
        await self.session.refresh(event)
        return event

    async def create_event(self, event: EventOutbox) -> EventOutbox:
        return await self.create(event)

    async def get_by_id(self, event_id: UUID) -> EventOutbox | None:
        result = await self.session.execute(select(EventOutbox).where(EventOutbox.id == event_id))
        return result.scalar_one_or_none()

    async def get(self, event_id: UUID) -> EventOutbox | None:
        return await self.get_by_id(event_id)

    async def list_events(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        organization_id: UUID | None = None,
        event_type: str | None = None,
        aggregate_type: str | None = None,
        aggregate_id: str | None = None,
        actor_id: UUID | None = None,
        source: str | None = None,
        since: datetime | None = None,
        until: datetime | None = None,
    ) -> tuple[list[EventOutbox], int]:
        filters: list[Any] = []
        if organization_id is not None:
            filters.append(EventOutbox.organization_id == organization_id)
        if event_type is not None:
            filters.append(EventOutbox.event_type == event_type)
        if aggregate_type is not None:
            filters.append(EventOutbox.aggregate_type == aggregate_type)
        if aggregate_id is not None:
            filters.append(EventOutbox.aggregate_id == aggregate_id)
        if actor_id is not None:
            filters.append(EventOutbox.actor_id == actor_id)
        if source is not None:
            filters.append(EventOutbox.source == source)
        if since is not None:
            filters.append(EventOutbox.occurred_at >= since)
        if until is not None:
            filters.append(EventOutbox.occurred_at <= until)

        base_query = select(EventOutbox)
        if filters:
            base_query = base_query.where(and_(*filters))

        total_result = await self.session.execute(select(func.count()).select_from(base_query.subquery()))
        total = int(total_result.scalar_one())

        query = base_query.order_by(desc(EventOutbox.occurred_at), desc(EventOutbox.id)).offset(offset).limit(limit)
        result = await self.session.execute(query)
        events = list(result.scalars().all())
        return events, total

    async def list(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        organization_id: UUID | None = None,
        event_type: str | None = None,
        aggregate_type: str | None = None,
        aggregate_id: str | None = None,
        actor_id: UUID | None = None,
        source: str | None = None,
        since: datetime | None = None,
        until: datetime | None = None,
    ) -> tuple[list[EventOutbox], int]:
        return await self.list_events(
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
