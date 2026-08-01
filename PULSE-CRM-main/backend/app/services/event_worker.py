"""Durable event worker for the EventOutbox table."""
from __future__ import annotations

import asyncio
from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import settings
from app.database.connection import AsyncSessionFactory
from app.models.event_outbox import EventOutbox
from app.repositories.event_repository import EventRepository
from app.services.event_bus import EventBus, EventEnvelope, event_bus
from app.services.event_consumers import EmailProjectionConsumer, LoggingConsumer, TimelineProjectionConsumer, parse_aggregate_uuid


class EventWorker:
    def __init__(
        self,
        bus: EventBus | None = None,
        session_factory: async_sessionmaker[AsyncSession] | None = None,
        max_attempts: int = 5,
    ) -> None:
        self.bus = bus or event_bus
        self.session_factory = session_factory or AsyncSessionFactory
        self.max_attempts = max_attempts

    async def run_once(self, batch_size: int = 50) -> int:
        processed = 0
        async with self.session_factory() as db:
            repository = EventRepository(db)
            for event in await repository.list_pending(limit=batch_size):
                try:
                    await self._dispatch_outbox_event(db, event)
                    await repository.mark_processed(event)
                    processed += 1
                except Exception as exc:
                    await repository.mark_retry(event, str(exc), max_attempts=self.max_attempts)
            await db.commit()
        await self.bus.dispatch_once()
        return processed

    async def run_forever(self, sleep_seconds: float = 1.0) -> None:  # pragma: no cover - loop helper
        while True:
            await self.run_once()
            await asyncio.sleep(sleep_seconds)

    async def _dispatch_outbox_event(self, db: AsyncSession, event: EventOutbox) -> None:
        envelope = self._to_envelope(event)
        consumers = [
            TimelineProjectionConsumer(db),
            EmailProjectionConsumer(),
            LoggingConsumer(),
        ]
        for consumer in consumers:
            await consumer.handle(envelope)

    def _to_envelope(self, event: EventOutbox) -> EventEnvelope:
        payload = dict(event.payload or {})
        topic = str(payload.get("topic") or event.aggregate_type or event.event_type)
        title = str(payload.get("title") or event.event_name)
        description = payload.get("description")
        organization_id = event.organization_id or UUID(int=0)
        return EventEnvelope(
            event_id=event.id,
            organization_id=organization_id,
            aggregate_type=event.aggregate_type or "event",
            aggregate_id=parse_aggregate_uuid(event.aggregate_id),
            event_type=event.event_type,
            topic=topic,
            title=title,
            description=str(description) if description is not None else None,
            payload=payload,
            source=event.source,
            status=event.processing_status,
            created_at=event.created_at or event.occurred_at or datetime.utcnow(),
        )
