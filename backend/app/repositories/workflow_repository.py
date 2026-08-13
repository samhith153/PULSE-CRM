"""Repository for AI-driven workflow tasks."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import asc, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workflow import WorkflowTask
from app.repositories.base import BaseRepository


class WorkflowTaskRepository(BaseRepository[WorkflowTask]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(WorkflowTask, db)

    async def get_active_for_lead(self, organization_id: UUID, lead_id: UUID) -> Optional[WorkflowTask]:
        result = await self.db.execute(
            select(WorkflowTask)
            .where(
                WorkflowTask.organization_id == organization_id,
                WorkflowTask.lead_id == lead_id,
                WorkflowTask.is_active.is_(True),
                WorkflowTask.status.in_(["pending", "in_progress"]),
            )
            .order_by(asc(WorkflowTask.step_order), asc(WorkflowTask.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_id_for_organization(self, organization_id: UUID, task_id: UUID) -> Optional[WorkflowTask]:
        result = await self.db.execute(
            select(WorkflowTask)
            .where(
                WorkflowTask.id == task_id,
                WorkflowTask.organization_id == organization_id,
            )
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_id_for_org(self, *, task_id: UUID, organization_id: UUID) -> WorkflowTask | None:
        return await self.get_by_id_for_organization(organization_id=organization_id, task_id=task_id)

    async def list_for_lead(self, organization_id: UUID, lead_id: UUID, limit: int = 100) -> list[WorkflowTask]:
        result = await self.db.execute(
            select(WorkflowTask)
            .where(
                WorkflowTask.organization_id == organization_id,
                WorkflowTask.lead_id == lead_id,
            )
            .order_by(asc(WorkflowTask.step_order), asc(WorkflowTask.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create_task(
        self,
        *,
        lead_id: UUID,
        organization_id: UUID,
        created_by: Optional[UUID],
        source_recommendation_id: Optional[UUID],
        action_type: str,
        reasoning: Optional[str],
        priority: str,
        current_stage: Optional[str],
        due_at: datetime,
        step_order: int = 1,
        stall_count: int = 0,
    ) -> WorkflowTask:
        now = datetime.now(timezone.utc)
        task = WorkflowTask(
            lead_id=lead_id,
            organization_id=organization_id,
            created_by=created_by,
            source_recommendation_id=source_recommendation_id,
            action_type=action_type,
            reasoning=reasoning,
            priority=priority,
            current_stage=current_stage,
            status="pending",
            stall_count=stall_count,
            step_order=step_order,
            due_at=due_at,
            created_at=now,
            updated_at=now,
        )
        self.db.add(task)
        await self.db.flush()
        await self.db.refresh(task)
        return task

    async def supersede(self, task: WorkflowTask) -> WorkflowTask:
        task.status = "superseded"
        task.is_active = False
        task.updated_at = datetime.now(timezone.utc)
        self.db.add(task)
        await self.db.flush()
        return task

    async def mark_in_progress(self, task: WorkflowTask) -> WorkflowTask:
        task.status = "in_progress"
        task.updated_at = datetime.now(timezone.utc)
        self.db.add(task)
        await self.db.flush()
        return task

    async def complete(self, task: WorkflowTask) -> WorkflowTask:
        now = datetime.now(timezone.utc)
        task.status = "completed"
        task.completed_at = now
        task.updated_at = now
        task.is_active = False
        self.db.add(task)
        await self.db.flush()
        return task

    async def expire(self, task: WorkflowTask) -> WorkflowTask:
        task.status = "expired"
        task.is_active = False
        task.updated_at = datetime.now(timezone.utc)
        self.db.add(task)
        await self.db.flush()
        return task

    async def get_expired_tasks(self, organization_id: UUID, now: Optional[datetime] = None, limit: int = 100) -> list[WorkflowTask]:
        check_time = now or datetime.now(timezone.utc)
        result = await self.db.execute(
            select(WorkflowTask)
            .where(
                WorkflowTask.organization_id == organization_id,
                WorkflowTask.is_active.is_(True),
                WorkflowTask.status.in_(["pending", "in_progress"]),
                WorkflowTask.due_at <= check_time,
            )
            .order_by(asc(WorkflowTask.due_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_latest_for_lead(self, *, organization_id: UUID, lead_id: UUID) -> WorkflowTask | None:
        result = await self.db.execute(
            select(WorkflowTask)
            .where(
                WorkflowTask.organization_id == organization_id,
                WorkflowTask.lead_id == lead_id,
            )
            .order_by(desc(WorkflowTask.step_order), desc(WorkflowTask.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()
