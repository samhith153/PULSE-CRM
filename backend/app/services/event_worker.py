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
from app.services.event_consumers import EmailProjectionConsumer, LoggingConsumer, NotificationConsumer, TimelineProjectionConsumer, parse_aggregate_uuid


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
            pending_events = await repository.list_pending(limit=batch_size)
            for event in pending_events:
                event_id = event.id
                try:
                    envelope = self._to_envelope(event)
                    # Phase 1: run consumers (flushes notification rows, timeline, etc.)
                    consumers = [
                        TimelineProjectionConsumer(db),
                        NotificationConsumer(db),
                        EmailProjectionConsumer(),
                        LoggingConsumer(),
                    ]
                    for consumer in consumers:
                        await consumer.handle(envelope)
                    # Commit BEFORE publishing SSE so the frontend query can see the rows
                    await db.commit()
                    # Phase 2: publish to event bus (SSE push + subscribers)
                    await self.bus.publish(envelope)
                    # Mark processed (re-fetch after commit since session was reset)
                    fresh = await repository.get_by_id(event_id)
                    if fresh:
                        await repository.mark_processed(fresh)
                        await db.commit()
                    processed += 1
                except Exception as exc:
                    try:
                        await db.rollback()
                    except Exception:
                        pass
                    try:
                        fresh = await repository.get_by_id(event_id)
                        if fresh:
                            await repository.mark_retry(fresh, str(exc), max_attempts=self.max_attempts)
                            await db.commit()
                    except Exception:
                        pass
        return processed

    async def run_forever(self, sleep_seconds: float = 1.0) -> None:  # pragma: no cover - loop helper
        while True:
            await self.run_once()
            await asyncio.sleep(sleep_seconds)

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
            actor_id=event.actor_id,
        )
