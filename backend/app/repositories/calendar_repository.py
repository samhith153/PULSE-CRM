"""
Calendar Repository
All SQL queries for calendar_events table.
Uses indexed columns: start_datetime, owner_id, status, event_type.
No N+1 — all joins in single query.
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.calendar_event import CalendarEvent
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.user import User


class CalendarRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── internal join query ───────────────────────────────────────────────────

    def _enriched_select(self):
        """
        Single select with all LEFT JOINs so callers get enriched rows.
        """
        owner = aliased(User, name="owner_user")
        return (
            select(
                CalendarEvent,
                owner.full_name.label("owner_name"),
                Lead.title.label("lead_name"),
                Contact.full_name.label("contact_name"),
                Company.name.label("company_name"),
                Deal.name.label("deal_name"),
            )
            .outerjoin(owner, owner.id == CalendarEvent.owner_id)
            .outerjoin(Lead, Lead.id == CalendarEvent.related_lead_id)
            .outerjoin(Contact, Contact.id == CalendarEvent.related_contact_id)
            .outerjoin(Company, Company.id == CalendarEvent.related_company_id)
            .outerjoin(Deal, Deal.id == CalendarEvent.related_deal_id)
        )

    def _base_filter(self, organization_id: UUID, stmt):
        return stmt.where(
            CalendarEvent.organization_id == organization_id,
            CalendarEvent.is_deleted.is_(False),
        )

    def _rbac_filter(
        self,
        stmt,
        *,
        user_id: Optional[UUID],
        team_user_ids: Optional[list[UUID]],
    ):
        if user_id is not None and team_user_ids is None:
            return stmt.where(CalendarEvent.owner_id == user_id)
        if team_user_ids is not None:
            return stmt.where(CalendarEvent.owner_id.in_(team_user_ids))
        return stmt  # admin — no extra filter

    # ── CRUD ──────────────────────────────────────────────────────────────────

    async def create(self, **kwargs) -> CalendarEvent:
        event = CalendarEvent(**kwargs)
        self.db.add(event)
        await self.db.flush()
        await self.db.refresh(event)
        return event

    async def get_by_id(
        self, event_id: UUID, organization_id: UUID
    ) -> Optional[dict[str, Any]]:
        stmt = self._enriched_select()
        stmt = self._base_filter(organization_id, stmt)
        stmt = stmt.where(CalendarEvent.id == event_id)
        result = await self.db.execute(stmt)
        row = result.first()
        return self._row_to_dict(row) if row else None

    async def get_raw_by_id(
        self, event_id: UUID, organization_id: UUID
    ) -> Optional[CalendarEvent]:
        stmt = (
            select(CalendarEvent)
            .where(
                CalendarEvent.id == event_id,
                CalendarEvent.organization_id == organization_id,
                CalendarEvent.is_deleted.is_(False),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update(self, event: CalendarEvent, **kwargs) -> CalendarEvent:
        for k, v in kwargs.items():
            setattr(event, k, v)
        self.db.add(event)
        await self.db.flush()
        await self.db.refresh(event)
        return event

    async def soft_delete(self, event: CalendarEvent) -> None:
        event.is_deleted = True
        event.is_active = False
        self.db.add(event)
        await self.db.flush()

    # ── Calendar view queries ─────────────────────────────────────────────────

    async def get_events_in_range(
        self,
        organization_id: UUID,
        start: datetime,
        end: datetime,
        *,
        user_id: Optional[UUID] = None,
        team_user_ids: Optional[list[UUID]] = None,
        event_type: Optional[str] = None,
        status: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        stmt = self._enriched_select()
        stmt = self._base_filter(organization_id, stmt)
        stmt = self._rbac_filter(stmt, user_id=user_id, team_user_ids=team_user_ids)
        stmt = stmt.where(
            CalendarEvent.start_datetime >= start,
            CalendarEvent.start_datetime < end,
        )
        if event_type:
            stmt = stmt.where(CalendarEvent.event_type == event_type)
        if status:
            stmt = stmt.where(CalendarEvent.status == status)
        stmt = stmt.order_by(CalendarEvent.start_datetime.asc())
        result = await self.db.execute(stmt)
        return [self._row_to_dict(r) for r in result.all()]

    async def get_events_for_day(
        self,
        organization_id: UUID,
        day: date,
        *,
        user_id: Optional[UUID] = None,
        team_user_ids: Optional[list[UUID]] = None,
    ) -> list[dict[str, Any]]:
        day_start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        day_end = datetime(day.year, day.month, day.day, 23, 59, 59, tzinfo=timezone.utc)
        stmt = self._enriched_select()
        stmt = self._base_filter(organization_id, stmt)
        stmt = self._rbac_filter(stmt, user_id=user_id, team_user_ids=team_user_ids)
        stmt = stmt.where(
            CalendarEvent.start_datetime >= day_start,
            CalendarEvent.start_datetime <= day_end,
        )
        stmt = stmt.order_by(CalendarEvent.start_datetime.asc())
        result = await self.db.execute(stmt)
        return [self._row_to_dict(r) for r in result.all()]

    # ── Upcoming ──────────────────────────────────────────────────────────────

    async def get_upcoming(
        self,
        organization_id: UUID,
        *,
        user_id: Optional[UUID] = None,
        team_user_ids: Optional[list[UUID]] = None,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        now = datetime.now(timezone.utc)
        stmt = self._enriched_select()
        stmt = self._base_filter(organization_id, stmt)
        stmt = self._rbac_filter(stmt, user_id=user_id, team_user_ids=team_user_ids)
        stmt = stmt.where(
            CalendarEvent.start_datetime >= now,
            CalendarEvent.status.in_(["scheduled", "in_progress"]),
        )
        stmt = stmt.order_by(CalendarEvent.start_datetime.asc()).limit(limit)
        result = await self.db.execute(stmt)
        return [self._row_to_dict(r) for r in result.all()]

    # ── Today schedule counts ─────────────────────────────────────────────────

    async def get_today_counts(
        self,
        organization_id: UUID,
        *,
        user_id: Optional[UUID] = None,
        team_user_ids: Optional[list[UUID]] = None,
    ) -> dict[str, int]:
        now = datetime.now(timezone.utc)
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

        async def _count(type_filter) -> int:
            stmt = select(func.count(CalendarEvent.id)).where(
                CalendarEvent.organization_id == organization_id,
                CalendarEvent.is_deleted.is_(False),
                CalendarEvent.start_datetime >= day_start,
                CalendarEvent.start_datetime <= day_end,
                CalendarEvent.event_type == type_filter,
            )
            if user_id is not None and team_user_ids is None:
                stmt = stmt.where(CalendarEvent.owner_id == user_id)
            elif team_user_ids is not None:
                stmt = stmt.where(CalendarEvent.owner_id.in_(team_user_ids))
            r = await self.db.execute(stmt)
            return int(r.scalar_one() or 0)

        return {
            "meetings": await _count("meeting"),
            "calls": await _count("call"),
            "tasks": await _count("task"),
            "followUps": await _count("follow_up"),
        }

    # ── Statistics ────────────────────────────────────────────────────────────

    async def get_statistics(
        self,
        organization_id: UUID,
        *,
        user_id: Optional[UUID] = None,
        team_user_ids: Optional[list[UUID]] = None,
    ) -> dict[str, int]:
        from datetime import timedelta
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        def _base_count():
            stmt = select(func.count(CalendarEvent.id)).where(
                CalendarEvent.organization_id == organization_id,
                CalendarEvent.is_deleted.is_(False),
            )
            if user_id is not None and team_user_ids is None:
                stmt = stmt.where(CalendarEvent.owner_id == user_id)
            elif team_user_ids is not None:
                stmt = stmt.where(CalendarEvent.owner_id.in_(team_user_ids))
            return stmt

        async def _count(*extra):
            q = _base_count()
            for f in extra:
                q = q.where(f)
            r = await self.db.execute(q)
            return int(r.scalar_one() or 0)

        today = await _count(CalendarEvent.start_datetime >= today_start)
        week = await _count(CalendarEvent.start_datetime >= now - timedelta(days=7))
        month = await _count(CalendarEvent.start_datetime >= now - timedelta(days=30))
        completed = await _count(CalendarEvent.status == "completed")
        missed = await _count(CalendarEvent.status == "missed")
        cancelled = await _count(CalendarEvent.status == "cancelled")

        return {
            "today": today,
            "week": week,
            "month": month,
            "completed": completed,
            "missed": missed,
            "cancelled": cancelled,
        }

    # ── Overdue ───────────────────────────────────────────────────────────────

    async def get_overdue(
        self,
        organization_id: UUID,
        *,
        user_id: Optional[UUID] = None,
        team_user_ids: Optional[list[UUID]] = None,
    ) -> list[dict[str, Any]]:
        now = datetime.now(timezone.utc)
        owner = aliased(User, name="owner_user")
        stmt = (
            select(
                CalendarEvent.id,
                CalendarEvent.title,
                CalendarEvent.end_datetime,
                CalendarEvent.event_type,
                CalendarEvent.priority,
                CalendarEvent.owner_id,
                owner.full_name.label("owner_name"),
            )
            .outerjoin(owner, owner.id == CalendarEvent.owner_id)
            .where(
                CalendarEvent.organization_id == organization_id,
                CalendarEvent.is_deleted.is_(False),
                CalendarEvent.end_datetime < now,
                CalendarEvent.status.notin_(["completed", "cancelled"]),
            )
            .order_by(CalendarEvent.end_datetime.asc())
        )
        if user_id is not None and team_user_ids is None:
            stmt = stmt.where(CalendarEvent.owner_id == user_id)
        elif team_user_ids is not None:
            stmt = stmt.where(CalendarEvent.owner_id.in_(team_user_ids))

        result = await self.db.execute(stmt)
        rows = result.mappings().all()
        out = []
        for r in rows:
            overdue_secs = (now - r["end_datetime"].replace(tzinfo=timezone.utc if r["end_datetime"].tzinfo is None else r["end_datetime"].tzinfo)).total_seconds()
            out.append({
                "id": r["id"],
                "title": r["title"],
                "overdue_hours": round(overdue_secs / 3600, 1),
                "type": r["event_type"],
                "priority": r["priority"],
                "owner": r["owner_name"],
            })
        return out

    # ── Conflict detection ────────────────────────────────────────────────────

    async def get_conflicts(
        self,
        organization_id: UUID,
        owner_id: UUID,
        start: datetime,
        end: datetime,
        exclude_event_id: Optional[UUID] = None,
    ) -> list[dict[str, Any]]:
        """
        Returns events that overlap with [start, end) for the given owner.
        Overlap condition: existing.start < new.end AND existing.end > new.start
        """
        stmt = self._enriched_select()
        stmt = self._base_filter(organization_id, stmt)
        stmt = stmt.where(
            CalendarEvent.owner_id == owner_id,
            CalendarEvent.status.notin_(["cancelled", "completed"]),
            CalendarEvent.start_datetime < end,
            CalendarEvent.end_datetime > start,
        )
        if exclude_event_id:
            stmt = stmt.where(CalendarEvent.id != exclude_event_id)
        result = await self.db.execute(stmt)
        return [self._row_to_dict(r) for r in result.all()]

    # ── Search ────────────────────────────────────────────────────────────────

    async def search(
        self,
        organization_id: UUID,
        q: str,
        *,
        user_id: Optional[UUID] = None,
        team_user_ids: Optional[list[UUID]] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        term = f"%{q.strip().lower()}%"
        owner = aliased(User, name="owner_user")

        base_stmt = (
            select(CalendarEvent)
            .outerjoin(owner, owner.id == CalendarEvent.owner_id)
            .outerjoin(Lead, Lead.id == CalendarEvent.related_lead_id)
            .outerjoin(Contact, Contact.id == CalendarEvent.related_contact_id)
            .outerjoin(Company, Company.id == CalendarEvent.related_company_id)
            .outerjoin(Deal, Deal.id == CalendarEvent.related_deal_id)
            .where(
                CalendarEvent.organization_id == organization_id,
                CalendarEvent.is_deleted.is_(False),
                or_(
                    CalendarEvent.title.ilike(term),
                    CalendarEvent.description.ilike(term),
                    CalendarEvent.event_type.ilike(term),
                    owner.full_name.ilike(term),
                    Lead.title.ilike(term),
                    Contact.full_name.ilike(term),
                    Company.name.ilike(term),
                    Deal.name.ilike(term),
                ),
            )
        )
        if user_id is not None and team_user_ids is None:
            base_stmt = base_stmt.where(CalendarEvent.owner_id == user_id)
        elif team_user_ids is not None:
            base_stmt = base_stmt.where(CalendarEvent.owner_id.in_(team_user_ids))

        # total count
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)

        # paginated enriched result
        enrich_stmt = (
            select(
                CalendarEvent,
                owner.full_name.label("owner_name"),
                Lead.title.label("lead_name"),
                Contact.full_name.label("contact_name"),
                Company.name.label("company_name"),
                Deal.name.label("deal_name"),
            )
            .outerjoin(owner, owner.id == CalendarEvent.owner_id)
            .outerjoin(Lead, Lead.id == CalendarEvent.related_lead_id)
            .outerjoin(Contact, Contact.id == CalendarEvent.related_contact_id)
            .outerjoin(Company, Company.id == CalendarEvent.related_company_id)
            .outerjoin(Deal, Deal.id == CalendarEvent.related_deal_id)
            .where(
                CalendarEvent.organization_id == organization_id,
                CalendarEvent.is_deleted.is_(False),
                or_(
                    CalendarEvent.title.ilike(term),
                    CalendarEvent.description.ilike(term),
                    CalendarEvent.event_type.ilike(term),
                    owner.full_name.ilike(term),
                    Lead.title.ilike(term),
                    Contact.full_name.ilike(term),
                    Company.name.ilike(term),
                    Deal.name.ilike(term),
                ),
            )
            .order_by(CalendarEvent.start_datetime.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        if user_id is not None and team_user_ids is None:
            enrich_stmt = enrich_stmt.where(CalendarEvent.owner_id == user_id)
        elif team_user_ids is not None:
            enrich_stmt = enrich_stmt.where(CalendarEvent.owner_id.in_(team_user_ids))

        result = await self.db.execute(enrich_stmt)
        return [self._row_to_dict(r) for r in result.all()], total

    # ── Reminders ─────────────────────────────────────────────────────────────

    async def get_due_reminders(
        self,
        organization_id: UUID,
        window_minutes: int = 60,
    ) -> list[dict[str, Any]]:
        """
        Returns events whose reminder_at falls within the next window_minutes.
        reminder_at = start_datetime - reminder_minutes
        """
        from datetime import timedelta
        now = datetime.now(timezone.utc)
        window_end = now + timedelta(minutes=window_minutes)

        stmt = (
            select(
                CalendarEvent.id,
                CalendarEvent.title,
                CalendarEvent.start_datetime,
                CalendarEvent.reminder_minutes,
                CalendarEvent.owner_id,
            )
            .where(
                CalendarEvent.organization_id == organization_id,
                CalendarEvent.is_deleted.is_(False),
                CalendarEvent.status == "scheduled",
                CalendarEvent.reminder_minutes.isnot(None),
            )
        )
        result = await self.db.execute(stmt)
        rows = result.mappings().all()

        due = []
        for r in rows:
            from datetime import timedelta as td
            reminder_at = r["start_datetime"] - td(minutes=r["reminder_minutes"])
            if now <= reminder_at <= window_end:
                due.append({
                    "event_id": r["id"],
                    "title": r["title"],
                    "start_datetime": r["start_datetime"],
                    "reminder_minutes": r["reminder_minutes"],
                    "reminder_at": reminder_at,
                    "owner_id": r["owner_id"],
                })
        return due

    # ── Helper ────────────────────────────────────────────────────────────────

    @staticmethod
    def _row_to_dict(row) -> dict[str, Any]:
        """Convert a SQLAlchemy row (CalendarEvent + joined fields) to dict."""
        event: CalendarEvent = row[0]
        d = {c.name: getattr(event, c.name) for c in event.__table__.columns}
        d["owner_name"]   = row[1] if len(row) > 1 else None
        d["lead_name"]    = row[2] if len(row) > 2 else None
        d["contact_name"] = row[3] if len(row) > 3 else None
        d["company_name"] = row[4] if len(row) > 4 else None
        d["deal_name"]    = row[5] if len(row) > 5 else None
        return d
