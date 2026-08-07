from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import asc, case, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.activity import ActivityTimeline
from app.models.user import User
from app.repositories.base import BaseRepository
from app.utils.enums import SortOrder


class ActivityTimelineRepository(BaseRepository[ActivityTimeline]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(ActivityTimeline, db)

    def _base_query(self, organization_id: UUID):
        return (
            select(ActivityTimeline)
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.is_active.is_(True),
            )
        )

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

    async def list_by_entity_enriched(
        self,
        organization_id: UUID,
        entity_type: str,
        entity_id: UUID,
        *,
        page: int = 1,
        page_size: int = 20,
        action_filter: Optional[str] = None,
        search: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        sort_order: SortOrder = SortOrder.DESC,
    ) -> Tuple[List[dict[str, Any]], int]:
        """Enriched timeline rows with performer name + avatar. Single JOIN — no N+1."""
        performer = aliased(User, name="performer")
        stmt = (
            select(
                ActivityTimeline.id,
                ActivityTimeline.entity_type,
                ActivityTimeline.entity_id,
                ActivityTimeline.action,
                ActivityTimeline.title,
                ActivityTimeline.description,
                ActivityTimeline.payload,
                ActivityTimeline.organization_id,
                ActivityTimeline.created_by,
                ActivityTimeline.created_at,
                ActivityTimeline.updated_at,
                ActivityTimeline.is_active,
                performer.full_name.label("performed_by_name"),
                performer.avatar_url.label("performed_by_avatar"),
            )
            .outerjoin(performer, performer.id == ActivityTimeline.created_by)
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.entity_type == entity_type,
                ActivityTimeline.entity_id == entity_id,
                ActivityTimeline.is_active.is_(True),
            )
        )
        if action_filter:
            stmt = stmt.where(ActivityTimeline.action == action_filter)
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
                )
            )
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)
        sort_col = asc(ActivityTimeline.created_at) if sort_order == SortOrder.ASC else desc(ActivityTimeline.created_at)
        stmt = (
            stmt.order_by(sort_col, desc(ActivityTimeline.id))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(stmt)
        return [dict(r) for r in result.mappings().all()], total

    async def get_entity_summary(
        self,
        organization_id: UUID,
        entity_type: str,
        entity_id: UUID,
    ) -> dict[str, Any]:
        """Single aggregate query — no N+1."""
        stmt = (
            select(
                func.count(ActivityTimeline.id).label("total_events"),
                func.sum(case((ActivityTimeline.action.in_(["email_sent", "email_received", "email", "email_draft_created"]), 1), else_=0)).label("emails"),
                func.sum(case((ActivityTimeline.action.in_(["call_logged", "call_completed", "call_missed", "call_started"]), 1), else_=0)).label("calls"),
                func.sum(case((ActivityTimeline.action.in_(["meeting_scheduled", "meeting_completed", "meeting_cancelled", "meeting_updated"]), 1), else_=0)).label("meetings"),
                func.sum(case((ActivityTimeline.action.in_(["task_created", "task_completed", "task_updated", "task_started"]), 1), else_=0)).label("tasks"),
                func.sum(case((ActivityTimeline.action.in_(["note_created", "note_edited", "internal_note_added"]), 1), else_=0)).label("notes"),
                func.max(ActivityTimeline.created_at).label("latest_activity"),
            )
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.entity_type == entity_type,
                ActivityTimeline.entity_id == entity_id,
                ActivityTimeline.is_active.is_(True),
            )
        )
        result = await self.db.execute(stmt)
        row = result.mappings().one_or_none()
        if not row:
            return {"total_events": 0, "emails": 0, "calls": 0, "meetings": 0, "tasks": 0, "notes": 0, "latest_activity": None, "last_updated": None}
        return {
            "total_events": int(row["total_events"] or 0),
            "emails":   int(row["emails"] or 0),
            "calls":    int(row["calls"] or 0),
            "meetings": int(row["meetings"] or 0),
            "tasks":    int(row["tasks"] or 0),
            "notes":    int(row["notes"] or 0),
            "latest_activity": row["latest_activity"],
            "last_updated":    row["latest_activity"],
        }
