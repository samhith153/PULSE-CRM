"""
Organization Repository
"""
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.repositories.base import BaseRepository


class OrganizationRepository(BaseRepository[Organization]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Organization, db)

    async def get_by_slug(self, slug: str) -> Optional[Organization]:
        stmt = select(Organization).where(
            Organization.slug == slug,
            Organization.is_deleted == False,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Optional[Organization]:
        stmt = select(Organization).where(
            Organization.name == name,
            Organization.is_deleted == False,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_by_id(self, org_id: UUID) -> Optional[Organization]:
        stmt = select(Organization).where(
            Organization.id == org_id,
            Organization.is_deleted == False,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
