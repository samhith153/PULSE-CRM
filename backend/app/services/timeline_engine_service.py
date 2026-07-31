"""
Timeline Engine Service
Centralizes activity timeline writes and domain event publication.
"""
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.activity_repository import ActivityTimelineRepository
from app.services.event_service import EventService


class TimelineEngineService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.activity_repo = ActivityTimelineRepository(db)
        self.event_service = EventService(db)

    async def record(
        self,
        organization_id: UUID,
        created_by: Optional[UUID],
        entity_type: str,
        entity_id: UUID,
        action: str,
        title: str,
        description: Optional[str] = None,
        payload: Optional[dict] = None,
        topic: Optional[str] = None,
        source: Optional[str] = None,
    ) -> None:
        """Persist a timeline row and emit a domain event in the same transaction."""
        await self.activity_repo.create(
            organization_id=organization_id,
            created_by=created_by,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            title=title,
            description=description,
            payload=payload,
        )
        await self.event_service.publish(
            organization_id=organization_id,
            created_by=created_by,
            aggregate_type=entity_type,
            aggregate_id=entity_id,
            event_type=action,
            topic=topic or entity_type,
            title=title,
            description=description,
            # We already wrote the ActivityTimeline row above (activity_repo.create),
            # so tell TimelineProjectionConsumer to skip re-projecting this event
            # once the durable EventWorker picks it up — otherwise every action
            # would end up duplicated in the timeline.
            payload={**(payload or {}), "timeline_projected": True},
            source=source or "crm",
        )
        # Broadly notify the acting user for every activity, so the
        # notification feed mirrors the activity timeline. deal_won,
        # deal_lost, and lead_converted are created explicitly with richer
        # copy at their call sites (pipeline_service, lead_service), so skip
        # them here to avoid double notifications.
        _ALREADY_HANDLED_ELSEWHERE = {"deal_won", "deal_lost", "lead_converted"}
        if created_by and action not in _ALREADY_HANDLED_ELSEWHERE:
            from app.services.notification_service import NotificationService

            await NotificationService(self.db).create_for_user(
                organization_id=organization_id,
                user_id=created_by,
                notif_type=action,
                title=title,
                message=description,
                entity_type=entity_type,
                entity_id=entity_id,
            )


    async def record_activity(
        self,
        organization_id: UUID,
        created_by: Optional[UUID],
        entity_type: str,
        entity_id: UUID,
        action: str,
        title: str,
        description: Optional[str] = None,
        payload: Optional[dict] = None,
        topic: Optional[str] = None,
        source: Optional[str] = None,
    ) -> None:
        """Alias for record() so services read naturally at call sites."""
        await self.record(
            organization_id=organization_id,
            created_by=created_by,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            title=title,
            description=description,
            payload=payload,
            topic=topic,
            source=source,
        )
