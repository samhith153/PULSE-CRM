"""Event consumers for durable outbox processing."""
from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.activity import ActivityTimeline
from app.repositories.activity_repository import ActivityTimelineRepository
from app.services.event_bus import EventConsumer, EventEnvelope

logger = get_logger(__name__)


class TimelineProjectionConsumer(EventConsumer):
    def __init__(self, db: AsyncSession | None = None) -> None:
        self.db = db

    async def handle(self, event: EventEnvelope) -> None:
        if self.db is None or not event.organization_id or not event.aggregate_id:
            return
        if event.payload and event.payload.get("timeline_projected") is True:
            return
        repo = ActivityTimelineRepository(self.db)
        await repo.create(
            organization_id=event.organization_id,
            created_by=None,
            entity_type=event.aggregate_type or "event",
            entity_id=event.aggregate_id,
            action=event.event_type.lower(),
            title=event.title or event.event_type.replace("_", " ").title(),
            description=event.description,
            payload={**(event.payload or {}), "event_id": str(event.event_id)},
        )


class EmailProjectionConsumer(EventConsumer):
    async def handle(self, event: EventEnvelope) -> None:
        if event.event_type.startswith("EMAIL_"):
            logger.info("Email projection observed event", extra={"event_id": str(event.event_id), "event_type": event.event_type})


class LoggingConsumer(EventConsumer):
    async def handle(self, event: EventEnvelope) -> None:
        logger.info(
            "Event processed",
            extra={
                "event_id": str(event.event_id),
                "event_type": event.event_type,
                "topic": event.topic,
                "organization_id": str(event.organization_id) if event.organization_id else None,
            },
        )


def parse_aggregate_uuid(value: str | None) -> UUID | None:
    if not value:
        return None
    try:
        return UUID(str(value))
    except ValueError:
        return None
