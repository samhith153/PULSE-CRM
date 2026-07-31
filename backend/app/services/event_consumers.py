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


class NotificationProjectionConsumer(EventConsumer):
    """Turns real domain events (deal won, lead assigned, ...) into
    persisted per-user Notification rows. This is what the bell icon and
    the Notifications page actually read from — no more hardcoded arrays.
    """

    # event_type (see ActivityType in app/utils/enums.py) -> (notification type, title builder)
    _NOTIFIABLE = {
        "deal_won",
        "deal_lost",
        "lead_assigned",
        "lead_converted",
    }

    def __init__(self, db: AsyncSession | None = None) -> None:
        self.db = db

    async def handle(self, event: EventEnvelope) -> None:
        normalized_event_type = (event.event_type or "").lower()
        if self.db is None or not event.organization_id or normalized_event_type not in self._NOTIFIABLE:
            return

        from app.services.notification_service import NotificationService

        recipient_id = await self._resolve_recipient(event)
        if not recipient_id:
            return

        title, message = self._build_copy(event)
        service = NotificationService(self.db)
        await service.create_for_user(
            organization_id=event.organization_id,
            user_id=recipient_id,
            notif_type=event.event_type,
            title=title,
            message=message,
            entity_type=event.aggregate_type,
            entity_id=event.aggregate_id,
            payload=event.payload,
            source_event_id=event.event_id,
        )

    async def _resolve_recipient(self, event: EventEnvelope) -> UUID | None:
        payload = event.payload or {}
        owner_id = payload.get("owner_id")
        if owner_id:
            try:
                return UUID(str(owner_id))
            except ValueError:
                pass

        if event.aggregate_id:
            if event.aggregate_type == "deal":
                from app.repositories.deal_repository import DealRepository
                deal = await DealRepository(self.db).get_active_by_id(event.aggregate_id, event.organization_id)
                if deal and deal.owner_id:
                    return deal.owner_id

            if event.aggregate_type == "lead":
                from app.repositories.lead_repository import LeadRepository
                lead = await LeadRepository(self.db).get_active_by_id(event.aggregate_id, event.organization_id)
                if lead and lead.owner_id:
                    return lead.owner_id

        return event.actor_id

def _build_copy(self, event: EventEnvelope) -> tuple[str, str | None]:
    normalized_event_type = (event.event_type or "").lower()
    if normalized_event_type == "deal_won":
        return "Deal won", event.description or (event.title and f"{event.title}") or "A deal was marked as won."
    if normalized_event_type == "deal_lost":
        return "Deal lost", event.description or "A deal was marked as lost."
    if normalized_event_type == "lead_assigned":
        return "New lead assigned", event.description or "A lead was assigned to you."
    if normalized_event_type == "lead_converted":
        return "Lead converted", event.description or "A lead was converted to a deal."
    return event.title or event.event_type.replace("_", " ").title(), event.description


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
