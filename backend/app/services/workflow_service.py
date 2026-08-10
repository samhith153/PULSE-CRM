"""
Service for converting AI recommendations into personalized workflow tasks.

The workflow is NOT a fixed CRM pipeline.

Each lead gets its own workflow based on:
- latest AI recommendation
- lead activity
- recommendation timing
- completed actions
- current CRM context
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.ai import AIRecommendation
from app.models.workflow import WorkflowTask
from app.repositories.workflow_repository import WorkflowTaskRepository

logger = get_logger(__name__)


class WorkflowService:
    """Manages personalized AI-driven workflow tasks for leads."""

    DEFAULT_DUE_HOURS = 24

    PRIORITY_DUE_HOURS = {
        "critical": 4,
        "high": 12,
        "medium": 24,
        "low": 48,
    }

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.workflow_repo = WorkflowTaskRepository(db)

    async def sync_from_recommendation(
        self,
        *,
        recommendation: AIRecommendation,
        lead_id: UUID,
        organization_id: UUID,
        created_by: Optional[UUID] = None,
    ) -> WorkflowTask | None:
        """
        Synchronize the latest AI recommendation into a workflow task.

        Important:
        - Do NOT use CRM pipeline stages as workflow steps.
        - Do NOT recreate the same completed recommendation.
        - Create a new task only when AI has produced a newer recommendation.
        """

        current_task = await self.workflow_repo.get_active_for_lead(
            organization_id=organization_id,
            lead_id=lead_id,
        )

        metadata = recommendation.metadata_json or {}

        is_terminal = bool(
            metadata.get("is_terminal", False)
        )

        # ---------------------------------------------------------
        # TERMINAL LEAD / DEAL
        # ---------------------------------------------------------

        if is_terminal:
            if current_task:
                await self.workflow_repo.supersede(current_task)

            logger.info(
                "Workflow terminated",
                extra={
                    "lead_id": str(lead_id),
                    "recommendation_id": str(recommendation.id),
                },
            )

            return None

        action = (recommendation.recommendation or "").strip()

        if not action:
            return None

        # ---------------------------------------------------------
        # EXISTING ACTIVE TASK
        # ---------------------------------------------------------

        if current_task:
            current_action = (
                current_task.action_type or ""
            ).strip().lower()

            new_action = action.lower()

            # Same active action -> keep it.
            if (
                current_task.status in {"pending", "in_progress"}
                and current_action == new_action
            ):
                return current_task

            # AI changed the action -> replace old task.
            await self.workflow_repo.supersede(current_task)

        # ---------------------------------------------------------
        # IMPORTANT:
        # Prevent recreating the SAME completed task when the
        # recommendation row has not actually been regenerated.
        #
        # AIRecommendationRepository currently updates the same
        # recommendation row, so ID alone cannot tell us whether
        # this is a new AI decision.
        # ---------------------------------------------------------

        latest_task = await self.workflow_repo.get_latest_for_lead(
            organization_id=organization_id,
            lead_id=lead_id,
        )

        if latest_task:
            latest_action = (
                latest_task.action_type or ""
            ).strip().lower()

            recommendation_generated_at = (
                recommendation.generated_at
            )

            task_completed_at = (
                latest_task.completed_at
            )

            if (
                latest_task.status == "completed"
                and latest_action == action.lower()
                and task_completed_at is not None
                and recommendation_generated_at <= task_completed_at
            ):
                logger.info(
                    "Skipping duplicate workflow task",
                    extra={
                        "lead_id": str(lead_id),
                        "action": action,
                        "task_id": str(latest_task.id),
                    },
                )

                return None

        # ---------------------------------------------------------
        # CREATE NEW PERSONALIZED TASK
        # ---------------------------------------------------------

        current_stage = (
            metadata.get("current_stage")
            or metadata.get("stage")
            or ""
        )

        due_at = self._calculate_due_at(
            priority=recommendation.priority,
        )

        task = await self.workflow_repo.create_task(
            lead_id=lead_id,
            organization_id=organization_id,
            created_by=created_by,
            source_recommendation_id=recommendation.id,
            action_type=action,
            reasoning=recommendation.reasoning,
            priority=recommendation.priority,
            current_stage=current_stage,
            due_at=due_at,
        )

        logger.info(
            "Workflow task created from AI recommendation",
            extra={
                "lead_id": str(lead_id),
                "workflow_task_id": str(task.id),
                "recommendation_id": str(recommendation.id),
                "action": action,
            },
        )

        return task

    async def complete_task(
        self,
        *,
        organization_id: UUID,
        task_id: UUID,
    ) -> WorkflowTask:
        """Mark a workflow task as completed."""

        task = await self.workflow_repo.get_by_id_for_org(
            task_id=task_id,
            organization_id=organization_id,
        )

        if not task:
            raise ValueError("Workflow task not found")

        # Idempotent.
        if task.status == "completed":
            return task

        task.status = "completed"
        task.completed_at = datetime.now(timezone.utc)

        await self.db.flush()
        await self.db.refresh(task)

        logger.info(
            "Workflow task completed",
            extra={
                "workflow_task_id": str(task.id),
                "lead_id": str(task.lead_id),
            },
        )

        return task

    async def get_current_task(
        self,
        *,
        organization_id: UUID,
        lead_id: UUID,
    ) -> WorkflowTask | None:
        """Return the active AI task for a lead."""

        return await self.workflow_repo.get_active_for_lead(
            organization_id=organization_id,
            lead_id=lead_id,
        )

    async def get_history(
        self,
        *,
        organization_id: UUID,
        lead_id: UUID,
        limit: int = 50,
    ) -> list[WorkflowTask]:
        """Return personalized workflow history."""

        return await self.workflow_repo.list_for_lead(
            organization_id=organization_id,
            lead_id=lead_id,
            limit=limit,
        )

    def _calculate_due_at(self, priority: str) -> datetime:
        """Calculate task deadline from AI priority."""

        hours = self.PRIORITY_DUE_HOURS.get(
            (priority or "medium").lower(),
            self.DEFAULT_DUE_HOURS,
        )

        return datetime.now(timezone.utc) + timedelta(hours=hours)
    