"""
Meeting service.
"""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.user import User
from app.repositories.meeting_repository import MeetingRepository
from app.schemas.meeting import MeetingCreateRequest, MeetingResponse, MeetingUpdateRequest
from app.services.timeline_engine_service import TimelineEngineService


class MeetingService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = MeetingRepository(db)
        self.timeline = TimelineEngineService(db)

    async def create_meeting(self, user: User, payload: MeetingCreateRequest) -> MeetingResponse:
        owner_id = payload.owner_id or user.id
        meeting = await self.repo.create(
            title=payload.title,
            description=payload.description,
            status=payload.status,
            event_type="meeting",
            start_datetime=payload.start_datetime,
            end_datetime=payload.end_datetime,
            owner_id=owner_id,
            meeting_url=payload.meeting_link,
            location=payload.location,
            reminder_minutes=payload.reminder_minutes,
            related_lead_id=payload.related_lead_id,
            related_contact_id=payload.related_contact_id,
            related_company_id=payload.related_company_id,
            related_deal_id=payload.related_deal_id,
            organization_id=user.organization_id,
            created_by=user.id,
        )
        await self.timeline.meeting_scheduled(
            user.organization_id, user.id, meeting.id,
            meeting.title, meeting.start_datetime,
        )
        # Cross-reference on related entity
        for entity_type, entity_id in [
            ("lead", meeting.related_lead_id),
            ("contact", meeting.related_contact_id),
            ("company", meeting.related_company_id),
            ("deal", meeting.related_deal_id),
        ]:
            if entity_id:
                await self.timeline.record(
                    user.organization_id, user.id, entity_type, entity_id,
                    "meeting_scheduled", f"Meeting scheduled: {meeting.title}",
                    payload={"meeting_id": str(meeting.id), "start_datetime": str(meeting.start_datetime)},
                    topic=entity_type + "s",
                )
        return await self.get_meeting(user, meeting.id)

    async def get_meeting(self, user: User, meeting_id: UUID) -> MeetingResponse:
        row = await self.repo.get_enriched_by_id(meeting_id, user.organization_id)
        if not row:
            raise NotFoundException("Meeting", meeting_id)
        self._assert_access(user, row.get("owner_id"), row.get("created_by"))
        return self._to_response(row)

    async def list_meetings(
        self,
        user: User,
        *,
        status: str | None,
        start: datetime | None,
        end: datetime | None,
        related_lead_id: UUID | None = None,
        related_contact_id: UUID | None = None,
        related_company_id: UUID | None = None,
        related_deal_id: UUID | None = None,
        page: int,
        page_size: int,
    ) -> tuple[list[MeetingResponse], int]:
        owner_id = None if self._has_elevated_access(user) else user.id
        rows, total = await self.repo.list(
            user.organization_id,
            owner_id=owner_id,
            status=status,
            start=start,
            end=end,
            related_lead_id=related_lead_id,
            related_contact_id=related_contact_id,
            related_company_id=related_company_id,
            related_deal_id=related_deal_id,
            page=page,
            page_size=page_size,
        )
        return [self._to_response(row) for row in rows], total

    async def today_meetings(self, user: User) -> list[MeetingResponse]:
        rows = await self.repo.get_today(user.organization_id, user.id)
        return [self._to_response(row) for row in rows]

    async def upcoming_meetings(self, user: User, limit: int = 10) -> list[MeetingResponse]:
        rows = await self.repo.get_upcoming(user.organization_id, user.id, limit=limit)
        return [self._to_response(row) for row in rows]

    async def update_meeting(self, user: User, meeting_id: UUID, payload: MeetingUpdateRequest) -> MeetingResponse:
        meeting = await self.repo.get_raw_by_id(meeting_id, user.organization_id)
        if not meeting:
            raise NotFoundException("Meeting", meeting_id)
        self._assert_access(user, meeting.owner_id, meeting.created_by)
        update_data = payload.model_dump(exclude_none=True)
        if "meeting_link" in update_data:
            update_data["meeting_url"] = update_data.pop("meeting_link")
        if update_data.get("end_datetime", meeting.end_datetime) <= update_data.get("start_datetime", meeting.start_datetime):
            raise ValueError("end_datetime must be after start_datetime")
        updated = await self.repo.update(meeting, **update_data)
        await self.timeline.meeting_updated(
            user.organization_id, user.id, updated.id, updated.title, update_data,
        )
        return await self.get_meeting(user, updated.id)

    async def delete_meeting(self, user: User, meeting_id: UUID) -> None:
        meeting = await self.repo.get_raw_by_id(meeting_id, user.organization_id)
        if not meeting:
            raise NotFoundException("Meeting", meeting_id)
        self._assert_access(user, meeting.owner_id, meeting.created_by)
        await self.repo.soft_delete(meeting)
        await self.timeline.meeting_deleted(
            user.organization_id, user.id, meeting_id, meeting.title,
        )

    def _has_elevated_access(self, user: User) -> bool:
        roles = {ur.role.name for ur in user.user_roles if ur.role}
        return bool({"admin", "manager"}.intersection(roles))

    def _assert_access(self, user: User, owner_id: UUID | None, created_by: UUID | None) -> None:
        if self._has_elevated_access(user):
            return
        if owner_id != user.id and created_by != user.id:
            raise ForbiddenException("You do not have access to this meeting.")

    def _to_response(self, row: dict) -> MeetingResponse:
        return MeetingResponse(**row)
