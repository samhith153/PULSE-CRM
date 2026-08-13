"""
Meeting repository backed by calendar_events.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.calendar_event import CalendarEvent
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.user import User
from app.repositories.base import BaseRepository


class MeetingRepository(BaseRepository[CalendarEvent]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(CalendarEvent, db)

    def _enriched_select(self):
        owner = aliased(User, name="meeting_owner")
        contact = aliased(Contact, name="meeting_contact")
        return (
            select(
                CalendarEvent,
                owner.full_name.label("owner_name"),
                Lead.title.label("lead_name"),
                func.concat(contact.first_name, ' ', contact.last_name).label("contact_name"),
                Company.name.label("company_name"),
                Deal.name.label("deal_name"),
            )
            .outerjoin(owner, owner.id == CalendarEvent.owner_id)
            .outerjoin(Lead, Lead.id == CalendarEvent.related_lead_id)
            .outerjoin(contact, contact.id == CalendarEvent.related_contact_id)
            .outerjoin(Company, Company.id == CalendarEvent.related_company_id)
            .outerjoin(Deal, Deal.id == CalendarEvent.related_deal_id)
        )

    async def get_enriched_by_id(self, meeting_id: UUID, organization_id: UUID) -> Optional[dict[str, Any]]:
        stmt = self._enriched_select().where(
            CalendarEvent.id == meeting_id,
            CalendarEvent.organization_id == organization_id,
            CalendarEvent.event_type == "meeting",
            CalendarEvent.is_deleted.is_(False),
        )
        row = (await self.db.execute(stmt)).first()
        return self._row_to_dict(row) if row else None

    async def get_raw_by_id(self, meeting_id: UUID, organization_id: UUID) -> Optional[CalendarEvent]:
        stmt = select(CalendarEvent).where(
            CalendarEvent.id == meeting_id,
            CalendarEvent.organization_id == organization_id,
            CalendarEvent.event_type == "meeting",
            CalendarEvent.is_deleted.is_(False),
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def list(
        self,
        organization_id: UUID,
        *,
        owner_id: Optional[UUID],
        status: Optional[str],
        start: Optional[datetime],
        end: Optional[datetime],
        page: int,
        page_size: int,
        related_lead_id: Optional[UUID] = None,
        related_contact_id: Optional[UUID] = None,
        related_company_id: Optional[UUID] = None,
        related_deal_id: Optional[UUID] = None,
    ) -> tuple[list[dict[str, Any]], int]:
        stmt = self._enriched_select().where(
            CalendarEvent.organization_id == organization_id,
            CalendarEvent.event_type == "meeting",
            CalendarEvent.is_deleted.is_(False),
        )
        if owner_id:
            stmt = stmt.where(CalendarEvent.owner_id == owner_id)
        if status:
            stmt = stmt.where(CalendarEvent.status == status)
        if start:
            stmt = stmt.where(CalendarEvent.start_datetime >= start)
        if end:
            stmt = stmt.where(CalendarEvent.start_datetime < end)
        if related_lead_id:
            stmt = stmt.where(CalendarEvent.related_lead_id == related_lead_id)
        if related_contact_id:
            stmt = stmt.where(CalendarEvent.related_contact_id == related_contact_id)
        if related_company_id:
            stmt = stmt.where(CalendarEvent.related_company_id == related_company_id)
        if related_deal_id:
            stmt = stmt.where(CalendarEvent.related_deal_id == related_deal_id)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)

        stmt = stmt.order_by(CalendarEvent.start_datetime.asc()).offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(stmt)).all()
        return [self._row_to_dict(row) for row in rows], total

    async def get_today(self, organization_id: UUID, owner_id: UUID) -> list[dict[str, Any]]:
        now = datetime.now(timezone.utc)
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(hour=23, minute=59, second=59, microsecond=999999)
        rows, _ = await self.list(organization_id, owner_id=owner_id, status=None, start=start, end=end, page=1, page_size=100)
        return rows

    async def get_upcoming(self, organization_id: UUID, owner_id: UUID, limit: int = 10) -> list[dict[str, Any]]:
        now = datetime.now(timezone.utc)
        stmt = (
            self._enriched_select()
            .where(
                CalendarEvent.organization_id == organization_id,
                CalendarEvent.owner_id == owner_id,
                CalendarEvent.event_type == "meeting",
                CalendarEvent.is_deleted.is_(False),
                CalendarEvent.start_datetime >= now,
                CalendarEvent.status.in_(["scheduled", "in_progress", "rescheduled"]),
            )
            .order_by(CalendarEvent.start_datetime.asc())
            .limit(limit)
        )
        rows = (await self.db.execute(stmt)).all()
        return [self._row_to_dict(row) for row in rows]

    async def soft_delete(self, meeting: CalendarEvent) -> CalendarEvent:
        meeting.is_deleted = True
        meeting.is_active = False
        self.db.add(meeting)
        await self.db.flush()
        return meeting

    @staticmethod
    def _row_to_dict(row) -> dict[str, Any]:
        meeting: CalendarEvent = row[0]
        data = {col.name: getattr(meeting, col.name) for col in meeting.__table__.columns}
        data["owner_name"]   = row[1] if len(row) > 1 else None
        data["lead_name"]    = row[2] if len(row) > 2 else None
        data["contact_name"] = row[3] if len(row) > 3 else None
        data["company_name"] = row[4] if len(row) > 4 else None
        data["deal_name"]    = row[5] if len(row) > 5 else None
        return data
