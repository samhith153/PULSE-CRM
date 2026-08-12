"""
Company Repository
"""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
            .options(selectinload(Company.owner))
        )

    async def get_by_name_in_org(
        self, name: str, organization_id: UUID
    ) -> Optional[Company]:
        stmt = self._base_query(organization_id).where(
            Company.name.ilike(name)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_name_in_org_include_deleted(
        self, name: str, organization_id: UUID
    ) -> Optional[Company]:
        """Look up a company by name including soft-deleted rows.

        Used during lead conversion to avoid hitting the unique constraint
        `uq_company_name_per_org` (which counts soft-deleted rows) when a
        company with the same name was previously soft-deleted.
        """
        stmt = (
            select(Company)
            .where(
                Company.organization_id == organization_id,
                Company.name.ilike(name),
            )
            .options(selectinload(Company.owner))
            .order_by(Company.is_deleted.asc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()


    async def get_by_email_in_org(self, email: str, organization_id: UUID) -> Optional[Company]:
        stmt = self._base_query(organization_id).where(
            func.lower(func.trim(Company.email)) == email.strip().lower()
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_phone_in_org(self, phone: str, organization_id: UUID) -> Optional[Company]:
        normalized = ''.join(ch for ch in phone if ch.isdigit())
        if not normalized:
            return None
        stmt = self._base_query(organization_id).where(
            func.regexp_replace(func.coalesce(Company.phone, ''), r'\D+', '', 'g') == normalized
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
