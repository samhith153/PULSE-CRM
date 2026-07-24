from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import and_, desc, func, or_, select
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

    async def list_pending(self, limit: int = 50) -> list[EventOutbox]:
        now = datetime.now(timezone.utc)
        result = await self.session.execute(
            select(EventOutbox)
            .where(
                EventOutbox.processing_status.in_(["pending", "retrying"]),
                or_(EventOutbox.next_attempt_at.is_(None), EventOutbox.next_attempt_at <= now),
            )
            .order_by(EventOutbox.occurred_at.asc(), EventOutbox.id.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_processed(self, event: EventOutbox) -> EventOutbox:
        event.processing_status = "processed"
        event.processed_at = datetime.now(timezone.utc)
        event.last_error = None
        self.session.add(event)
        await self.session.flush()
        return event

    async def mark_retry(self, event: EventOutbox, error: str, max_attempts: int = 5) -> EventOutbox:
        from datetime import timedelta

        event.attempts += 1
        event.last_error = error[:2000]
        if event.attempts >= max_attempts:
            event.processing_status = "failed"
            event.next_attempt_at = None
        else:
            event.processing_status = "retrying"
            event.next_attempt_at = datetime.now(timezone.utc) + timedelta(minutes=2 ** max(0, event.attempts - 1))
        self.session.add(event)
        await self.session.flush()
        return event

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

    async def list(self, **kwargs: Any) -> tuple[list[EventOutbox], int]:
        return await self.list_events(**kwargs)
