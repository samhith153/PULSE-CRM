"""
Unified CRM Activities Service
Handles task / call / note creation, listing, update, delete,
bulk operations, unified timeline view, and CSV/XLSX export.
"""
from __future__ import annotations

import csv
import io
from datetime import datetime, timezone
from typing import Any, List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.user import User
from app.repositories.crm_call_repository import CrmCallRepository
from app.repositories.crm_email_repository import CrmEmailRepository
from app.repositories.crm_note_repository import CrmNoteRepository
from app.repositories.crm_task_repository import CrmTaskRepository
from app.repositories.meeting_repository import MeetingRepository
from app.repositories.email_repository import EmailRepository
from app.repositories.user_repository import UserRepository
from app.schemas.crm_activities import (
    BulkDeleteRequest,
    BulkOperationResponse,
    BulkUpdateRequest,
    CallCreateRequest,
    CallResponse,
    CallUpdateRequest,
    EmailCreateRequest,
    EmailResponse,
    EmailUpdateRequest,
    NoteCreateRequest,
    NoteResponse,
    NoteUpdateRequest,
    OwnerItem,
    TaskCreateRequest,
    TaskResponse,
    TaskUpdateRequest,
    UnifiedActivityItem,
)
from app.services.timeline_engine_service import TimelineEngineService


class CrmActivitiesService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.task_repo = CrmTaskRepository(db)
        self.call_repo = CrmCallRepository(db)
        self.note_repo = CrmNoteRepository(db)
        self.meeting_repo = MeetingRepository(db)
        self.email_repo = CrmEmailRepository(db)
        self.user_repo = UserRepository(db)
        self.timeline = TimelineEngineService(db)

    # ─────────────────────────────────────────────────────────────────────────
    # RBAC helpers
    # ─────────────────────────────────────────────────────────────────────────

    def _has_elevated_access(self, user: User) -> bool:
        roles = {ur.role.name for ur in user.user_roles if ur.role}
        return bool({"admin", "manager"}.intersection(roles))

    def _assert_ownership(self, user: User, owner_id: Optional[UUID], created_by: Optional[UUID]) -> None:
        if self._has_elevated_access(user):
            return
        if owner_id != user.id and created_by != user.id:
            raise ForbiddenException("You do not have access to this activity.")

    def _scoped_owner_id(self, user: User) -> Optional[UUID]:
        """Returns owner_id filter for non-elevated users (sales_rep sees own only)."""
        return None if self._has_elevated_access(user) else user.id


    # ─────────────────────────────────────────────────────────────────────────
    # TASK CRUD
    # ─────────────────────────────────────────────────────────────────────────

    async def create_task(self, user: User, payload: TaskCreateRequest) -> TaskResponse:
        owner_id = payload.owner_id or user.id
        task = await self.task_repo.create(
            subject=payload.subject,
            description=payload.description,
            status=payload.status,
            priority=payload.priority,
            due_date=payload.due_date,
            owner_id=owner_id,
            reminder_minutes=payload.reminder_minutes,
            related_entity_type=payload.related_entity_type,
            related_lead_id=payload.related_lead_id,
            related_contact_id=payload.related_contact_id,
            related_company_id=payload.related_company_id,
            related_deal_id=payload.related_deal_id,
            organization_id=user.organization_id,
            created_by=user.id,
        )
        await self.timeline.task_created(
            user.organization_id, user.id, task.id,
            task.subject, task.priority, task.status, task.due_date
        )
        row = await self.task_repo.get_enriched_by_id(task.id, user.organization_id)
        return TaskResponse(**row)

    async def get_task(self, user: User, task_id: UUID) -> TaskResponse:
        row = await self.task_repo.get_enriched_by_id(task_id, user.organization_id)
        if not row:
            raise NotFoundException("Task", task_id)
        self._assert_ownership(user, row.get("owner_id"), row.get("created_by"))
        return TaskResponse(**row)

    async def update_task(self, user: User, task_id: UUID, payload: TaskUpdateRequest) -> TaskResponse:
        task = await self.task_repo.get_raw_by_id(task_id, user.organization_id)
        if not task:
            raise NotFoundException("Task", task_id)
        self._assert_ownership(user, task.owner_id, task.created_by)
        update_data = payload.model_dump(exclude_none=True)
        if update_data.get("status") == "completed" and not task.completed_at:
            update_data["completed_at"] = datetime.now(timezone.utc)
        # Capture old status before update for granular timeline event
        update_data["_old_status"] = task.status
        await self.task_repo.update(task, **{k: v for k, v in update_data.items() if not k.startswith("_")})
        await self.timeline.task_updated(
            user.organization_id, user.id, task_id, task.subject, update_data
        )
        row = await self.task_repo.get_enriched_by_id(task_id, user.organization_id)
        return TaskResponse(**row)

    async def delete_task(self, user: User, task_id: UUID) -> None:
        task = await self.task_repo.get_raw_by_id(task_id, user.organization_id)
        if not task:
            raise NotFoundException("Task", task_id)
        self._assert_ownership(user, task.owner_id, task.created_by)
        await self.task_repo.soft_delete(task)
        await self.timeline.task_deleted(user.organization_id, user.id, task_id, task.subject)


    # ─────────────────────────────────────────────────────────────────────────
    # CALL CRUD
    # ─────────────────────────────────────────────────────────────────────────

    async def create_call(self, user: User, payload: CallCreateRequest) -> CallResponse:
        owner_id = payload.owner_id or user.id
        call = await self.call_repo.create(
            subject=payload.subject,
            contact_name=payload.contact_name,
            phone_number=payload.phone_number,
            call_type=payload.call_type,
            duration_minutes=payload.duration_minutes,
            outcome=payload.outcome,
            notes=payload.notes,
            status=payload.status,
            priority=payload.priority,
            called_at=payload.called_at or datetime.now(timezone.utc),
            owner_id=owner_id,
            related_entity_type=payload.related_entity_type,
            related_lead_id=payload.related_lead_id,
            related_contact_id=payload.related_contact_id,
            related_company_id=payload.related_company_id,
            related_deal_id=payload.related_deal_id,
            organization_id=user.organization_id,
            created_by=user.id,
        )
        await self.timeline.call_logged(
            user.organization_id, user.id, call.id,
            call.subject, call.outcome, call.duration_minutes, call.call_type
        )
        row = await self.call_repo.get_enriched_by_id(call.id, user.organization_id)
        return CallResponse(**row)

    async def get_call(self, user: User, call_id: UUID) -> CallResponse:
        row = await self.call_repo.get_enriched_by_id(call_id, user.organization_id)
        if not row:
            raise NotFoundException("Call", call_id)
        self._assert_ownership(user, row.get("owner_id"), row.get("created_by"))
        return CallResponse(**row)

    async def update_call(self, user: User, call_id: UUID, payload: CallUpdateRequest) -> CallResponse:
        call = await self.call_repo.get_raw_by_id(call_id, user.organization_id)
        if not call:
            raise NotFoundException("Call", call_id)
        self._assert_ownership(user, call.owner_id, call.created_by)
        update_data = payload.model_dump(exclude_none=True)
        await self.call_repo.update(call, **update_data)
        await self.timeline.call_updated(
            user.organization_id, user.id, call_id, call.subject, update_data
        )
        row = await self.call_repo.get_enriched_by_id(call_id, user.organization_id)
        return CallResponse(**row)

    async def delete_call(self, user: User, call_id: UUID) -> None:
        call = await self.call_repo.get_raw_by_id(call_id, user.organization_id)
        if not call:
            raise NotFoundException("Call", call_id)
        self._assert_ownership(user, call.owner_id, call.created_by)
        await self.call_repo.soft_delete(call)
        await self.timeline.call_deleted(user.organization_id, user.id, call_id, call.subject)

    # ─────────────────────────────────────────────────────────────────────────
    # NOTE CRUD
    # ─────────────────────────────────────────────────────────────────────────

    async def create_note(self, user: User, payload: NoteCreateRequest) -> NoteResponse:
        owner_id = payload.owner_id or user.id
        note = await self.note_repo.create(
            title=payload.title,
            body=payload.body,
            owner_id=owner_id,
            related_entity_type=payload.related_entity_type,
            related_lead_id=payload.related_lead_id,
            related_contact_id=payload.related_contact_id,
            related_company_id=payload.related_company_id,
            related_deal_id=payload.related_deal_id,
            organization_id=user.organization_id,
            created_by=user.id,
        )
        await self.timeline.note_created(
            user.organization_id, user.id, note.id, note.title, note.body
        )
        row = await self.note_repo.get_enriched_by_id(note.id, user.organization_id)
        return NoteResponse(**row)

    async def get_note(self, user: User, note_id: UUID) -> NoteResponse:
        row = await self.note_repo.get_enriched_by_id(note_id, user.organization_id)
        if not row:
            raise NotFoundException("Note", note_id)
        self._assert_ownership(user, row.get("owner_id"), row.get("created_by"))
        return NoteResponse(**row)

    async def update_note(self, user: User, note_id: UUID, payload: NoteUpdateRequest) -> NoteResponse:
        note = await self.note_repo.get_raw_by_id(note_id, user.organization_id)
        if not note:
            raise NotFoundException("Note", note_id)
        self._assert_ownership(user, note.owner_id, note.created_by)
        update_data = payload.model_dump(exclude_none=True)
        await self.note_repo.update(note, **update_data)
        await self.timeline.note_edited(
            user.organization_id, user.id, note_id, note.title, update_data
        )
        row = await self.note_repo.get_enriched_by_id(note_id, user.organization_id)
        return NoteResponse(**row)

    async def delete_note(self, user: User, note_id: UUID) -> None:
        note = await self.note_repo.get_raw_by_id(note_id, user.organization_id)
        if not note:
            raise NotFoundException("Note", note_id)
        self._assert_ownership(user, note.owner_id, note.created_by)
        await self.note_repo.soft_delete(note)
        await self.timeline.note_deleted(user.organization_id, user.id, note_id, note.title)

    # ─────────────────────────────────────────────────────────────────────────
    # EMAIL CRUD
    # ─────────────────────────────────────────────────────────────────────────

    async def create_email(self, user: User, payload: EmailCreateRequest) -> EmailResponse:
        owner_id = payload.owner_id or user.id
        email = await self.email_repo.create(
            subject=payload.subject,
            body=payload.body,
            direction=payload.direction,
            recipient_email=payload.recipient_email,
            recipient_name=payload.recipient_name,
            status=payload.status,
            priority=payload.priority,
            sent_at=payload.sent_at or datetime.now(timezone.utc),
            owner_id=owner_id,
            related_entity_type=payload.related_entity_type,
            related_lead_id=payload.related_lead_id,
            related_contact_id=payload.related_contact_id,
            related_company_id=payload.related_company_id,
            related_deal_id=payload.related_deal_id,
            organization_id=user.organization_id,
            created_by=user.id,
        )
        await self.timeline.email_sent(
            user.organization_id, user.id, email.id,
            email.subject, email.direction, email.recipient_email
        )
        row = await self.email_repo.get_enriched_by_id(email.id, user.organization_id)
        return EmailResponse(**row)

    async def get_email(self, user: User, email_id: UUID) -> EmailResponse:
        row = await self.email_repo.get_enriched_by_id(email_id, user.organization_id)
        if not row:
            raise NotFoundException("Email", email_id)
        self._assert_ownership(user, row.get("owner_id"), row.get("created_by"))
        return EmailResponse(**row)

    async def update_email(self, user: User, email_id: UUID, payload: EmailUpdateRequest) -> EmailResponse:
        email = await self.email_repo.get_raw_by_id(email_id, user.organization_id)
        if not email:
            raise NotFoundException("Email", email_id)
        self._assert_ownership(user, email.owner_id, email.created_by)
        update_data = payload.model_dump(exclude_none=True)
        await self.email_repo.update(email, **update_data)
        row = await self.email_repo.get_enriched_by_id(email_id, user.organization_id)
        return EmailResponse(**row)

    async def delete_email(self, user: User, email_id: UUID) -> None:
        email = await self.email_repo.get_raw_by_id(email_id, user.organization_id)
        if not email:
            raise NotFoundException("Email", email_id)
        self._assert_ownership(user, email.owner_id, email.created_by)
        await self.email_repo.soft_delete(email)
        await self.timeline.email_deleted(user.organization_id, user.id, email_id, email.subject)

    async def list_emails(
        self,
        user: User,
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
        scoped_owner = self._scoped_owner_id(user)
        effective_owner = owner_id or scoped_owner
        return await self.email_repo.list(
            user.organization_id,
            owner_id=effective_owner,
            status=status,
            priority=priority,
            direction=direction,
            search=search,
            from_date=from_date,
            to_date=to_date,
            page=page,
            page_size=page_size,
            sort_order=sort_order,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # UNIFIED list (all types merged)
    # ─────────────────────────────────────────────────────────────────────────

    async def list_unified(
        self,
        user: User,
        *,
        view: Optional[str] = None,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        owner_id: Optional[UUID] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        quick_tab: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        sort_order: str = "desc",
    ) -> Tuple[List[UnifiedActivityItem], int]:
        """
        Returns a merged, paginated list across tasks / calls / meetings /
        emails / notes depending on `view`.  Filtering is done in SQL per
        table; results are merged in Python and re-paginated.
        """
        scoped_owner = self._scoped_owner_id(user)
        effective_owner = owner_id or scoped_owner

        items: List[UnifiedActivityItem] = []

        if view in (None, "timeline", "task"):
            task_rows, _ = await self.task_repo.list(
                user.organization_id,
                owner_id=effective_owner,
                status=status,
                priority=priority,
                search=search,
                from_date=from_date,
                to_date=to_date,
                quick_tab=quick_tab,
                page=1,
                page_size=10000,
                sort_order=sort_order,
            )
            for r in task_rows:
                items.append(self._task_to_unified(r))

        if view in (None, "timeline", "call"):
            call_rows, _ = await self.call_repo.list(
                user.organization_id,
                owner_id=effective_owner,
                status=status,
                priority=priority,
                search=search,
                from_date=from_date,
                to_date=to_date,
                quick_tab=quick_tab,
                page=1,
                page_size=10000,
                sort_order=sort_order,
            )
            for r in call_rows:
                items.append(self._call_to_unified(r))

        if view in (None, "timeline", "note"):
            note_rows, _ = await self.note_repo.list(
                user.organization_id,
                owner_id=effective_owner,
                search=search,
                page=1,
                page_size=10000,
                sort_order=sort_order,
            )
            for r in note_rows:
                items.append(self._note_to_unified(r))

        if view in (None, "timeline", "meeting"):
            meet_owner = effective_owner if not self._has_elevated_access(user) else None
            # translate quick_tab to date range for meetings
            meet_start = from_date
            meet_end = to_date
            now = datetime.now(timezone.utc)
            if quick_tab == "today":
                meet_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                meet_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif quick_tab == "upcoming":
                meet_start = now
            # "overdue" for meetings = missed meetings in the past
            elif quick_tab == "overdue":
                meet_end = now
                # filter to missed/cancelled status for meetings
            meet_rows, _ = await self.meeting_repo.list(
                user.organization_id,
                owner_id=meet_owner,
                status=status,
                start=meet_start,
                end=meet_end,
                page=1,
                page_size=10000,
            )
            for r in meet_rows:
                if search and search.lower() not in (r.get("title") or "").lower():
                    continue
                if priority and r.get("priority", "").lower() != priority.lower():
                    continue
                items.append(self._meeting_to_unified(r))

        if view in (None, "timeline", "email"):
            from app.utils.enums import SortOrder as _SO
            _so = _SO.ASC if sort_order == "asc" else _SO.DESC
            email_rows, _ = await self.email_repo.list_by_organization(
                organization_id=user.organization_id,
                search=search,
                direction=None,
                thread_id=None,
                external_entity_type=None,
                external_entity_id=None,
                page=1,
                page_size=10000,
                sort_order=_so,
                from_date=from_date,
                to_date=to_date,
            )
            for r in email_rows:
                items.append(self._email_to_unified(r))

        # sort merged list — safe sort key handles None due_dates and tz-naive/aware mix
        def _sort_key(x: UnifiedActivityItem) -> datetime:
            dt = x.due_date or x.created_at
            # normalise to UTC-aware so comparisons never raise TypeError
            if dt is None:
                return datetime.min.replace(tzinfo=timezone.utc)
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt

        reverse = sort_order == "desc"
        items.sort(key=_sort_key, reverse=reverse)

        total = len(items)
        start = (page - 1) * page_size
        return items[start: start + page_size], total

    # ─────────────────────────────────────────────────────────────────────────
    # Normalizers to UnifiedActivityItem
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _task_to_unified(r: dict) -> UnifiedActivityItem:
        return UnifiedActivityItem(
            id=r["id"],
            activity_type="task",
            subject=r["subject"],
            status=r["status"],
            priority=r["priority"],
            due_date=r.get("due_date"),
            owner_id=r.get("owner_id"),
            owner_name=r.get("owner_name"),
            related_entity_type=r.get("related_entity_type"),
            related_record_id=r.get("related_lead_id") or r.get("related_contact_id")
                              or r.get("related_company_id") or r.get("related_deal_id"),
            related_record_name=r.get("related_record_name"),
            organization_id=r["organization_id"],
            created_by=r.get("created_by"),
            created_at=r["created_at"],
            updated_at=r["updated_at"],
            details={
                "description": r.get("description"),
                "reminder_minutes": r.get("reminder_minutes"),
                "completed_at": r.get("completed_at").isoformat() if r.get("completed_at") else None,
            },
        )

    @staticmethod
    def _call_to_unified(r: dict) -> UnifiedActivityItem:
        return UnifiedActivityItem(
            id=r["id"],
            activity_type="call",
            subject=r["subject"],
            status=r["status"],
            priority=r["priority"],
            due_date=r.get("called_at"),
            owner_id=r.get("owner_id"),
            owner_name=r.get("owner_name"),
            related_entity_type=r.get("related_entity_type"),
            related_record_id=r.get("related_lead_id") or r.get("related_contact_id")
                              or r.get("related_company_id") or r.get("related_deal_id"),
            related_record_name=r.get("related_record_name"),
            organization_id=r["organization_id"],
            created_by=r.get("created_by"),
            created_at=r["created_at"],
            updated_at=r["updated_at"],
            details={
                "contact_name": r.get("contact_name"),
                "phone_number": r.get("phone_number"),
                "call_type": r.get("call_type"),
                "duration_minutes": r.get("duration_minutes"),
                "outcome": r.get("outcome"),
                "notes": r.get("notes"),
            },
        )

    @staticmethod
    def _note_to_unified(r: dict) -> UnifiedActivityItem:
        return UnifiedActivityItem(
            id=r["id"],
            activity_type="note",
            subject=r["title"],
            status="completed",
            priority="medium",
            due_date=None,
            owner_id=r.get("owner_id"),
            owner_name=r.get("owner_name"),
            related_entity_type=r.get("related_entity_type"),
            related_record_id=r.get("related_lead_id") or r.get("related_contact_id")
                              or r.get("related_company_id") or r.get("related_deal_id"),
            related_record_name=r.get("related_record_name"),
            organization_id=r["organization_id"],
            created_by=r.get("created_by"),
            created_at=r["created_at"],
            updated_at=r["updated_at"],
            details={"body": r.get("body")},
        )

    @staticmethod
    def _meeting_to_unified(r: dict) -> UnifiedActivityItem:
        return UnifiedActivityItem(
            id=r["id"],
            activity_type="meeting",
            subject=r["title"],
            status=r["status"],
            priority="medium",
            due_date=r.get("start_datetime"),
            owner_id=r.get("owner_id"),
            owner_name=r.get("owner_name"),
            related_entity_type="lead" if r.get("related_lead_id") else
                                "contact" if r.get("related_contact_id") else
                                "company" if r.get("related_company_id") else
                                "deal" if r.get("related_deal_id") else None,
            related_record_id=r.get("related_lead_id") or r.get("related_contact_id")
                              or r.get("related_company_id") or r.get("related_deal_id"),
            related_record_name=r.get("lead_name") or r.get("contact_name")
                                or r.get("company_name") or r.get("deal_name"),
            organization_id=r["organization_id"],
            created_by=r.get("created_by"),
            created_at=r["created_at"],
            updated_at=r["updated_at"],
            details={
                "description": r.get("description"),
                "end_datetime": r.get("end_datetime").isoformat() if r.get("end_datetime") else None,
                "location": r.get("location"),
                "meeting_link": r.get("meeting_link"),
            },
        )

    @staticmethod
    def _email_to_unified(email) -> UnifiedActivityItem:
        # email can be a model instance or dict
        if hasattr(email, "__table__"):
            r = {col.name: getattr(email, col.name) for col in email.__table__.columns}
        else:
            r = email
        return UnifiedActivityItem(
            id=r["id"],
            activity_type="email",
            subject=r.get("subject", "(no subject)"),
            status="completed",
            priority="medium",
            due_date=r.get("sent_at"),
            owner_id=None,
            owner_name=None,
            related_entity_type=r.get("external_entity_type"),
            related_record_id=r.get("external_entity_id"),
            related_record_name=None,
            organization_id=r["organization_id"],
            created_by=None,
            created_at=r["created_at"],
            updated_at=r["updated_at"],
            details={
                "direction": r.get("direction"),
                "sender": r.get("sender"),
                "receiver": r.get("receiver"),
                "body_preview": r.get("body_preview"),
                "thread_id": r.get("thread_id"),
                "is_read": r.get("is_read"),
            },
        )

    # ─────────────────────────────────────────────────────────────────────────
    # BULK OPERATIONS
    # ─────────────────────────────────────────────────────────────────────────

    async def bulk_delete(self, user: User, payload: BulkDeleteRequest) -> BulkOperationResponse:
        org = user.organization_id
        affected = 0
        affected += await self.task_repo.bulk_soft_delete(payload.ids, org)
        affected += await self.call_repo.bulk_soft_delete(payload.ids, org)
        affected += await self.note_repo.bulk_soft_delete(payload.ids, org)
        return BulkOperationResponse(affected=affected, message=f"{affected} activities deleted.")

    async def bulk_update(self, user: User, payload: BulkUpdateRequest) -> BulkOperationResponse:
        org = user.organization_id
        affected = 0
        if payload.status:
            affected += await self.task_repo.bulk_update_status(payload.ids, org, payload.status)
            affected += await self.call_repo.bulk_update_status(payload.ids, org, payload.status)
        if payload.owner_id:
            affected += await self.task_repo.bulk_update_owner(payload.ids, org, payload.owner_id)
            affected += await self.call_repo.bulk_update_owner(payload.ids, org, payload.owner_id)
        if payload.archive:
            affected += await self.task_repo.bulk_soft_delete(payload.ids, org)
            affected += await self.call_repo.bulk_soft_delete(payload.ids, org)
            affected += await self.note_repo.bulk_soft_delete(payload.ids, org)
        return BulkOperationResponse(affected=affected, message=f"{affected} activities updated.")

    # ─────────────────────────────────────────────────────────────────────────
    # EXPORT
    # ─────────────────────────────────────────────────────────────────────────

    async def export_csv(
        self,
        user: User,
        *,
        view: Optional[str] = None,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        owner_id: Optional[UUID] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        quick_tab: Optional[str] = None,
    ) -> bytes:
        items, _ = await self.list_unified(
            user,
            view=view,
            search=search,
            status=status,
            priority=priority,
            owner_id=owner_id,
            from_date=from_date,
            to_date=to_date,
            quick_tab=quick_tab,
            page=1,
            page_size=10000,
        )
        output = io.StringIO()
        # UTF-8 BOM so Excel opens it correctly
        output.write("\ufeff")
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)
        writer.writerow([
            "ID", "Type", "Subject", "Status", "Priority",
            "Due Date", "Owner", "Related Entity Type", "Related Record",
            "Created At", "Updated At",
        ])
        for item in items:
            writer.writerow([
                str(item.id),
                item.activity_type,
                item.subject,
                item.status,
                item.priority,
                item.due_date.isoformat() if item.due_date else "",
                item.owner_name or "",
                item.related_entity_type or "",
                item.related_record_name or "",
                item.created_at.isoformat(),
                item.updated_at.isoformat(),
            ])
        return output.getvalue().encode("utf-8")

    # ─────────────────────────────────────────────────────────────────────────
    # OWNERS list for filter dropdown
    # ─────────────────────────────────────────────────────────────────────────

    async def list_owners(self, user: User) -> List[OwnerItem]:
        from sqlalchemy import select as sa_select
        from app.models.user import User as UserModel
        stmt = (
            sa_select(UserModel.id, UserModel.full_name, UserModel.email, UserModel.avatar_url)
            .where(
                UserModel.organization_id == user.organization_id,
                UserModel.is_active.is_(True),
                UserModel.is_deleted.is_(False),
            )
            .order_by(UserModel.full_name)
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        return [
            OwnerItem(id=r[0], full_name=r[1], email=r[2], avatar_url=r[3])
            for r in rows
        ]
