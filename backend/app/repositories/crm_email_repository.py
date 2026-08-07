"""
CRM Email Repository
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.company import Company
from app.models.contact import Contact
from app.models.crm_email import CrmEmail
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.user import User
from app.repositories.base import BaseRepository


class CrmEmailRepository(BaseRepository[CrmEmail]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(CrmEmail, db)

    # ── Enriched select (joins owner + related entity names) ─────────────────

    def _enriched_select(self):
        owner = aliased(User, name="email_owner")
        contact = aliased(Contact, name="email_contact")
        from sqlalchemy import func as sa_func
        return (
            select(
                CrmEmail,
                owner.full_name.label("owner_name"),
                Lead.title.label("lead_name"),
                sa_func.concat(contact.first_name, ' ', contact.last_name).label("contact_name"),
                Company.name.label("company_name"),
                Deal.name.label("deal_name"),
            )
            .outerjoin(owner, owner.id == CrmEmail.owner_id)
            .outerjoin(Lead, Lead.id == CrmEmail.related_lead_id)
            .outerjoin(contact, contact.id == CrmEmail.related_contact_id)
            .outerjoin(Company, Company.id == CrmEmail.related_company_id)
            .outerjoin(Deal, Deal.id == CrmEmail.related_deal_id)
        )

    # ── Raw single fetch ──────────────────────────────────────────────────────

    async def get_raw_by_id(self, email_id: UUID, organization_id: UUID) -> Optional[CrmEmail]:
        stmt = select(CrmEmail).where(
            CrmEmail.id == email_id,
            CrmEmail.organization_id == organization_id,
            CrmEmail.is_deleted.is_(False),
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_enriched_by_id(self, email_id: UUID, organization_id: UUID) -> Optional[dict[str, Any]]:
        stmt = self._enriched_select().where(
            CrmEmail.id == email_id,
            CrmEmail.organization_id == organization_id,
            CrmEmail.is_deleted.is_(False),
        )
        row = (await self.db.execute(stmt)).first()
        return self._row_to_dict(row) if row else None

    # ── Filtered list ─────────────────────────────────────────────────────────

    async def list(
        self,
        organization_id: UUID,
        *,
        owner_id: Optional[UUID] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        direction: Optional[str] = None,
        search: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 20,
        sort_order: str = "desc",
    ) -> Tuple[List[dict[str, Any]], int]:
        stmt = self._enriched_select().where(
            CrmEmail.organization_id == organization_id,
            CrmEmail.is_deleted.is_(False),
        )
        if owner_id:
            stmt = stmt.where(CrmEmail.owner_id == owner_id)
        if status:
            stmt = stmt.where(CrmEmail.status == status.lower())
        if priority:
            stmt = stmt.where(CrmEmail.priority == priority.lower())
        if direction:
            stmt = stmt.where(CrmEmail.direction == direction.lower())
        if from_date:
            stmt = stmt.where(CrmEmail.sent_at >= from_date)
        if to_date:
            stmt = stmt.where(CrmEmail.sent_at <= to_date)
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    CrmEmail.subject.ilike(term),
                    CrmEmail.body.ilike(term),
                    CrmEmail.recipient_email.ilike(term),
                    CrmEmail.recipient_name.ilike(term),
                )
            )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)

        order_col = CrmEmail.sent_at.asc() if sort_order == "asc" else CrmEmail.sent_at.desc()
        stmt = stmt.order_by(order_col, CrmEmail.created_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        rows = (await self.db.execute(stmt)).all()
        return [self._row_to_dict(row) for row in rows], total

    # ── Soft delete ───────────────────────────────────────────────────────────

    async def soft_delete(self, email: CrmEmail) -> CrmEmail:
        email.is_deleted = True
        email.is_active = False
        self.db.add(email)
        await self.db.flush()
        return email

    # ── Helper ────────────────────────────────────────────────────────────────

    @staticmethod
    def _row_to_dict(row) -> dict[str, Any]:
        email: CrmEmail = row[0]
        data = {col.name: getattr(email, col.name) for col in email.__table__.columns}
        data["owner_name"] = row[1] if len(row) > 1 else None
        lead_name = row[2] if len(row) > 2 else None
        contact_name = row[3] if len(row) > 3 else None
        company_name = row[4] if len(row) > 4 else None
        deal_name = row[5] if len(row) > 5 else None
        entity_type = data.get("related_entity_type")
        name_map = {"lead": lead_name, "contact": contact_name, "company": company_name, "deal": deal_name}
        data["related_record_name"] = name_map.get(entity_type or "")
        return data
