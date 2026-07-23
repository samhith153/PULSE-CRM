"""
Lead Repository
"""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead
from app.repositories.base import BaseRepository
from app.utils.enums import LeadStatus


class LeadRepository(BaseRepository[Lead]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Lead, db)

    def _base_query(self, organization_id: UUID):
        return (
            select(Lead)
            .where(
                Lead.organization_id == organization_id,
                Lead.is_deleted == False,
            )
        )

    async def get_active_by_id(
        self, lead_id: UUID, organization_id: UUID
    ) -> Optional[Lead]:
        stmt = self._base_query(organization_id).where(Lead.id == lead_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_organization(
        self,
        organization_id: UUID,
        search: Optional[str],
        status: Optional[LeadStatus],
        owner_id: Optional[UUID],
        company_id: Optional[UUID],
        contact_id: Optional[UUID],
        page: int,
        page_size: int,
    ) -> Tuple[List[Lead], int]:
        stmt = self._base_query(organization_id)

        if status:
            stmt = stmt.where(Lead.status == status.value)
        if owner_id:
            stmt = stmt.where(Lead.owner_id == owner_id)
        if company_id:
            stmt = stmt.where(Lead.company_id == company_id)
        if contact_id:
            stmt = stmt.where(Lead.contact_id == contact_id)
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    Lead.title.ilike(term),
                    Lead.description.ilike(term),
                )
            )
        stmt = stmt.order_by(Lead.created_at.desc())
        return await self.get_paginated(stmt, page, page_size)
