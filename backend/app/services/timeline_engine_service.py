"""
Timeline Engine Service
Centralizes activity timeline writes and domain event publication.
"""
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.activity_repository import ActivityTimelineRepository
from app.services.event_service import EventService


class TimelineEngineService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.activity_repo = ActivityTimelineRepository(db)
        self.event_service = EventService(db)

    async def record(
        self,
        organization_id: UUID,
        created_by: Optional[UUID],
        entity_type: str,
        entity_id: UUID,
        action: str,
        title: str,
        description: Optional[str] = None,
        payload: Optional[dict] = None,
        topic: Optional[str] = None,
        source: Optional[str] = None,
    ) -> None:
        """Persist a timeline row and emit a domain event in the same transaction."""
        await self.activity_repo.create(
            organization_id=organization_id,
            created_by=created_by,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            title=title,
            description=description,
            payload=payload,
        )
        await self.event_service.publish(
            organization_id=organization_id,
            created_by=created_by,
            aggregate_type=entity_type,
            aggregate_id=entity_id,
            event_type=action,
            topic=topic or entity_type,
            title=title,
            description=description,
            payload=payload,
            source=source or "crm",
        )

    async def record_activity(
        self,
        organization_id: UUID,
        created_by: Optional[UUID],
        entity_type: str,
        entity_id: UUID,
        action: str,
        title: str,
        description: Optional[str] = None,
        payload: Optional[dict] = None,
        topic: Optional[str] = None,
        source: Optional[str] = None,
    ) -> None:
        """Alias for record() so services read naturally at call sites."""
        await self.record(
            organization_id=organization_id,
            created_by=created_by,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            title=title,
            description=description,
            payload=payload,
            topic=topic,
            source=source,
        )

    # ── Convenience wrappers for CRM activity types ──────────────────────────

    async def task_created(self, org_id, user_id, task_id, subject, priority, status, due_date):
        await self.record(org_id, user_id, "crm_task", task_id, "TASK_CREATED", f"Task created: {subject}",
                          payload={"subject": subject, "priority": priority, "status": status, "due_date": str(due_date) if due_date else None})

    async def task_updated(self, org_id, user_id, task_id, subject, changes):
        await self.record(org_id, user_id, "crm_task", task_id, "TASK_UPDATED", f"Task updated: {subject}", payload={"changes": list(changes.keys())})

    async def task_deleted(self, org_id, user_id, task_id, subject):
        await self.record(org_id, user_id, "crm_task", task_id, "TASK_DELETED", f"Task deleted: {subject}")

    async def call_logged(self, org_id, user_id, call_id, subject, outcome, duration, call_type):
        await self.record(org_id, user_id, "crm_call", call_id, "CALL_LOGGED", f"Call logged: {subject}",
                          payload={"outcome": outcome, "duration_minutes": duration, "call_type": call_type})

    async def call_updated(self, org_id, user_id, call_id, subject, changes):
        await self.record(org_id, user_id, "crm_call", call_id, "CALL_UPDATED", f"Call updated: {subject}", payload={"changes": list(changes.keys())})

    async def call_deleted(self, org_id, user_id, call_id, subject):
        await self.record(org_id, user_id, "crm_call", call_id, "CALL_DELETED", f"Call deleted: {subject}")

    async def note_created(self, org_id, user_id, note_id, title, body):
        await self.record(org_id, user_id, "crm_note", note_id, "NOTE_CREATED", f"Note created: {title}",
                          description=body[:200] if body else None)

    async def note_edited(self, org_id, user_id, note_id, title, changes):
        await self.record(org_id, user_id, "crm_note", note_id, "NOTE_EDITED", f"Note edited: {title}", payload={"changes": list(changes.keys())})

    async def note_deleted(self, org_id, user_id, note_id, title):
        await self.record(org_id, user_id, "crm_note", note_id, "NOTE_DELETED", f"Note deleted: {title}")

    async def email_sent(self, org_id, user_id, email_id, subject, direction, recipient):
        await self.record(org_id, user_id, "crm_email", email_id, "EMAIL_SENT", f"Email sent: {subject}",
                          payload={"direction": direction, "recipient": recipient})

    async def email_deleted(self, org_id, user_id, email_id, subject):
        await self.record(org_id, user_id, "crm_email", email_id, "EMAIL_DELETED", f"Email deleted: {subject}")
