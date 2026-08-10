"""
CRM Task Repository
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
from app.models.crm_task import CrmTask
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.user import User
from app.repositories.base import BaseRepository


class CrmTaskRepository(BaseRepository[CrmTask]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(CrmTask, db)

    # ── Enriched select (joins owner + related entity names) ─────────────────

    def _enriched_select(self):
        owner = aliased(User, name="task_owner")
        contact = aliased(Contact, name="task_contact")
        from sqlalchemy import func as sa_func
        return (
            select(
                CrmTask,
                owner.full_name.label("owner_name"),
                Lead.title.label("lead_name"),
                sa_func.concat(contact.first_name, ' ', contact.last_name).label("contact_name"),
                Company.name.label("company_name"),
                Deal.name.label("deal_name"),
            )
            .outerjoin(owner, owner.id == CrmTask.owner_id)
            .outerjoin(Lead, Lead.id == CrmTask.related_lead_id)
            .outerjoin(contact, contact.id == CrmTask.related_contact_id)
            .outerjoin(Company, Company.id == CrmTask.related_company_id)
            .outerjoin(Deal, Deal.id == CrmTask.related_deal_id)
        )

    # ── Raw single fetch ──────────────────────────────────────────────────────

    async def get_raw_by_id(self, task_id: UUID, organization_id: UUID) -> Optional[CrmTask]:
        stmt = select(CrmTask).where(
            CrmTask.id == task_id,
            CrmTask.organization_id == organization_id,
            CrmTask.is_deleted.is_(False),
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_enriched_by_id(self, task_id: UUID, organization_id: UUID) -> Optional[dict[str, Any]]:
        stmt = self._enriched_select().where(
            CrmTask.id == task_id,
            CrmTask.organization_id == organization_id,
            CrmTask.is_deleted.is_(False),
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
        search: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        quick_tab: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        sort_order: str = "desc",
    ) -> Tuple[List[dict[str, Any]], int]:
        stmt = self._enriched_select().where(
            CrmTask.organization_id == organization_id,
            CrmTask.is_deleted.is_(False),
        )
        stmt = self._apply_filters(stmt, owner_id, status, priority, search, from_date, to_date, quick_tab)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)

        order_col = CrmTask.due_date.asc() if sort_order == "asc" else CrmTask.due_date.desc()
        stmt = stmt.order_by(order_col, CrmTask.created_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        rows = (await self.db.execute(stmt)).all()
        return [self._row_to_dict(row) for row in rows], total

    def _apply_filters(self, stmt, owner_id, status, priority, search, from_date, to_date, quick_tab):
        now = datetime.now(timezone.utc)

        if owner_id:
            stmt = stmt.where(CrmTask.owner_id == owner_id)
        if status:
            stmt = stmt.where(CrmTask.status == status.lower())
        if priority:
            stmt = stmt.where(CrmTask.priority == priority.lower())
        if from_date:
            stmt = stmt.where(CrmTask.due_date >= from_date)
        if to_date:
            stmt = stmt.where(CrmTask.due_date <= to_date)
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    CrmTask.subject.ilike(term),
                    CrmTask.description.ilike(term),
                )
            )
        if quick_tab == "today":
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            stmt = stmt.where(CrmTask.due_date >= today_start, CrmTask.due_date <= today_end)
            stmt = stmt.where(CrmTask.status != "completed")
        elif quick_tab == "upcoming":
            stmt = stmt.where(CrmTask.due_date >= now, CrmTask.status != "completed")
        elif quick_tab == "overdue":
            stmt = stmt.where(
                or_(
                    CrmTask.status == "overdue",
                    (CrmTask.due_date < now) & (CrmTask.status != "completed"),
                )
            )
        return stmt

    # ── Bulk operations ───────────────────────────────────────────────────────

    async def bulk_soft_delete(self, ids: List[UUID], organization_id: UUID) -> int:
        from sqlalchemy import update as sa_update
        stmt = (
            sa_update(CrmTask)
            .where(CrmTask.id.in_(ids), CrmTask.organization_id == organization_id)
            .values(is_deleted=True, is_active=False)
        )
        result = await self.db.execute(stmt)
        return result.rowcount

    async def bulk_update_status(self, ids: List[UUID], organization_id: UUID, status: str) -> int:
        from sqlalchemy import update as sa_update
        stmt = (
            sa_update(CrmTask)
            .where(CrmTask.id.in_(ids), CrmTask.organization_id == organization_id)
            .values(status=status)
        )
        result = await self.db.execute(stmt)
        return result.rowcount

    async def bulk_update_owner(self, ids: List[UUID], organization_id: UUID, owner_id: UUID) -> int:
        from sqlalchemy import update as sa_update
        stmt = (
            sa_update(CrmTask)
            .where(CrmTask.id.in_(ids), CrmTask.organization_id == organization_id)
            .values(owner_id=owner_id)
        )
        result = await self.db.execute(stmt)
        return result.rowcount

    async def soft_delete(self, task: CrmTask) -> CrmTask:
        task.is_deleted = True
        task.is_active = False
        self.db.add(task)
        await self.db.flush()
        return task

    # ── Helper ────────────────────────────────────────────────────────────────

    @staticmethod
    def _row_to_dict(row) -> dict[str, Any]:
        task: CrmTask = row[0]
        data = {col.name: getattr(task, col.name) for col in task.__table__.columns}
        data["owner_name"] = row[1] if len(row) > 1 else None
        lead_name = row[2] if len(row) > 2 else None
        contact_name = row[3] if len(row) > 3 else None
        company_name = row[4] if len(row) > 4 else None
        deal_name = row[5] if len(row) > 5 else None
        # Resolve related record name based on entity type
        entity_type = data.get("related_entity_type")
        name_map = {"lead": lead_name, "contact": contact_name, "company": company_name, "deal": deal_name}
        data["related_record_name"] = name_map.get(entity_type or "")
        return data
