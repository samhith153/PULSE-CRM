"""
Deal Repository
"""
from decimal import Decimal
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import asc, desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.deal import Deal
from app.repositories.base import BaseRepository
from app.utils.enums import DealSortField, DealStatus, SortOrder


class DealRepository(BaseRepository[Deal]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Deal, db)

    def _base_query(self, organization_id: UUID):
        return select(Deal).where(
            Deal.organization_id == organization_id,
            Deal.is_deleted.is_(False),
        )

    async def get_active_by_id(self, deal_id: UUID, organization_id: UUID) -> Optional[Deal]:
        stmt = self._base_query(organization_id).where(Deal.id == deal_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_lead_id_in_org(self, lead_id: UUID, organization_id: UUID) -> Optional[Deal]:
        stmt = self._base_query(organization_id).where(Deal.lead_id == lead_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_organization(
        self,
        organization_id: UUID,
        search: Optional[str],
        status: Optional[DealStatus],
        owner_id: Optional[UUID],
        company_id: Optional[UUID],
        contact_id: Optional[UUID],
        lead_id: Optional[UUID],
        pipeline_stage_id: Optional[UUID],
        min_amount: Optional[Decimal],
        max_amount: Optional[Decimal],
        sort_by: Optional[DealSortField],
        sort_order: SortOrder,
        page: int,
        page_size: int,
    ) -> Tuple[List[Deal], int]:
        stmt = self._base_query(organization_id)

        if status:
            stmt = stmt.where(Deal.status == status.value)
        if owner_id:
            stmt = stmt.where(Deal.owner_id == owner_id)
        if company_id:
            stmt = stmt.where(Deal.company_id == company_id)
        if contact_id:
            stmt = stmt.where(Deal.contact_id == contact_id)
        if lead_id:
            stmt = stmt.where(Deal.lead_id == lead_id)
        if pipeline_stage_id:
            stmt = stmt.where(Deal.pipeline_stage_id == pipeline_stage_id)
        if min_amount is not None:
            stmt = stmt.where(Deal.amount >= min_amount)
        if max_amount is not None:
            stmt = stmt.where(Deal.amount <= max_amount)
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    Deal.name.ilike(term),
                    Deal.description.ilike(term),
                    Deal.notes.ilike(term),
                    Deal.currency.ilike(term),
                )
            )

        sort_column_map = {
            DealSortField.NAME: Deal.name,
            DealSortField.AMOUNT: Deal.amount,
            DealSortField.EXPECTED_CLOSE_DATE: Deal.expected_close_date,
            DealSortField.PROBABILITY: Deal.probability,
            DealSortField.UPDATED_AT: Deal.updated_at,
            DealSortField.CREATED_AT: Deal.created_at,
        }
        sort_column = sort_column_map.get(sort_by or DealSortField.CREATED_AT, Deal.created_at)
        stmt = stmt.order_by(asc(sort_column) if sort_order == SortOrder.ASC else desc(sort_column))
        return await self.get_paginated(stmt, page, page_size)

    async def list_by_stage(
        self,
        organization_id: UUID,
        stage_id: UUID,
        page: int,
        page_size: int,
        search: Optional[str] = None,
    ) -> Tuple[List[Deal], int]:
        stmt = self._base_query(organization_id).where(Deal.pipeline_stage_id == stage_id)
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    Deal.name.ilike(term),
                    Deal.description.ilike(term),
                    Deal.notes.ilike(term),
                )
            )
        stmt = stmt.order_by(desc(Deal.created_at))
        return await self.get_paginated(stmt, page, page_size)
