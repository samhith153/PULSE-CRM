"""
Notification Service
"""
from __future__ import annotations

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository


class NotificationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = NotificationRepository(db)

    async def list_for_user(
        self,
        organization_id: UUID,
        user_id: UUID,
        page: int,
        page_size: int,
        unread_only: bool = False,
    ) -> Tuple[List[Notification], int, int]:
        items, total = await self.repo.list_for_user(
            organization_id, user_id, page, page_size, unread_only=unread_only
        )
        unread_count = await self.repo.count_unread(organization_id, user_id)
        return items, total, unread_count

    async def unread_count(self, organization_id: UUID, user_id: UUID) -> int:
        return await self.repo.count_unread(organization_id, user_id)

    async def mark_read(self, notification_id: UUID, organization_id: UUID, user_id: UUID) -> Notification:
        notification = await self.repo.get_owned(notification_id, organization_id, user_id)
        if not notification:
            raise NotFoundException("Notification", notification_id)
        if notification.is_read:
            return notification
        return await self.repo.mark_read(notification)

    async def mark_all_read(self, organization_id: UUID, user_id: UUID) -> int:
        return await self.repo.mark_all_read(organization_id, user_id)

    async def dismiss(self, notification_id: UUID, organization_id: UUID, user_id: UUID) -> Notification:
        notification = await self.repo.get_owned(notification_id, organization_id, user_id)
        if not notification:
            raise NotFoundException("Notification", notification_id)
        if notification.is_dismissed:
            return notification
        return await self.repo.dismiss(notification)

    async def create_for_user(
        self,
        organization_id: UUID,
        user_id: UUID,
        notif_type: str,
        title: str,
        message: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[UUID] = None,
        payload: Optional[dict] = None,
        source_event_id: Optional[UUID] = None,
    ) -> Optional[Notification]:
        """Create a notification, skipping if one for this event/user already exists."""
        if source_event_id and await self.repo.exists_for_event(source_event_id, user_id):
            return None
        return await self.repo.create(
            organization_id=organization_id,
            user_id=user_id,
            type=notif_type,
            title=title,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id,
            payload=payload or {},
            source_event_id=source_event_id,
        )
