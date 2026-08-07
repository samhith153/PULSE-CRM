"""
Activity Timeline Query Service
Serves the Details page Timeline History tab.
Reads from activity_timeline_events enriched with performer info.
Reuses ActivityTimelineRepository — no duplicate logic.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.repositories.activity_repository import ActivityTimelineRepository
from app.schemas.activity_timeline import (
    ActivitySummaryResponse,
    TimelineEntry,
    TimelineListResponse,
)
from app.utils.enums import SortOrder

# Valid entity types supported by the timeline endpoint
SUPPORTED_ENTITY_TYPES = {"task", "call", "meeting", "email", "note",
                           "lead", "deal", "contact", "company", "system"}


class ActivityTimelineService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ActivityTimelineRepository(db)

    async def get_entity_timeline(
        self,
        organization_id: UUID,
        entity_type: str,
        entity_id: UUID,
        *,
        page: int = 1,
        page_size: int = 20,
        activity_type: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sort_order: str = "desc",
    ) -> TimelineListResponse:
        """
        Returns paginated, enriched timeline history for a single entity.
        Newest first by default.
        """
        if entity_type not in SUPPORTED_ENTITY_TYPES:
            raise NotFoundException(f"Entity type '{entity_type}' is not supported.")

        so = SortOrder.ASC if sort_order == "asc" else SortOrder.DESC

        rows, total = await self.repo.list_by_entity_enriched(
            organization_id=organization_id,
            entity_type=entity_type,
            entity_id=entity_id,
            page=page,
            page_size=page_size,
            action_filter=activity_type,
            search=search,
            from_date=date_from,
            to_date=date_to,
            sort_order=so,
        )

        entries = [TimelineEntry.from_row(r) for r in rows]
        total_pages = max(1, (total + page_size - 1) // page_size)

        return TimelineListResponse(
            total_records=total,
            page=page,
            page_size=page_size,
            has_next=page < total_pages,
            has_prev=page > 1,
            entries=entries,
        )

    async def get_entity_summary(
        self,
        organization_id: UUID,
        entity_type: str,
        entity_id: UUID,
    ) -> ActivitySummaryResponse:
        """Returns aggregate activity counts for the summary panel."""
        if entity_type not in SUPPORTED_ENTITY_TYPES:
            raise NotFoundException(f"Entity type '{entity_type}' is not supported.")

        data = await self.repo.get_entity_summary(
            organization_id=organization_id,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        return ActivitySummaryResponse(**data)
