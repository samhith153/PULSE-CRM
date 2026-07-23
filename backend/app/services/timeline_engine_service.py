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
            payload=payload,
            source=source or "crm",
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
