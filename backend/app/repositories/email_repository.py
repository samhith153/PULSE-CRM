"""
Gmail and email repository.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import asc, desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email import Email, GmailConnection
from app.repositories.base import BaseRepository
from app.utils.enums import EmailDirection, SortOrder


class GmailConnectionRepository(BaseRepository[GmailConnection]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(GmailConnection, db)

    async def get_by_user(self, organization_id: UUID, user_id: UUID) -> Optional[GmailConnection]:
        stmt = select(GmailConnection).where(
            GmailConnection.organization_id == organization_id,
            GmailConnection.user_id == user_id,
            GmailConnection.is_active.is_(True),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_in_org(self, organization_id: UUID, connection_id: UUID) -> Optional[GmailConnection]:
        stmt = select(GmailConnection).where(
            GmailConnection.organization_id == organization_id,
            GmailConnection.id == connection_id,
            GmailConnection.is_active.is_(True),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_organization(self, organization_id: UUID) -> List[GmailConnection]:
        stmt = select(GmailConnection).where(
            GmailConnection.organization_id == organization_id,
            GmailConnection.is_active.is_(True),
        ).order_by(GmailConnection.created_at.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_all_active(self) -> List[GmailConnection]:
        stmt = select(GmailConnection).where(
            GmailConnection.is_active.is_(True),
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def deactivate_by_email(self, organization_id: UUID, email_address: str) -> int:
        """Deactivate all active connections for a given email in an org.
        Returns the number of deactivated rows.
        """
        from sqlalchemy import update
        stmt = (
            update(GmailConnection)
            .where(
                GmailConnection.organization_id == organization_id,
                GmailConnection.email_address == email_address,
                GmailConnection.is_active.is_(True),
            )
            .values(is_active=False)
        )
        result = await self.db.execute(stmt)
        return result.rowcount


class EmailRepository(BaseRepository[Email]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Email, db)

    def _base_query(self, organization_id: UUID):
        return select(Email).where(
            Email.organization_id == organization_id,
            Email.is_active.is_(True),
        )

    async def get_by_message_id(self, organization_id: UUID, gmail_message_id: str) -> Optional[Email]:
        stmt = self._base_query(organization_id).where(Email.gmail_message_id == gmail_message_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_in_org(self, organization_id: UUID, email_id: UUID) -> Optional[Email]:
        stmt = self._base_query(organization_id).where(Email.id == email_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_organization(
        self,
        organization_id: UUID,
        search: Optional[str],
        direction: Optional[str],
        thread_id: Optional[str],
        external_entity_type: Optional[str],
        external_entity_id: Optional[UUID],
        page: int,
        page_size: int,
        sort_order: SortOrder = SortOrder.DESC,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
    ) -> Tuple[List[Email], int]:
        stmt = self._base_query(organization_id)
        if direction:
            stmt = stmt.where(Email.direction == direction)
        if thread_id:
            stmt = stmt.where(Email.thread_id == thread_id)
        if external_entity_type:
            stmt = stmt.where(Email.external_entity_type == external_entity_type)
        if external_entity_id:
            stmt = stmt.where(Email.external_entity_id == external_entity_id)
        if from_date:
            stmt = stmt.where(Email.sent_at >= from_date)
        if to_date:
            stmt = stmt.where(Email.sent_at <= to_date)
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    Email.subject.ilike(term),
                    Email.sender.ilike(term),
                    Email.receiver.ilike(term),
                    Email.body_preview.ilike(term),
                    Email.thread_id.ilike(term),
                )
            )
        sort_clause = asc(Email.sent_at) if sort_order == SortOrder.ASC else desc(Email.sent_at)
        stmt = stmt.order_by(sort_clause, asc(Email.created_at) if sort_order == SortOrder.ASC else desc(Email.created_at))
        return await self.get_paginated(stmt, page, page_size)

    async def list_thread_history(self, organization_id: UUID, thread_id: str) -> List[Email]:
        stmt = self._base_query(organization_id).where(Email.thread_id == thread_id).order_by(Email.sent_at.asc(), Email.created_at.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_entity_history(
        self,
        organization_id: UUID,
        entity_type: str,
        entity_id: UUID,
        search: Optional[str],
        page: int,
        page_size: int,
        sort_order: SortOrder = SortOrder.DESC,
    ) -> Tuple[List[Email], int]:
        stmt = self._base_query(organization_id).where(
            Email.external_entity_type == entity_type,
            Email.external_entity_id == entity_id,
        )
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    Email.subject.ilike(term),
                    Email.sender.ilike(term),
                    Email.receiver.ilike(term),
                    Email.body_preview.ilike(term),
                )
            )
        sort_clause = asc(Email.sent_at) if sort_order == SortOrder.ASC else desc(Email.sent_at)
        stmt = stmt.order_by(sort_clause, asc(Email.created_at) if sort_order == SortOrder.ASC else desc(Email.created_at))
        return await self.get_paginated(stmt, page, page_size)

    async def get_latest_by_receiver(
        self,
        organization_id: UUID,
        receiver: str,
    ) -> Optional[Email]:

        stmt = (
            self._base_query(organization_id)
            .where(Email.receiver == receiver)
            .order_by(desc(Email.sent_at))
        )

        result = await self.db.execute(stmt)

        return result.scalar_one_or_none()

    async def get_outbound_by_thread(
        self, organization_id: UUID, thread_id: str,
    ) -> Optional[Email]:
        stmt = (
            self._base_query(organization_id)
            .where(
                Email.thread_id == thread_id,
                Email.direction == EmailDirection.OUTBOUND.value,
            )
            .order_by(desc(Email.sent_at))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_raw_message_id_local(
        self, local_part: str,
    ) -> Optional[Email]:
        """Search for an outbound email whose raw_payload Message-ID header
        contains the given local part (the part before '@')."""
        pattern = f"%{local_part}%"
        stmt = (
            select(Email)
            .where(
                Email.is_active.is_(True),
                Email.direction == EmailDirection.OUTBOUND.value,
                Email.raw_payload.cast(String).ilike(pattern),
            )
            .order_by(desc(Email.sent_at))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_message_id_global(
        self, local_part: str,
    ) -> Optional[Email]:
        """Broader search: match the local part anywhere in the raw_payload text."""
        pattern = f"%{local_part}%"
        stmt = (
            select(Email)
            .where(
                Email.is_active.is_(True),
                Email.raw_payload.cast(String).ilike(pattern),
            )
            .order_by(desc(Email.sent_at))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_latest_outbound_by_subject_and_participants(
        self,
        organization_id: UUID,
        normalized_subject: str,
        from_email: str,
    ) -> Optional[Email]:
        """Find the latest outbound email matching a normalized subject and sender."""
        stmt = (
            self._base_query(organization_id)
            .where(
                Email.direction == EmailDirection.OUTBOUND.value,
                Email.subject.ilike(f"%{normalized_subject}%"),
                Email.sender.ilike(f"%{from_email}%"),
            )
            .order_by(desc(Email.sent_at))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def save(self):

        await self.db.commit()
