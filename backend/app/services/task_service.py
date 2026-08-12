
"""Task service."""


from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, ForbiddenException, NotFoundException
from app.models.task import Task
from app.models.user import User
from app.repositories.company_repository import CompanyRepository
from app.repositories.contact_repository import ContactRepository
from app.repositories.deal_repository import DealRepository
from app.repositories.lead_repository import LeadRepository
from app.repositories.task_repository import TaskRepository
from app.repositories.user_repository import UserRepository
from app.schemas.task import TaskCreateRequest, TaskUpdateRequest
from app.services.timeline_engine_service import TimelineEngineService


class TaskService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = TaskRepository(db)
        self.timeline = TimelineEngineService(db)

    async def create(self, user: User, payload: TaskCreateRequest) -> Task:
        owner_id = payload.owner_id or user.id
        await self._validate_relations(user.organization_id, owner_id, payload)
        task = await self.repo.create(
            **payload.model_dump(exclude_none=True, exclude={"owner_id"}),
            owner_id=owner_id,
            organization_id=user.organization_id,
            created_by=user.id,
        )
        await self._record(user, task, "task_created", "Task created")
        return task

    async def list(
        self,
        user: User,
        *,
        owner_id: Optional[UUID],
        status: Optional[str],
        priority: Optional[str],
        page: int,
        page_size: int,
    ):
        scoped_owner = owner_id if self._has_elevated_access(user) else user.id
        return await self.repo.list_by_organization(
            user.organization_id,
            owner_id=scoped_owner,
            status=status,
            priority=priority,
            page=page,
            page_size=page_size,
        )

    async def get(self, user: User, task_id: UUID) -> Task:
        task = await self.repo.get_active_by_id(task_id, user.organization_id)
        if not task:
            raise NotFoundException("Task", task_id)
        self._assert_access(user, task)
        return task

    async def update(self, user: User, task_id: UUID, payload: TaskUpdateRequest) -> Task:
        task = await self.get(user, task_id)
        update_data = payload.model_dump(exclude_none=True)
        owner_id = update_data.get("owner_id") or task.owner_id
        await self._validate_relations(user.organization_id, owner_id, payload)
        if update_data.get("status") == "completed" and task.completed_at is None:
            update_data["completed_at"] = datetime.now(timezone.utc)
        if update_data.get("status") and update_data.get("status") != "completed":
            update_data["completed_at"] = None
        updated = await self.repo.update(task, **update_data)
        await self._record(user, updated, "task_updated", "Task updated")
        return updated

    async def delete(self, user: User, task_id: UUID) -> None:
        task = await self.get(user, task_id)
        await self.repo.soft_delete(task)
        await self._record(user, task, "task_deleted", "Task deleted")

    async def _validate_relations(self, organization_id: UUID, owner_id: Optional[UUID], payload) -> None:
        if owner_id:
            owner = await UserRepository(self.db).get_by_id_with_roles(owner_id)
            if not owner or owner.organization_id != organization_id:
                raise BusinessRuleException(f"Owner '{owner_id}' not found.")
        if getattr(payload, "related_lead_id", None):
            if not await LeadRepository(self.db).get_active_by_id(payload.related_lead_id, organization_id):
                raise BusinessRuleException(f"Lead '{payload.related_lead_id}' not found.")
        if getattr(payload, "related_deal_id", None):
            if not await DealRepository(self.db).get_active_by_id(payload.related_deal_id, organization_id):
                raise BusinessRuleException(f"Deal '{payload.related_deal_id}' not found.")
        if getattr(payload, "related_company_id", None):
            if not await CompanyRepository(self.db).get_active_by_id(payload.related_company_id, organization_id):
                raise BusinessRuleException(f"Company '{payload.related_company_id}' not found.")
        if getattr(payload, "related_contact_id", None):
            if not await ContactRepository(self.db).get_active_by_id(payload.related_contact_id, organization_id):
                raise BusinessRuleException(f"Contact '{payload.related_contact_id}' not found.")

    def _has_elevated_access(self, user: User) -> bool:
        roles = {ur.role.name for ur in user.user_roles if ur.role}
        return user.is_superuser or bool({"admin", "manager"}.intersection(roles))

    def _assert_access(self, user: User, task: Task) -> None:
        if self._has_elevated_access(user):
            return
        if task.owner_id != user.id and task.created_by != user.id:
            raise ForbiddenException("You do not have access to this task.")

    async def _record(self, user: User, task: Task, action: str, title: str) -> None:
        await self.timeline.record_activity(
            organization_id=user.organization_id,
            created_by=user.id,
            entity_type="task",
            entity_id=task.id,
            action=action,
            title=f"{title}: {task.title}",
            description=task.description,
            payload={"task_id": str(task.id)},
            topic="tasks",
        )
