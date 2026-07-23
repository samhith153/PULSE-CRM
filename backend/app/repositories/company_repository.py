"""
Company Repository
"""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.repositories.base import BaseRepository


class CompanyRepository(BaseRepository[Company]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Company, db)

    def _base_query(self, organization_id: UUID):
        return (
            select(Company)
            .where(
                Company.organization_id == organization_id,
                Company.is_deleted == False,
            )
        )

    async def get_by_name_in_org(
        self, name: str, organization_id: UUID
    ) -> Optional[Company]:
        stmt = self._base_query(organization_id).where(
            Company.name.ilike(name)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_by_id(
        self, company_id: UUID, organization_id: UUID
    ) -> Optional[Company]:
        stmt = self._base_query(organization_id).where(
            Company.id == company_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_organization(
        self,
        organization_id: UUID,
        search: Optional[str],
        page: int,
        page_size: int,
    ) -> Tuple[List[Company], int]:
        stmt = self._base_query(organization_id)
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    Company.name.ilike(term),
                    Company.email.ilike(term),
                    Company.domain.ilike(term),
                    Company.city.ilike(term),
                    Company.country.ilike(term),
                )
            )
        stmt = stmt.order_by(Company.name)
        return await self.get_paginated(stmt, page, page_size)
