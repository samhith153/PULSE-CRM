"""
Calendar Routes
GET    /api/v1/calendar                  — calendar view (day/week/month)
GET    /api/v1/calendar/day/{date}       — day agenda
GET    /api/v1/calendar/today            — today's schedule counts
GET    /api/v1/calendar/upcoming         — next N events
GET    /api/v1/calendar/statistics       — event stats
GET    /api/v1/calendar/overdue          — overdue events
GET    /api/v1/calendar/search           — search events
GET    /api/v1/calendar/reminders        — due reminders
GET    /api/v1/calendar/conflict-check   — conflict detection
POST   /api/v1/calendar/event            — create event
GET    /api/v1/calendar/event/{id}       — get single event
PUT    /api/v1/calendar/event/{id}       — update event
DELETE /api/v1/calendar/event/{id}       — soft delete
"""
from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.calendar import (
    CalendarEventCreateRequest,
    CalendarEventResponse,
    CalendarEventUpdateRequest,
    CalendarStatisticsResponse,
    CalendarViewResponse,
    ConflictCheckResponse,
    DayAgendaResponse,
    OverdueEventItem,
    ReminderItem,
    TodayScheduleResponse,
)
from app.schemas.common import PaginatedResponse, StandardResponse
from app.services.calendar_service import CalendarService

router = APIRouter()


# ── Calendar view ─────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=StandardResponse[CalendarViewResponse],
    summary="Get calendar view (day / week / month)",
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["Calendar"],
)
async def get_calendar_view(
    current_user: CurrentUser,
    db: DBSession,
    view: str = Query(default="week", description="day | week | month"),
    date: Optional[date] = Query(default=None, description="Reference date (YYYY-MM-DD). Defaults to today."),
    event_type: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
) -> dict:
    svc = CalendarService(db)
    data = await svc.get_calendar_view(current_user, view=view, ref_date=date, event_type=event_type, status=status)
    return {"success": True, "message": "Calendar view retrieved.", "data": data}


# ── Day agenda ────────────────────────────────────────────────────────────────

@router.get(
    "/day/{target_date}",
    response_model=StandardResponse[DayAgendaResponse],
    summary="Get agenda for a specific day",
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["Calendar"],
)
async def get_day_agenda(
    target_date: date,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = CalendarService(db)
    data = await svc.get_day_agenda(current_user, target_date)
    return {"success": True, "message": "Day agenda retrieved.", "data": data}


# ── Today schedule ────────────────────────────────────────────────────────────

@router.get(
    "/today",
    response_model=StandardResponse[TodayScheduleResponse],
    summary="Today's schedule summary (meetings / calls / tasks / follow-ups)",
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["Calendar"],
)
async def get_today_schedule(current_user: CurrentUser, db: DBSession) -> dict:
    svc = CalendarService(db)
    data = await svc.get_today_schedule(current_user)
    return {"success": True, "message": "Today schedule retrieved.", "data": data}


# ── Upcoming events ───────────────────────────────────────────────────────────

@router.get(
    "/upcoming",
    response_model=StandardResponse[list[CalendarEventResponse]],
    summary="Next N scheduled events",
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["Calendar"],
)
async def get_upcoming_events(
    current_user: CurrentUser,
    db: DBSession,
    limit: int = Query(default=10, ge=1, le=50),
) -> dict:
    svc = CalendarService(db)
    data = await svc.get_upcoming(current_user, limit=limit)
    return {"success": True, "message": "Upcoming events retrieved.", "data": data}


# ── Statistics ────────────────────────────────────────────────────────────────

@router.get(
    "/statistics",
    response_model=StandardResponse[CalendarStatisticsResponse],
    summary="Calendar event statistics",
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["Calendar"],
)
async def get_calendar_statistics(current_user: CurrentUser, db: DBSession) -> dict:
    svc = CalendarService(db)
    data = await svc.get_statistics(current_user)
    return {"success": True, "message": "Statistics retrieved.", "data": data}


# ── Overdue events ────────────────────────────────────────────────────────────

@router.get(
    "/overdue",
    response_model=StandardResponse[list[OverdueEventItem]],
    summary="Overdue calendar events",
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["Calendar"],
)
async def get_overdue_events(current_user: CurrentUser, db: DBSession) -> dict:
    svc = CalendarService(db)
    data = await svc.get_overdue(current_user)
    return {"success": True, "message": "Overdue events retrieved.", "data": data}


# ── Search ────────────────────────────────────────────────────────────────────

@router.get(
    "/search",
    response_model=StandardResponse[PaginatedResponse[CalendarEventResponse]],
    summary="Search calendar events",
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["Calendar"],
)
async def search_calendar_events(
    current_user: CurrentUser,
    db: DBSession,
    q: str = Query(description="Search across title, description, type, lead, contact, company, deal, owner"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    svc = CalendarService(db)
    events, total = await svc.search(current_user, q, page=page, page_size=page_size)
    paginated = PaginatedResponse.create(data=events, total=total, page=page, page_size=page_size)
    return {"success": True, "message": "Search results retrieved.", "data": paginated}


# ── Reminders ─────────────────────────────────────────────────────────────────

@router.get(
    "/reminders",
    response_model=StandardResponse[list[ReminderItem]],
    summary="Due reminders within a time window",
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["Calendar"],
)
async def get_due_reminders(
    current_user: CurrentUser,
    db: DBSession,
    window_minutes: int = Query(default=60, ge=1, le=1440),
) -> dict:
    svc = CalendarService(db)
    data = await svc.get_due_reminders(current_user, window_minutes=window_minutes)
    return {"success": True, "message": "Due reminders retrieved.", "data": data}


# ── Conflict check ────────────────────────────────────────────────────────────

@router.get(
    "/conflict-check",
    response_model=StandardResponse[ConflictCheckResponse],
    summary="Check for scheduling conflicts",
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["Calendar"],
)
async def check_conflict(
    current_user: CurrentUser,
    db: DBSession,
    owner_id: UUID = Query(description="User ID to check conflicts for"),
    start_datetime: str = Query(description="ISO 8601 start datetime"),
    end_datetime: str = Query(description="ISO 8601 end datetime"),
    exclude_event_id: Optional[UUID] = Query(default=None),
) -> dict:
    from datetime import datetime
    start = datetime.fromisoformat(start_datetime)
    end = datetime.fromisoformat(end_datetime)
    svc = CalendarService(db)
    data = await svc.check_conflict(current_user, owner_id, start, end, exclude_event_id)
    return {"success": True, "message": data.message, "data": data}


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.post(
    "/event",
    response_model=StandardResponse[CalendarEventResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new calendar event",
    dependencies=[Depends(require_permission("activity:create"))],
    tags=["Calendar"],
)
async def create_calendar_event(
    payload: CalendarEventCreateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = CalendarService(db)
    data = await svc.create_event(current_user, payload)
    return {"success": True, "message": "Event created.", "data": data}


@router.get(
    "/event/{event_id}",
    response_model=StandardResponse[CalendarEventResponse],
    summary="Get a calendar event by ID",
    dependencies=[Depends(require_permission("activity:read"))],
    tags=["Calendar"],
)
async def get_calendar_event(
    event_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = CalendarService(db)
    data = await svc.get_event(current_user, event_id)
    return {"success": True, "message": "OK", "data": data}


@router.put(
    "/event/{event_id}",
    response_model=StandardResponse[CalendarEventResponse],
    summary="Update a calendar event",
    dependencies=[Depends(require_permission("activity:create"))],
    tags=["Calendar"],
)
async def update_calendar_event(
    event_id: UUID,
    payload: CalendarEventUpdateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = CalendarService(db)
    data = await svc.update_event(current_user, event_id, payload)
    return {"success": True, "message": "Event updated.", "data": data}


@router.delete(
    "/event/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete a calendar event",
    dependencies=[Depends(require_permission("activity:create"))],
    tags=["Calendar"],
)
async def delete_calendar_event(
    event_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    svc = CalendarService(db)
    await svc.delete_event(current_user, event_id)
