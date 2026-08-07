"""
CRM Call Repository
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
from app.models.crm_call import CrmCall
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.user import User
from app.repositories.base import BaseRepository


class CrmCallRepository(BaseRepository[CrmCall]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(CrmCall, db)

    def _enriched_select(self):
        owner = aliased(User, name="call_owner")
        contact = aliased(Contact, name="call_contact")
        from sqlalchemy import func as sa_func
        return (
            select(
                CrmCall,
                owner.full_name.label("owner_name"),
                Lead.title.label("lead_name"),
                sa_func.concat(contact.first_name, ' ', contact.last_name).label("contact_name"),
                Company.name.label("company_name"),
                Deal.name.label("deal_name"),
            )
            .outerjoin(owner, owner.id == CrmCall.owner_id)
            .outerjoin(Lead, Lead.id == CrmCall.related_lead_id)
            .outerjoin(contact, contact.id == CrmCall.related_contact_id)
            .outerjoin(Company, Company.id == CrmCall.related_company_id)
            .outerjoin(Deal, Deal.id == CrmCall.related_deal_id)
        )

    async def get_raw_by_id(self, call_id: UUID, organization_id: UUID) -> Optional[CrmCall]:
        stmt = select(CrmCall).where(
            CrmCall.id == call_id,
            CrmCall.organization_id == organization_id,
            CrmCall.is_deleted.is_(False),
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_enriched_by_id(self, call_id: UUID, organization_id: UUID) -> Optional[dict[str, Any]]:
        stmt = self._enriched_select().where(
            CrmCall.id == call_id,
            CrmCall.organization_id == organization_id,
            CrmCall.is_deleted.is_(False),
        )
        row = (await self.db.execute(stmt)).first()
        return self._row_to_dict(row) if row else None

    async def list(
        self,
        organization_id: UUID,
        *,
        owner_id: Optional[UUID] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        quick_tab: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        sort_order: str = "desc",
    ) -> Tuple[List[dict[str, Any]], int]:
        stmt = self._enriched_select().where(
            CrmCall.organization_id == organization_id,
            CrmCall.is_deleted.is_(False),
        )
        stmt = self._apply_filters(stmt, owner_id, status, priority, search, from_date, to_date, quick_tab)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)

        order_col = CrmCall.called_at.asc() if sort_order == "asc" else CrmCall.called_at.desc()
        stmt = stmt.order_by(order_col, CrmCall.created_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        rows = (await self.db.execute(stmt)).all()
        return [self._row_to_dict(row) for row in rows], total

    def _apply_filters(self, stmt, owner_id, status, priority, search, from_date, to_date, quick_tab):
        now = datetime.now(timezone.utc)
        if owner_id:
            stmt = stmt.where(CrmCall.owner_id == owner_id)
        if status:
            stmt = stmt.where(CrmCall.status == status.lower())
        if priority:
            stmt = stmt.where(CrmCall.priority == priority.lower())
        if from_date:
            stmt = stmt.where(CrmCall.called_at >= from_date)
        if to_date:
            stmt = stmt.where(CrmCall.called_at <= to_date)
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    CrmCall.subject.ilike(term),
                    CrmCall.contact_name.ilike(term),
                    CrmCall.notes.ilike(term),
                    CrmCall.outcome.ilike(term),
                )
            )
        if quick_tab == "today":
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            stmt = stmt.where(CrmCall.called_at >= today_start, CrmCall.called_at <= today_end)
        elif quick_tab == "upcoming":
            stmt = stmt.where(CrmCall.called_at >= now)
        return stmt

    async def bulk_soft_delete(self, ids: List[UUID], organization_id: UUID) -> int:
        from sqlalchemy import update as sa_update
        result = await self.db.execute(
            sa_update(CrmCall)
            .where(CrmCall.id.in_(ids), CrmCall.organization_id == organization_id)
            .values(is_deleted=True, is_active=False)
        )
        return result.rowcount

    async def bulk_update_status(self, ids: List[UUID], organization_id: UUID, status: str) -> int:
        from sqlalchemy import update as sa_update
        result = await self.db.execute(
            sa_update(CrmCall)
            .where(CrmCall.id.in_(ids), CrmCall.organization_id == organization_id)
            .values(status=status)
        )
        return result.rowcount

    async def bulk_update_owner(self, ids: List[UUID], organization_id: UUID, owner_id: UUID) -> int:
        from sqlalchemy import update as sa_update
        result = await self.db.execute(
            sa_update(CrmCall)
            .where(CrmCall.id.in_(ids), CrmCall.organization_id == organization_id)
            .values(owner_id=owner_id)
        )
        return result.rowcount

    async def soft_delete(self, call: CrmCall) -> CrmCall:
        call.is_deleted = True
        call.is_active = False
        self.db.add(call)
        await self.db.flush()
        return call

    @staticmethod
    def _row_to_dict(row) -> dict[str, Any]:
        call: CrmCall = row[0]
        data = {col.name: getattr(call, col.name) for col in call.__table__.columns}
        data["owner_name"] = row[1] if len(row) > 1 else None
        lead_name = row[2] if len(row) > 2 else None
        contact_name = row[3] if len(row) > 3 else None
        company_name = row[4] if len(row) > 4 else None
        deal_name = row[5] if len(row) > 5 else None
        entity_type = data.get("related_entity_type")
        name_map = {"lead": lead_name, "contact": contact_name, "company": company_name, "deal": deal_name}
        data["related_record_name"] = name_map.get(entity_type or "")
        return data
