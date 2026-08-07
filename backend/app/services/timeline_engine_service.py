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

    # ── TASK helpers ────────────────────────────────────────────────────────

    async def task_created(self, org: UUID, by: Optional[UUID], task_id: UUID,
                           subject: str, priority: str, status: str, due_date=None) -> None:
        await self.record(org, by, "task", task_id, "task_created",
                          f"Task created: {subject}",
                          payload={"priority": priority, "status": status,
                                   "due_date": str(due_date) if due_date else None},
                          topic="activities")

    async def task_updated(self, org: UUID, by: Optional[UUID], task_id: UUID,
                           subject: str, changes: dict) -> None:
        old_status = changes.pop("_old_status", "")
        if "status" in changes:
            new_s = changes["status"]
            await self.record(org, by, "task", task_id, "task_status_changed",
                              f"Task status changed: {old_status} → {new_s}",
                              payload={"old_status": old_status, "new_status": new_s}, topic="activities")
            if new_s == "completed":
                await self.record(org, by, "task", task_id, "task_completed",
                                  f"Task completed: {subject}", payload={"task_id": str(task_id)}, topic="activities")
            elif new_s == "in_progress":
                await self.record(org, by, "task", task_id, "task_started",
                                  f"Task started: {subject}", payload={"task_id": str(task_id)}, topic="activities")
        if "priority" in changes:
            await self.record(org, by, "task", task_id, "task_priority_changed",
                              f"Task priority changed: {subject}", payload={"priority": changes["priority"]}, topic="activities")
        if "due_date" in changes:
            await self.record(org, by, "task", task_id, "task_due_date_changed",
                              f"Task due date updated: {subject}", payload={"due_date": str(changes["due_date"])}, topic="activities")
        if "owner_id" in changes:
            await self.record(org, by, "task", task_id, "task_owner_changed",
                              f"Task owner changed: {subject}", payload={"owner_id": str(changes["owner_id"])}, topic="activities")
        remaining = {k: v for k, v in changes.items() if k not in ("status", "priority", "due_date", "owner_id")}
        if remaining:
            await self.record(org, by, "task", task_id, "task_updated",
                              f"Task updated: {subject}", payload={"changes": list(remaining.keys())}, topic="activities")

    async def task_deleted(self, org: UUID, by: Optional[UUID], task_id: UUID, subject: str) -> None:
        await self.record(org, by, "task", task_id, "task_deleted",
                          f"Task deleted: {subject}", payload={"task_id": str(task_id)}, topic="activities")

    # ── CALL helpers ─────────────────────────────────────────────────────────

    async def call_logged(self, org: UUID, by: Optional[UUID], call_id: UUID,
                          subject: str, outcome, duration, call_type: str) -> None:
        await self.record(org, by, "call", call_id, "call_logged",
                          f"Call logged: {subject}",
                          payload={"outcome": outcome, "duration_minutes": duration, "call_type": call_type},
                          topic="activities")
        if outcome == "connected":
            await self.record(org, by, "call", call_id, "call_completed",
                              f"Call completed: {subject}", payload={"duration_minutes": duration}, topic="activities")
        elif outcome in ("busy", "no_answer", "left_vm"):
            await self.record(org, by, "call", call_id, "call_missed",
                              f"Call missed: {subject}", payload={"outcome": outcome}, topic="activities")

    async def call_updated(self, org: UUID, by: Optional[UUID], call_id: UUID,
                           subject: str, changes: dict) -> None:
        if "outcome" in changes:
            await self.record(org, by, "call", call_id, "call_outcome_updated",
                              f"Call outcome updated: {subject}", payload={"outcome": changes["outcome"]}, topic="activities")
        if "duration_minutes" in changes:
            await self.record(org, by, "call", call_id, "call_duration_updated",
                              f"Call duration updated: {subject}", payload={"duration_minutes": changes["duration_minutes"]}, topic="activities")
        if "notes" in changes:
            await self.record(org, by, "call", call_id, "call_notes_added",
                              f"Call notes updated: {subject}", description=changes["notes"], topic="activities")
        remaining = {k: v for k, v in changes.items() if k not in ("outcome", "duration_minutes", "notes")}
        if remaining:
            await self.record(org, by, "call", call_id, "call_updated",
                              f"Call updated: {subject}", payload={"changes": list(remaining.keys())}, topic="activities")

    async def call_deleted(self, org: UUID, by: Optional[UUID], call_id: UUID, subject: str) -> None:
        await self.record(org, by, "call", call_id, "call_deleted",
                          f"Call deleted: {subject}", payload={"call_id": str(call_id)}, topic="activities")

    # ── MEETING helpers ───────────────────────────────────────────────────────

    async def meeting_scheduled(self, org: UUID, by: Optional[UUID], meeting_id: UUID,
                                title: str, start) -> None:
        await self.record(org, by, "meeting", meeting_id, "meeting_scheduled",
                          f"Meeting scheduled: {title}", payload={"start_datetime": str(start)}, topic="activities")

    async def meeting_updated(self, org: UUID, by: Optional[UUID], meeting_id: UUID,
                              title: str, changes: dict) -> None:
        if "start_datetime" in changes or "end_datetime" in changes:
            await self.record(org, by, "meeting", meeting_id, "meeting_rescheduled",
                              f"Meeting rescheduled: {title}",
                              payload={k: str(v) for k, v in changes.items() if k in ("start_datetime", "end_datetime")},
                              topic="activities")
        if "status" in changes:
            smap = {"completed": "meeting_completed", "cancelled": "meeting_cancelled",
                    "in_progress": "meeting_started"}
            action = smap.get(changes["status"], "meeting_updated")
            await self.record(org, by, "meeting", meeting_id, action,
                              f"Meeting {changes['status']}: {title}", payload={"status": changes["status"]}, topic="activities")
        remaining = {k: v for k, v in changes.items() if k not in ("start_datetime", "end_datetime", "status")}
        if remaining:
            await self.record(org, by, "meeting", meeting_id, "meeting_updated",
                              f"Meeting updated: {title}", payload={"changes": list(remaining.keys())}, topic="activities")

    async def meeting_deleted(self, org: UUID, by: Optional[UUID], meeting_id: UUID, title: str) -> None:
        await self.record(org, by, "meeting", meeting_id, "meeting_deleted",
                          f"Meeting deleted: {title}", payload={"meeting_id": str(meeting_id)}, topic="activities")

    # ── NOTE helpers ──────────────────────────────────────────────────────────

    async def note_created(self, org: UUID, by: Optional[UUID], note_id: UUID,
                           title: str, body=None) -> None:
        await self.record(org, by, "note", note_id, "note_created",
                          f"Note created: {title}", description=body,
                          payload={"note_id": str(note_id)}, topic="activities")

    async def note_edited(self, org: UUID, by: Optional[UUID], note_id: UUID,
                          title: str, changes: dict) -> None:
        await self.record(org, by, "note", note_id, "note_edited",
                          f"Note edited: {title}", payload={"changes": list(changes.keys())}, topic="activities")

    async def note_deleted(self, org: UUID, by: Optional[UUID], note_id: UUID, title: str) -> None:
        await self.record(org, by, "note", note_id, "note_deleted",
                          f"Note deleted: {title}", payload={"note_id": str(note_id)}, topic="activities")

    # ── COMPANY helpers ───────────────────────────────────────────────────────

    async def company_created(self, org: UUID, by: Optional[UUID], company_id: UUID,
                              name: str) -> None:
        await self.record(org, by, "company", company_id, "company_created",
                          f"Company created: {name}",
                          payload={"company_id": str(company_id), "company_name": name},
                          topic="company")

    async def company_updated(self, org: UUID, by: Optional[UUID], company_id: UUID,
                              name: str, changes: dict) -> None:
        # Emit granular events for important field changes
        if "owner_id" in changes:
            await self.record(org, by, "company", company_id, "company_owner_changed",
                              f"Owner changed for: {name}",
                              payload={"owner_id": str(changes["owner_id"])}, topic="company")
        if "industry" in changes:
            await self.record(org, by, "company", company_id, "company_industry_changed",
                              f"Industry updated: {name}",
                              payload={"industry": changes["industry"]}, topic="company")
        if "annual_revenue" in changes:
            await self.record(org, by, "company", company_id, "company_revenue_updated",
                              f"Revenue updated: {name}",
                              payload={"annual_revenue": changes["annual_revenue"]}, topic="company")
        if "employee_count" in changes:
            await self.record(org, by, "company", company_id, "company_employees_updated",
                              f"Employee count updated: {name}",
                              payload={"employee_count": changes["employee_count"]}, topic="company")
        remaining = {k: v for k, v in changes.items()
                     if k not in ("owner_id", "industry", "annual_revenue", "employee_count")}
        if remaining:
            await self.record(org, by, "company", company_id, "company_updated",
                              f"Company updated: {name}",
                              payload={"changes": list(remaining.keys())}, topic="company")

    async def company_deleted(self, org: UUID, by: Optional[UUID], company_id: UUID,
                              name: str) -> None:
        await self.record(org, by, "company", company_id, "company_deleted",
                          f"Company deleted: {name}",
                          payload={"company_id": str(company_id)}, topic="company")

    async def company_contact_linked(self, org: UUID, by: Optional[UUID], company_id: UUID,
                                     company_name: str, contact_name: str) -> None:
        await self.record(org, by, "company", company_id, "company_contact_linked",
                          f"Contact linked: {contact_name}",
                          payload={"contact_name": contact_name}, topic="company")

    async def company_contact_removed(self, org: UUID, by: Optional[UUID], company_id: UUID,
                                      company_name: str, contact_name: str) -> None:
        await self.record(org, by, "company", company_id, "company_contact_removed",
                          f"Contact removed: {contact_name}",
                          payload={"contact_name": contact_name}, topic="company")

    async def company_deal_linked(self, org: UUID, by: Optional[UUID], company_id: UUID,
                                  company_name: str, deal_name: str, amount: str = "") -> None:
        await self.record(org, by, "company", company_id, "company_deal_linked",
                          f"Deal linked: {deal_name}",
                          payload={"deal_name": deal_name, "amount": amount}, topic="company")

    async def company_deal_won(self, org: UUID, by: Optional[UUID], company_id: UUID,
                               company_name: str, deal_name: str, amount: str = "") -> None:
        await self.record(org, by, "company", company_id, "company_deal_won",
                          f"Deal won: {deal_name}",
                          payload={"deal_name": deal_name, "amount": amount}, topic="company")

    async def company_deal_lost(self, org: UUID, by: Optional[UUID], company_id: UUID,
                                company_name: str, deal_name: str) -> None:
        await self.record(org, by, "company", company_id, "company_deal_lost",
                          f"Deal lost: {deal_name}",
                          payload={"deal_name": deal_name}, topic="company")

    async def company_lead_linked(self, org: UUID, by: Optional[UUID], company_id: UUID,
                                  company_name: str, lead_title: str) -> None:
        await self.record(org, by, "company", company_id, "company_lead_linked",
                          f"Lead linked: {lead_title}",
                          payload={"lead_title": lead_title}, topic="company")
