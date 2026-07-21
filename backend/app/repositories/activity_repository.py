from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import asc, desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityTimeline
from app.repositories.base import BaseRepository
from app.utils.enums import SortOrder


class ActivityTimelineRepository(BaseRepository[ActivityTimeline]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(ActivityTimeline, db)

    def _base_query(self, organization_id: UUID):
        return select(ActivityTimeline).where(ActivityTimeline.organization_id == organization_id)

    async def list_by_organization(
        self,
        organization_id: UUID,
        entity_type: Optional[str],
        entity_id: Optional[UUID],
        action: Optional[str],
        search: Optional[str],
        page: int,
        page_size: int,
        sort_order: SortOrder = SortOrder.DESC,
        created_by: Optional[UUID] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
    ) -> Tuple[List[ActivityTimeline], int]:
        stmt = self._base_query(organization_id)

        if entity_type:
            stmt = stmt.where(ActivityTimeline.entity_type == entity_type)
        if entity_id:
            stmt = stmt.where(ActivityTimeline.entity_id == entity_id)
        if action:
            stmt = stmt.where(ActivityTimeline.action == action)
        if created_by:
            stmt = stmt.where(ActivityTimeline.created_by == created_by)
        if from_date:
            stmt = stmt.where(ActivityTimeline.created_at >= from_date)
        if to_date:
            stmt = stmt.where(ActivityTimeline.created_at <= to_date)
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    ActivityTimeline.title.ilike(term),
                    ActivityTimeline.description.ilike(term),
                    ActivityTimeline.action.ilike(term),
                    ActivityTimeline.entity_type.ilike(term),
                )
            )

        sort_clause = asc(ActivityTimeline.created_at) if sort_order == SortOrder.ASC else desc(ActivityTimeline.created_at)
        stmt = stmt.order_by(sort_clause, desc(ActivityTimeline.id))
        return await self.get_paginated(stmt, page, page_size)

    async def list_by_entity(
        self,
        organization_id: UUID,
        entity_type: str,
        entity_id: UUID,
        page: int,
        page_size: int,
        search: Optional[str] = None,
        sort_order: SortOrder = SortOrder.DESC,
    ) -> Tuple[List[ActivityTimeline], int]:
        stmt = self._base_query(organization_id).where(
            ActivityTimeline.entity_type == entity_type,
            ActivityTimeline.entity_id == entity_id,
        )
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    ActivityTimeline.title.ilike(term),
                    ActivityTimeline.description.ilike(term),
                    ActivityTimeline.action.ilike(term),
                    ActivityTimeline.entity_type.ilike(term),
                )
            )

        sort_clause = asc(ActivityTimeline.created_at) if sort_order == SortOrder.ASC else desc(ActivityTimeline.created_at)
        stmt = stmt.order_by(sort_clause, desc(ActivityTimeline.id))
        return await self.get_paginated(stmt, page, page_size)
