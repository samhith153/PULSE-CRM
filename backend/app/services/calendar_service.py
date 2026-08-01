"""
Calendar Service
Business logic for the Calendar Schedule module.

RBAC:
  sales_rep  → own events only
  manager    → own + team (all org users)
  admin      → entire organisation
"""
from __future__ import annotations

import math
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, NotFoundException
from app.models.calendar_event import CalendarEvent
from app.models.user import User
from app.repositories.calendar_repository import CalendarRepository
from app.schemas.calendar import (
    CalendarEventCreateRequest,
    CalendarEventResponse,
    CalendarEventUpdateRequest,
    CalendarStatisticsResponse,
    CalendarViewResponse,
    ConflictCheckResponse,
    DayAgendaEvent,
    DayAgendaResponse,
    OverdueEventItem,
    ReminderItem,
    TodayScheduleResponse,
)
from app.services.timeline_engine_service import TimelineEngineService


class CalendarService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = CalendarRepository(db)
        self.timeline = TimelineEngineService(db)

    # ── RBAC scope ────────────────────────────────────────────────────────────

    async def _scope(self, user: User) -> tuple[UUID | None, list[UUID] | None]:
        roles = {ur.role.name for ur in user.user_roles if ur.role}
        if "admin" in roles:
            return None, None
        if "manager" in roles:
            stmt = select(User.id).where(
                User.organization_id == user.organization_id,
                User.is_active.is_(True),
                User.is_deleted.is_(False),
            )
            result = await self.db.execute(stmt)
            team_ids = [r[0] for r in result.all()]
            return None, team_ids
        return user.id, None

    # ── Calendar view ─────────────────────────────────────────────────────────

    async def get_calendar_view(
        self,
        user: User,
        view: str = "week",
        ref_date: date | None = None,
        event_type: str | None = None,
        status: str | None = None,
    ) -> CalendarViewResponse:
        ref = ref_date or datetime.now(timezone.utc).date()
        start_dt, end_dt = self._view_range(view, ref)
        user_id, team_ids = await self._scope(user)

        rows = await self.repo.get_events_in_range(
            user.organization_id,
            start_dt,
            end_dt,
            user_id=user_id,
            team_user_ids=team_ids,
            event_type=event_type,
            status=status,
        )

        events = [self._to_response(r) for r in rows]
        agenda = [self._to_agenda(r) for r in rows]
        stats = await self.repo.get_statistics(
            user.organization_id, user_id=user_id, team_user_ids=team_ids
        )

        return CalendarViewResponse(
            view=view,
            start_date=start_dt.date().isoformat(),
            end_date=(end_dt - timedelta(seconds=1)).date().isoformat(),
            events=events,
            agenda=agenda,
            statistics=stats,
        )

    # ── Day agenda ────────────────────────────────────────────────────────────

    async def get_day_agenda(
        self, user: User, day: date
    ) -> DayAgendaResponse:
        user_id, team_ids = await self._scope(user)
        rows = await self.repo.get_events_for_day(
            user.organization_id, day,
            user_id=user_id, team_user_ids=team_ids,
        )
        return DayAgendaResponse(
            date=day.isoformat(),
            events=[self._to_agenda(r) for r in rows],
        )

    # ── CRUD ──────────────────────────────────────────────────────────────────

    async def create_event(
        self, user: User, payload: CalendarEventCreateRequest
    ) -> CalendarEventResponse:
        owner_id = payload.owner_id or user.id

        # Conflict detection
        conflicts = await self.repo.get_conflicts(
            user.organization_id,
            owner_id,
            payload.start_datetime,
            payload.end_datetime,
        )
        if conflicts:
            raise BusinessRuleException(
                "Calendar Conflict Detected",
                details={
                    "message": f"{len(conflicts)} overlapping event(s) found.",
                    "conflicting_events": [c["title"] for c in conflicts],
                },
            )

        event = await self.repo.create(
            title=payload.title,
            description=payload.description,
            event_type=payload.event_type,
            priority=payload.priority,
            start_datetime=payload.start_datetime,
            end_datetime=payload.end_datetime,
            is_all_day=payload.is_all_day,
            location=payload.location,
            meeting_url=payload.meeting_url,
            owner_id=owner_id,
            related_lead_id=payload.related_lead_id,
            related_contact_id=payload.related_contact_id,
            related_company_id=payload.related_company_id,
            related_deal_id=payload.related_deal_id,
            reminder_minutes=payload.reminder_minutes,
            organization_id=user.organization_id,
            created_by=user.id,
            status="scheduled",
        )

        # Audit log
        await self.timeline.record_activity(
            organization_id=user.organization_id,
            created_by=user.id,
            entity_type="calendar_event",
            entity_id=event.id,
            action="meeting_scheduled" if payload.event_type == "meeting" else f"{payload.event_type}_added",
            title=f"{payload.event_type.replace('_', ' ').title()} scheduled: {payload.title}",
            description=payload.description,
            payload={
                "event_id": str(event.id),
                "event_type": payload.event_type,
                "start_datetime": payload.start_datetime.isoformat(),
            },
            topic="calendar",
        )

        row = await self.repo.get_by_id(event.id, user.organization_id)
        return self._to_response(row)

    async def get_event(
        self, user: User, event_id: UUID
    ) -> CalendarEventResponse:
        row = await self.repo.get_by_id(event_id, user.organization_id)
        if not row:
            raise NotFoundException("CalendarEvent", event_id)
        self._assert_access(user, row)
        return self._to_response(row)

    async def update_event(
        self,
        user: User,
        event_id: UUID,
        payload: CalendarEventUpdateRequest,
    ) -> CalendarEventResponse:
        event = await self.repo.get_raw_by_id(event_id, user.organization_id)
        if not event:
            raise NotFoundException("CalendarEvent", event_id)
        self._assert_access_raw(user, event)

        update_data = payload.model_dump(exclude_none=True)

        # If rescheduling, re-check conflicts
        new_start = update_data.get("start_datetime", event.start_datetime)
        new_end = update_data.get("end_datetime", event.end_datetime)
        if "start_datetime" in update_data or "end_datetime" in update_data:
            owner_id = update_data.get("owner_id", event.owner_id)
            conflicts = await self.repo.get_conflicts(
                user.organization_id, owner_id, new_start, new_end,
                exclude_event_id=event_id,
            )
            if conflicts:
                raise BusinessRuleException(
                    "Calendar Conflict Detected",
                    details={"conflicting_events": [c["title"] for c in conflicts]},
                )
            if update_data.get("status") not in (None, "rescheduled"):
                update_data.setdefault("status", "rescheduled")

        updated = await self.repo.update(event, **update_data)

        # Audit log
        action = "event_updated"
        if update_data.get("status") == "cancelled":
            action = "meeting_cancelled"
        elif "start_datetime" in update_data:
            action = "event_rescheduled"

        await self.timeline.record_activity(
            organization_id=user.organization_id,
            created_by=user.id,
            entity_type="calendar_event",
            entity_id=updated.id,
            action=action,
            title=f"Calendar event {action.replace('_', ' ')}: {updated.title}",
            payload={"event_id": str(updated.id), "changes": list(update_data.keys())},
            topic="calendar",
        )

        row = await self.repo.get_by_id(updated.id, user.organization_id)
        return self._to_response(row)

    async def delete_event(self, user: User, event_id: UUID) -> None:
        event = await self.repo.get_raw_by_id(event_id, user.organization_id)
        if not event:
            raise NotFoundException("CalendarEvent", event_id)
        self._assert_access_raw(user, event)
        await self.repo.soft_delete(event)

        await self.timeline.record_activity(
            organization_id=user.organization_id,
            created_by=user.id,
            entity_type="calendar_event",
            entity_id=event_id,
            action="event_deleted",
            title=f"Calendar event deleted: {event.title}",
            payload={"event_id": str(event_id)},
            topic="calendar",
        )

    # ── Upcoming ──────────────────────────────────────────────────────────────

    async def get_upcoming(self, user: User, limit: int = 10) -> list[CalendarEventResponse]:
        user_id, team_ids = await self._scope(user)
        rows = await self.repo.get_upcoming(
            user.organization_id,
            user_id=user_id, team_user_ids=team_ids,
            limit=limit,
        )
        return [self._to_response(r) for r in rows]

    # ── Today schedule ────────────────────────────────────────────────────────

    async def get_today_schedule(self, user: User) -> TodayScheduleResponse:
        user_id, team_ids = await self._scope(user)
        counts = await self.repo.get_today_counts(
            user.organization_id, user_id=user_id, team_user_ids=team_ids
        )
        return TodayScheduleResponse(
            meetings=counts["meetings"],
            calls=counts["calls"],
            tasks=counts["tasks"],
            followUps=counts["followUps"],
        )

    # ── Statistics ────────────────────────────────────────────────────────────

    async def get_statistics(self, user: User) -> CalendarStatisticsResponse:
        user_id, team_ids = await self._scope(user)
        stats = await self.repo.get_statistics(
            user.organization_id, user_id=user_id, team_user_ids=team_ids
        )
        return CalendarStatisticsResponse(**stats)

    # ── Overdue ───────────────────────────────────────────────────────────────

    async def get_overdue(self, user: User) -> list[OverdueEventItem]:
        user_id, team_ids = await self._scope(user)
        rows = await self.repo.get_overdue(
            user.organization_id, user_id=user_id, team_user_ids=team_ids
        )
        return [
            OverdueEventItem(
                id=r["id"],
                title=r["title"],
                overdueHours=r["overdue_hours"],
                type=r["type"],
                priority=r["priority"],
                owner=r.get("owner"),
            )
            for r in rows
        ]

    # ── Conflict check ────────────────────────────────────────────────────────

    async def check_conflict(
        self,
        user: User,
        owner_id: UUID,
        start: datetime,
        end: datetime,
        exclude_event_id: UUID | None = None,
    ) -> ConflictCheckResponse:
        conflicts = await self.repo.get_conflicts(
            user.organization_id, owner_id, start, end,
            exclude_event_id=exclude_event_id,
        )
        return ConflictCheckResponse(
            has_conflict=bool(conflicts),
            message="Calendar Conflict Detected" if conflicts else "No conflicts found",
            conflicting_events=[self._to_response(c) for c in conflicts],
        )

    # ── Search ────────────────────────────────────────────────────────────────

    async def search(
        self,
        user: User,
        q: str,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[CalendarEventResponse], int]:
        user_id, team_ids = await self._scope(user)
        rows, total = await self.repo.search(
            user.organization_id, q,
            user_id=user_id, team_user_ids=team_ids,
            page=page, page_size=page_size,
        )
        return [self._to_response(r) for r in rows], total

    # ── Reminders ─────────────────────────────────────────────────────────────

    async def get_due_reminders(
        self, user: User, window_minutes: int = 60
    ) -> list[ReminderItem]:
        rows = await self.repo.get_due_reminders(
            user.organization_id, window_minutes=window_minutes
        )
        return [
            ReminderItem(
                event_id=r["event_id"],
                title=r["title"],
                start_datetime=r["start_datetime"],
                reminder_minutes=r["reminder_minutes"],
                reminder_at=r["reminder_at"],
                owner_id=r["owner_id"],
            )
            for r in rows
        ]

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _view_range(
        self, view: str, ref: date
    ) -> tuple[datetime, datetime]:
        """Return (start_datetime, end_datetime) for the requested view."""
        if view == "day":
            start = datetime(ref.year, ref.month, ref.day, tzinfo=timezone.utc)
            end = start + timedelta(days=1)
        elif view == "month":
            start = datetime(ref.year, ref.month, 1, tzinfo=timezone.utc)
            # first day of next month
            if ref.month == 12:
                end = datetime(ref.year + 1, 1, 1, tzinfo=timezone.utc)
            else:
                end = datetime(ref.year, ref.month + 1, 1, tzinfo=timezone.utc)
        else:  # week — Mon to Sun
            weekday = ref.weekday()  # 0=Mon
            monday = ref - timedelta(days=weekday)
            start = datetime(monday.year, monday.month, monday.day, tzinfo=timezone.utc)
            end = start + timedelta(weeks=1)
        return start, end

    def _to_response(self, row: dict) -> CalendarEventResponse:
        start: datetime = row["start_datetime"]
        end: datetime = row["end_datetime"]

        # ensure tz-aware for arithmetic
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)

        duration_mins = int((end - start).total_seconds() / 60)
        time_display = start.strftime("%-I:%M %p") if hasattr(start, "strftime") else start.strftime("%I:%M %p").lstrip("0")

        # friendly duration
        if duration_mins < 60:
            dur_display = f"{duration_mins} mins"
        elif duration_mins == 60:
            dur_display = "1 hour"
        else:
            hours = duration_mins // 60
            mins = duration_mins % 60
            dur_display = f"{hours}h {mins}m" if mins else f"{hours} hours"

        return CalendarEventResponse(
            id=row["id"],
            title=row["title"],
            description=row.get("description"),
            event_type=row["event_type"],
            status=row["status"],
            priority=row["priority"],
            start_datetime=start,
            end_datetime=end,
            is_all_day=row.get("is_all_day", False),
            location=row.get("location"),
            meeting_url=row.get("meeting_url"),
            owner_id=row.get("owner_id"),
            owner_name=row.get("owner_name"),
            related_lead_id=row.get("related_lead_id"),
            related_contact_id=row.get("related_contact_id"),
            related_company_id=row.get("related_company_id"),
            related_deal_id=row.get("related_deal_id"),
            reminder_minutes=row.get("reminder_minutes"),
            organization_id=row["organization_id"],
            created_by=row.get("created_by"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            lead_name=row.get("lead_name"),
            contact_name=row.get("contact_name"),
            company_name=row.get("company_name"),
            deal_name=row.get("deal_name"),
            duration_minutes=duration_mins,
            time_display=time_display,
            duration_display=dur_display,
        )

    def _to_agenda(self, row: dict) -> DayAgendaEvent:
        start: datetime = row["start_datetime"]
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        end: datetime = row["end_datetime"]
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        duration_mins = int((end - start).total_seconds() / 60)
        dur_display = f"{duration_mins} mins" if duration_mins < 60 else f"{duration_mins // 60}h" + (f" {duration_mins % 60}m" if duration_mins % 60 else "")

        try:
            time_str = start.strftime("%-I:%M %p")
        except ValueError:
            time_str = start.strftime("%I:%M %p").lstrip("0") or "12:00 AM"

        return DayAgendaEvent(
            id=row["id"],
            title=row["title"],
            time=time_str,
            duration=dur_display,
            type=row["event_type"].replace("_", " ").title(),
            priority=row["priority"],
            status=row["status"],
            lead=row.get("lead_name"),
            contact=row.get("contact_name"),
            company=row.get("company_name"),
            owner=row.get("owner_name"),
        )

    def _assert_access(self, user: User, row: dict) -> None:
        roles = {ur.role.name for ur in user.user_roles if ur.role}
        if "admin" in roles or "manager" in roles:
            return
        if row.get("owner_id") != user.id and row.get("created_by") != user.id:
            from app.core.exceptions import ForbiddenException
            raise ForbiddenException("You do not have access to this calendar event.")

    def _assert_access_raw(self, user: User, event: CalendarEvent) -> None:
        roles = {ur.role.name for ur in user.user_roles if ur.role}
        if "admin" in roles or "manager" in roles:
            return
        if event.owner_id != user.id and event.created_by != user.id:
            from app.core.exceptions import ForbiddenException
            raise ForbiddenException("You do not have access to this calendar event.")
