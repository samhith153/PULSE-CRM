"""
CRM Note Repository
"""
from __future__ import annotations

from typing import Any, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.company import Company
from app.models.contact import Contact
from app.models.crm_note import CrmNote
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.user import User
from app.repositories.base import BaseRepository


class CrmNoteRepository(BaseRepository[CrmNote]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(CrmNote, db)

    def _enriched_select(self):
        owner = aliased(User, name="note_owner")
        contact = aliased(Contact, name="note_contact")
        from sqlalchemy import func as sa_func
        return (
            select(
                CrmNote,
                owner.full_name.label("owner_name"),
                Lead.title.label("lead_name"),
                sa_func.concat(contact.first_name, ' ', contact.last_name).label("contact_name"),
                Company.name.label("company_name"),
                Deal.name.label("deal_name"),
            )
            .outerjoin(owner, owner.id == CrmNote.owner_id)
            .outerjoin(Lead, Lead.id == CrmNote.related_lead_id)
            .outerjoin(contact, contact.id == CrmNote.related_contact_id)
            .outerjoin(Company, Company.id == CrmNote.related_company_id)
            .outerjoin(Deal, Deal.id == CrmNote.related_deal_id)
        )

    async def get_raw_by_id(self, note_id: UUID, organization_id: UUID) -> Optional[CrmNote]:
        stmt = select(CrmNote).where(
            CrmNote.id == note_id,
            CrmNote.organization_id == organization_id,
            CrmNote.is_deleted.is_(False),
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_enriched_by_id(self, note_id: UUID, organization_id: UUID) -> Optional[dict[str, Any]]:
        stmt = self._enriched_select().where(
            CrmNote.id == note_id,
            CrmNote.organization_id == organization_id,
            CrmNote.is_deleted.is_(False),
        )
        row = (await self.db.execute(stmt)).first()
        return self._row_to_dict(row) if row else None

    async def list(
        self,
        organization_id: UUID,
        *,
        owner_id: Optional[UUID] = None,
        search: Optional[str] = None,
        related_lead_id: Optional[UUID] = None,
        related_contact_id: Optional[UUID] = None,
        related_company_id: Optional[UUID] = None,
        related_deal_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 20,
        sort_order: str = "desc",
    ) -> Tuple[List[dict[str, Any]], int]:
        stmt = self._enriched_select().where(
            CrmNote.organization_id == organization_id,
            CrmNote.is_deleted.is_(False),
        )
        if owner_id:
            stmt = stmt.where(CrmNote.owner_id == owner_id)
        if related_lead_id:
            stmt = stmt.where(CrmNote.related_lead_id == related_lead_id)
        if related_contact_id:
            stmt = stmt.where(CrmNote.related_contact_id == related_contact_id)
        if related_company_id:
            stmt = stmt.where(CrmNote.related_company_id == related_company_id)
        if related_deal_id:
            stmt = stmt.where(CrmNote.related_deal_id == related_deal_id)
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    CrmNote.title.ilike(term),
                    CrmNote.body.ilike(term),
                )
            )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)

        order_col = CrmNote.created_at.asc() if sort_order == "asc" else CrmNote.created_at.desc()
        stmt = stmt.order_by(order_col).offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(stmt)).all()
        return [self._row_to_dict(row) for row in rows], total

    async def bulk_soft_delete(self, ids: List[UUID], organization_id: UUID) -> int:
        from sqlalchemy import update as sa_update
        result = await self.db.execute(
            sa_update(CrmNote)
            .where(CrmNote.id.in_(ids), CrmNote.organization_id == organization_id)
            .values(is_deleted=True, is_active=False)
        )
        return result.rowcount

    async def soft_delete(self, note: CrmNote) -> CrmNote:
        note.is_deleted = True
        note.is_active = False
        self.db.add(note)
        await self.db.flush()
        return note

    @staticmethod
    def _row_to_dict(row) -> dict[str, Any]:
        note: CrmNote = row[0]
        data = {col.name: getattr(note, col.name) for col in note.__table__.columns}
        data["owner_name"] = row[1] if len(row) > 1 else None
        lead_name = row[2] if len(row) > 2 else None
        contact_name = row[3] if len(row) > 3 else None
        company_name = row[4] if len(row) > 4 else None
        deal_name = row[5] if len(row) > 5 else None
        entity_type = data.get("related_entity_type")
        name_map = {"lead": lead_name, "contact": contact_name, "company": company_name, "deal": deal_name}
        data["related_record_name"] = name_map.get(entity_type or "")
        return data
