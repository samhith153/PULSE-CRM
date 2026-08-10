"""
Contact Repository
"""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.contact import Contact
from app.repositories.base import BaseRepository


class ContactRepository(BaseRepository[Contact]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Contact, db)

    def _base_query(self, organization_id: UUID):
        return (
            select(Contact)
            .where(
                Contact.organization_id == organization_id,
                Contact.is_deleted == False,
            )
            .options(selectinload(Contact.company))
        )

    async def get_by_email_in_org(
        self, email: str, organization_id: UUID
    ) -> Optional[Contact]:
        stmt = self._base_query(organization_id).where(
            func.lower(Contact.email) == email.lower()
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()


    async def get_by_phone_in_org(self, phone: str, organization_id: UUID) -> Optional[Contact]:
        normalized = ''.join(ch for ch in phone if ch.isdigit())
        if not normalized:
            return None
        stmt = self._base_query(organization_id).where(
            func.regexp_replace(func.coalesce(Contact.phone, ''), r'\D+', '', 'g') == normalized
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_by_id(
        self, contact_id: UUID, organization_id: UUID
    ) -> Optional[Contact]:
        stmt = self._base_query(organization_id).where(
            Contact.id == contact_id
        ).options(selectinload(Contact.company))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_organization(
        self,
        organization_id: UUID,
        search: Optional[str],
        company_id: Optional[UUID],
        page: int,
        page_size: int,
        owner_id: Optional[UUID] = None,
    ) -> Tuple[List[Contact], int]:
        stmt = self._base_query(organization_id)

        if owner_id:
            stmt = stmt.where(Contact.owner_id == owner_id)
        if company_id:
            stmt = stmt.where(Contact.company_id == company_id)

        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    Contact.first_name.ilike(term),
                    Contact.last_name.ilike(term),
                    Contact.email.ilike(term),
                    Contact.job_title.ilike(term),
                    Contact.department.ilike(term),
                )
            )
        stmt = stmt.order_by(Contact.last_name, Contact.first_name)
        return await self.get_paginated(stmt, page, page_size)
