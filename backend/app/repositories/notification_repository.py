from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Notification, db)

    def _base_query(self, organization_id: UUID, user_id: UUID, include_dismissed: bool):
        stmt = select(Notification).where(
            Notification.organization_id == organization_id,
            Notification.user_id == user_id,
        )
        if not include_dismissed:
            stmt = stmt.where(Notification.is_dismissed.is_(False))
        return stmt

    async def list_for_user(
        self,
        organization_id: UUID,
        user_id: UUID,
        page: int,
        page_size: int,
        include_dismissed: bool = False,
        unread_only: bool = False,
    ) -> Tuple[List[Notification], int, int]:
        """Return (items, total_matching_filter, unread_count) in ONE roundtrip.

        Uses COUNT(*) OVER() for the paginated total and a scalar subquery for
        the user's unread count, so the list endpoint costs a single DB query
        instead of three (count + page + unread) — significant when the app
        and database are in different regions.
        """
        stmt = self._base_query(organization_id, user_id, include_dismissed)
        if unread_only:
            stmt = stmt.where(Notification.is_read.is_(False))

        unread_subq = (
            select(func.count())
            .select_from(Notification)
            .where(
                Notification.organization_id == organization_id,
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
                Notification.is_dismissed.is_(False),
            )
            .scalar_subquery()
        )

        offset = (page - 1) * page_size
        result = await self.db.execute(
            stmt.add_columns(
                func.count().over().label("total"),
                unread_subq.label("unread_count"),
            )
            .order_by(Notification.created_at.desc(), Notification.id.desc())
            .offset(offset)
            .limit(page_size)
        )
        rows = result.all()

        if not rows:
            # Out-of-range page (no rows): compute counts with one extra query.
            total_result = await self.db.execute(
                select(func.count()).select_from(stmt.subquery())
            )
            return [], int(total_result.scalar_one() or 0), await self.count_unread(organization_id, user_id)

        items = [row[0] for row in rows]
        return items, int(rows[0].total), int(rows[0].unread_count or 0)

    async def count_unread(self, organization_id: UUID, user_id: UUID) -> int:
        stmt = select(func.count()).select_from(Notification).where(
            Notification.organization_id == organization_id,
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
            Notification.is_dismissed.is_(False),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one() or 0

    async def get_owned(self, notification_id: UUID, organization_id: UUID, user_id: UUID) -> Optional[Notification]:
        stmt = select(Notification).where(
            Notification.id == notification_id,
            Notification.organization_id == organization_id,
            Notification.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def mark_read(self, notification: Notification) -> Notification:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        self.db.add(notification)
        await self.db.flush()
        await self.db.refresh(notification)
        return notification

    async def mark_all_read(self, organization_id: UUID, user_id: UUID) -> int:
        now = datetime.now(timezone.utc)
        stmt = (
            update(Notification)
            .where(
                Notification.organization_id == organization_id,
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
            .values(is_read=True, read_at=now)
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount or 0

    async def dismiss(self, notification: Notification) -> Notification:
        notification.is_dismissed = True
        notification.dismissed_at = datetime.now(timezone.utc)
        self.db.add(notification)
        await self.db.flush()
        await self.db.refresh(notification)
        return notification

    async def dismiss_all(self, organization_id: UUID, user_id: UUID) -> int:
        now = datetime.now(timezone.utc)
        stmt = (
            update(Notification)
            .where(
                Notification.organization_id == organization_id,
                Notification.user_id == user_id,
                Notification.is_dismissed.is_(False),
            )
            .values(is_dismissed=True, dismissed_at=now)
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount or 0

    async def exists_for_event(self, source_event_id: UUID, user_id: UUID) -> bool:
        return await self.exists(source_event_id=source_event_id, user_id=user_id)
