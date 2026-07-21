"""
Pipeline Stage Repository
"""
from decimal import Decimal
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, outerjoin, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.deal import Deal
from app.models.pipeline import PipelineStage
from app.repositories.base import BaseRepository


class PipelineRepository(BaseRepository[PipelineStage]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(PipelineStage, db)

    async def list_by_organization(
        self,
        organization_id: UUID,
        include_inactive: bool = False,
    ) -> List[PipelineStage]:
        stmt = select(PipelineStage).where(PipelineStage.organization_id == organization_id)
        if not include_inactive:
            stmt = stmt.where(PipelineStage.is_active.is_(True))
        stmt = stmt.order_by(PipelineStage.sort_order.asc(), PipelineStage.created_at.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_active_by_id(self, stage_id: UUID, organization_id: UUID) -> Optional[PipelineStage]:
        stmt = select(PipelineStage).where(
            PipelineStage.id == stage_id,
            PipelineStage.organization_id == organization_id,
            PipelineStage.is_active.is_(True),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str, organization_id: UUID) -> Optional[PipelineStage]:
        stmt = select(PipelineStage).where(
            PipelineStage.slug == slug,
            PipelineStage.organization_id == organization_id,
            PipelineStage.is_active.is_(True),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_board_stats(self, organization_id: UUID) -> list[tuple[PipelineStage, int, Decimal]]:
        stmt = (
            select(
                PipelineStage,
                func.count(Deal.id),
                func.coalesce(func.sum(Deal.amount), 0),
            )
            .select_from(
                outerjoin(
                    PipelineStage,
                    Deal,
                    (Deal.pipeline_stage_id == PipelineStage.id)
                    & (Deal.is_active.is_(True))
                    & (Deal.is_deleted.is_(False)),
                )
            )
            .where(PipelineStage.organization_id == organization_id)
            .where(PipelineStage.is_active.is_(True))
            .group_by(
                PipelineStage.id,
                PipelineStage.created_at,
                PipelineStage.updated_at,
                PipelineStage.is_active,
                PipelineStage.organization_id,
                PipelineStage.created_by,
                PipelineStage.name,
                PipelineStage.slug,
                PipelineStage.color,
                PipelineStage.sort_order,
                PipelineStage.probability,
                PipelineStage.is_default,
                PipelineStage.updated_by,
            )
            .order_by(PipelineStage.sort_order.asc(), PipelineStage.created_at.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.all())

    async def count_total_deals(self, organization_id: UUID) -> int:
        stmt = select(func.count(Deal.id)).where(
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
        )
        result = await self.db.execute(stmt)
        return int(result.scalar_one() or 0)

    async def count_stage_deals(self, organization_id: UUID, stage_id: UUID) -> int:
        stmt = select(func.count(Deal.id)).where(
            Deal.organization_id == organization_id,
            Deal.pipeline_stage_id == stage_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
        )
        result = await self.db.execute(stmt)
        return int(result.scalar_one() or 0)

    async def sum_stage_amount(self, organization_id: UUID, stage_id: UUID) -> Decimal:
        stmt = select(func.coalesce(func.sum(Deal.amount), 0)).where(
            Deal.organization_id == organization_id,
            Deal.pipeline_stage_id == stage_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
        )
        result = await self.db.execute(stmt)
        return Decimal(str(result.scalar_one() or 0))
