from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event_outbox import EventOutbox
from app.repositories.event_repository import EventRepository
from app.schemas.event_outbox import EVENT_TYPE_NAMES, EventCreate, EventListResponse, EventRead, EventType

try:
    from app.core.logging import get_logger  # type: ignore
except Exception:  # pragma: no cover
    import logging

    def get_logger(name: str):
        return logging.getLogger(name)


logger = get_logger(__name__)


def _json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): _json_safe(inner) for key, inner in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(item) for item in value]
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).isoformat()
    if isinstance(value, UUID):
        return str(value)
    if hasattr(value, "value") and not isinstance(value, (str, bytes)):
        return _json_safe(value.value)
    return value


def _normalize_event_type_value(event_type: EventType | str) -> str:
    value = event_type.value if isinstance(event_type, EventType) else str(event_type)
    return value.strip().upper().replace(".", "_").replace(" ", "_")


def _event_name(event_type: str) -> str:
    if event_type in EVENT_TYPE_NAMES:
        return EVENT_TYPE_NAMES[event_type]
    return event_type.replace("_", " ").title()


class EventService:
    def __init__(self, repository_or_session: EventRepository | AsyncSession):
        if isinstance(repository_or_session, EventRepository):
            self.repository = repository_or_session
        else:
            self.repository = EventRepository(repository_or_session)

    async def record_event(
        self,
        event_type: EventType | str,
        *,
        payload: dict[str, Any] | None = None,
        organization_id: UUID | None = None,
        actor_id: UUID | None = None,
        created_by: UUID | None = None,
        aggregate_type: str | None = None,
        aggregate_id: UUID | str | None = None,
        source: str | None = None,
        topic: str | None = None,
        title: str | None = None,
        description: str | None = None,
        correlation_id: str | None = None,
        occurred_at: datetime | None = None,
        **extra: Any,
    ) -> EventRead:
        normalized_event_type = _normalize_event_type_value(event_type)
        actor_identity = actor_id or created_by
        aggregate_identity = str(aggregate_id) if aggregate_id is not None else None
        merged_payload: dict[str, Any] = dict(payload or {})
        if topic is not None:
            merged_payload.setdefault("topic", topic)
        if title is not None:
            merged_payload.setdefault("title", title)
        if description is not None:
            merged_payload.setdefault("description", description)
        if extra:
            merged_payload.update(extra)

        event = EventOutbox(
            organization_id=organization_id,
            actor_id=actor_identity,
            event_type=normalized_event_type,
            event_name=_event_name(normalized_event_type),
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_identity,
            source=source,
            correlation_id=correlation_id,
            payload=_json_safe(merged_payload),
            occurred_at=occurred_at or datetime.now(timezone.utc),
        )
        created = await self.repository.create(event)
        logger.info(
            "Event outbox recorded",
            extra={
                "event_id": str(created.id),
                "event_type": created.event_type,
                "aggregate_type": created.aggregate_type,
                "aggregate_id": created.aggregate_id,
                "organization_id": str(created.organization_id) if created.organization_id else None,
            },
        )
        return EventRead.model_validate(created)

    async def create(self, event: EventCreate) -> EventRead:
        return await self.record_event(
            event.event_type,
            payload=event.payload,
            organization_id=event.organization_id,
            actor_id=event.actor_id,
            aggregate_type=event.aggregate_type,
            aggregate_id=event.aggregate_id,
            source=event.source,
            correlation_id=event.correlation_id,
        )

    async def create_event(self, event: EventCreate) -> EventRead:
        return await self.create(event)

    async def emit(self, *args: Any, **kwargs: Any) -> EventRead:
        if args:
            return await self.record_event(args[0], **kwargs)
        if "event_type" not in kwargs:
            raise ValueError("event_type is required")
        event_type = kwargs.pop("event_type")
        return await self.record_event(event_type, **kwargs)

    async def publish(self, *args: Any, **kwargs: Any) -> EventRead:
        return await self.emit(*args, **kwargs)

    async def get_event(self, event_id: UUID) -> EventRead | None:
        event = await self.repository.get_by_id(event_id)
        return EventRead.model_validate(event) if event else None

    async def get(self, event_id: UUID) -> EventRead | None:
        return await self.get_event(event_id)

    async def get_by_id(self, event_id: UUID) -> EventRead | None:
        return await self.get_event(event_id)

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
    ) -> EventListResponse:
        normalized_event_type = _normalize_event_type_value(event_type) if event_type else None
        events, total = await self.repository.list_events(
            limit=limit,
            offset=offset,
            organization_id=organization_id,
            event_type=normalized_event_type,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            actor_id=actor_id,
            source=source,
            since=since,
            until=until,
        )
        return EventListResponse(
            items=[EventRead.model_validate(event) for event in events],
            total=total,
            limit=limit,
            offset=offset,
        )

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
    ) -> EventListResponse:
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

    async def record_important_action(self, event_type: EventType | str, **kwargs: Any) -> EventRead:
        return await self.record_event(event_type, **kwargs)

    async def record_email_received(self, **kwargs: Any) -> EventRead:
        return await self.record_event(EventType.EMAIL_RECEIVED, **kwargs)

    async def record_email_sent(self, **kwargs: Any) -> EventRead:
        return await self.record_event(EventType.EMAIL_SENT, **kwargs)

    async def record_email_read(self, **kwargs: Any) -> EventRead:
        return await self.record_event(EventType.EMAIL_READ, **kwargs)

    async def record_lead_created(self, **kwargs: Any) -> EventRead:
        return await self.record_event(EventType.LEAD_CREATED, **kwargs)

    async def record_lead_converted(self, **kwargs: Any) -> EventRead:
        return await self.record_event(EventType.LEAD_CONVERTED, **kwargs)

    async def record_deal_created(self, **kwargs: Any) -> EventRead:
        return await self.record_event(EventType.DEAL_CREATED, **kwargs)

    async def record_deal_updated(self, **kwargs: Any) -> EventRead:
        return await self.record_event(EventType.DEAL_UPDATED, **kwargs)

    async def record_deal_won(self, **kwargs: Any) -> EventRead:
        return await self.record_event(EventType.DEAL_WON, **kwargs)

    async def record_deal_lost(self, **kwargs: Any) -> EventRead:
        return await self.record_event(EventType.DEAL_LOST, **kwargs)

    async def record_company_created(self, **kwargs: Any) -> EventRead:
        return await self.record_event(EventType.COMPANY_CREATED, **kwargs)

    async def record_contact_created(self, **kwargs: Any) -> EventRead:
        return await self.record_event(EventType.CONTACT_CREATED, **kwargs)

    async def record_activity_created(self, **kwargs: Any) -> EventRead:
        return await self.record_event(EventType.ACTIVITY_CREATED, **kwargs)


EventOutboxService = EventService
