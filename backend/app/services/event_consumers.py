"""Event consumers for durable outbox processing."""
from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.activity import ActivityTimeline
from app.repositories.activity_repository import ActivityTimelineRepository
from app.services.event_bus import EventConsumer, EventEnvelope
from app.services.notification_service import NotificationService

logger = get_logger(__name__)

# Event types that should generate user-facing notifications.
# Maps outbox event_type → (notification_type, title_template, message_template)
_NOTIFICATION_MAP: dict[str, tuple[str, str, str]] = {
    "LEAD_CREATED": ("lead_created", "New Lead Created", "A new lead has been added to the pipeline."),
    "LEAD_CONVERTED": ("lead_converted", "Lead Converted", "A lead has been converted successfully."),
    "DEAL_CREATED": ("deal_created", "New Deal Created", "A new deal has been created."),
    "DEAL_WON": ("deal_won", "Deal Won!", "Congratulations! A deal has been marked as won."),
    "DEAL_LOST": ("deal_lost", "Deal Lost", "A deal has been marked as lost."),
    "EMAIL_RECEIVED": ("email_received", "New Email Received", "You have received a new email."),
    "ACTIVITY_CREATED": ("task_due", "New Activity", "A new activity has been created."),
}


class NotificationConsumer(EventConsumer):
    """Creates persistent notification rows for domain events."""

    def __init__(self, db: AsyncSession | None = None) -> None:
        self.db = db

    async def handle(self, event: EventEnvelope) -> None:
        if self.db is None or not event.organization_id:
            return

        mapping = _NOTIFICATION_MAP.get(event.event_type)
        if not mapping:
            return

        notif_type, title, message = mapping

        # Determine recipient: prefer envelope actor_id, fall back to payload keys
        recipient_id = (
            getattr(event, "actor_id", None)
            or event.payload.get("actor_id")
            or event.payload.get("created_by")
        )
        if not recipient_id:
            logger.debug("Skipping notification — no recipient for event %s", event.event_type)
            return

        try:
            user_id = UUID(str(recipient_id))
        except (ValueError, TypeError):
            logger.warning("Invalid recipient UUID %s for event %s", recipient_id, event.event_type)
            return

        # Enrich message with entity info from payload if available
        entity_name = event.payload.get("title") or event.payload.get("name") or ""
        if entity_name:
            message = f"{message} ({entity_name})"

        service = NotificationService(self.db)
        try:
            created = await service.create_for_user(
                organization_id=event.organization_id,
                user_id=user_id,
                notif_type=notif_type,
                title=title,
                message=message,
                entity_type=event.aggregate_type,
                entity_id=event.aggregate_id,
                payload=event.payload,
                source_event_id=event.event_id,
            )
            logger.info(
                "Notification created for user=%s type=%s event=%s",
                user_id, notif_type, event.event_type,
            )
            # Push a real-time SSE event so the frontend refreshes instantly
            if created:
                from app.services.event_bus import event_bus as _bus
                from app.services.event_bus import EventEnvelope
                from datetime import datetime as _dt
                from uuid import uuid4
                _sse_event = EventEnvelope(
                    event_id=uuid4(),
                    organization_id=event.organization_id,
                    aggregate_type="notification",
                    aggregate_id=created.id,
                    event_type="NOTIFICATION_CREATED",
                    topic="notifications",
                    title=title,
                    description=message,
                    payload={"user_id": str(user_id), "type": notif_type, "title": title},
                    source="notification_consumer",
                    status="processed",
                    created_at=_dt.utcnow(),
                    actor_id=user_id,
                )
                await _bus.publish(_sse_event)
        except Exception:
            logger.exception("Failed to create notification for event %s", event.event_type)


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
