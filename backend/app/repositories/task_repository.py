"""Task repository."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import asc, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.repositories.base import BaseRepository


class TaskRepository(BaseRepository[Task]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Task, db)

    def _base_query(self, organization_id: UUID):
        return select(Task).where(Task.organization_id == organization_id, Task.is_deleted.is_(False))

    async def get_active_by_id(self, task_id: UUID, organization_id: UUID) -> Optional[Task]:
        result = await self.db.execute(self._base_query(organization_id).where(Task.id == task_id))
        return result.scalar_one_or_none()

    async def list_by_organization(
        self,
        organization_id: UUID,
        *,
        owner_id: Optional[UUID],
        status: Optional[str],
        priority: Optional[str],
        page: int,
        page_size: int,
    ):
        stmt = self._base_query(organization_id)
        if owner_id:
            stmt = stmt.where(Task.owner_id == owner_id)
        if status:
            stmt = stmt.where(Task.status == status)
        if priority:
            stmt = stmt.where(Task.priority == priority)
        stmt = stmt.order_by(asc(Task.due_date).nulls_last(), desc(Task.created_at))
        return await self.get_paginated(stmt, page, page_size)

    async def list_open_for_owner(self, organization_id: UUID, owner_id: UUID, limit: int = 20) -> list[Task]:
        stmt = (
            self._base_query(organization_id)
            .where(Task.owner_id == owner_id, Task.status.notin_(["completed", "cancelled"]))
            .order_by(asc(Task.due_date).nulls_last(), desc(Task.created_at))
            .limit(limit)
        )
        return list((await self.db.execute(stmt)).scalars().all())
