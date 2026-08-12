from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import asc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.ai import AIRecommendation
from app.models.pipeline import PipelineStage
from app.models.workflow import WorkflowTask
from app.repositories.ai_repository import AIRecommendationRepository
from app.repositories.workflow_repository import WorkflowTaskRepository

logger = get_logger(__name__)


class WorkflowService:
    """Build and execute a personalized, AI-driven workflow for a lead."""

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
        self.recommendation_repo = AIRecommendationRepository(db)

    # ------------------------------------------------------------------
    # RECOMMENDATION
    # ------------------------------------------------------------------

    async def get_latest_recommendation(
        self,
        *,
        organization_id: UUID,
        lead_id: UUID,
    ) -> AIRecommendation | None:
        recommendations = await self.recommendation_repo.latest_for_entity(
            organization_id,
            entity_type="lead",
            entity_id=lead_id,
        )

        return recommendations[0] if recommendations else None

    # ------------------------------------------------------------------
    # SYNC RECOMMENDATION -> ACTIVE WORKFLOW TASK
    # ------------------------------------------------------------------

    async def sync_from_recommendation(
        self,
        *,
        recommendation: AIRecommendation,
        lead_id: UUID,
        organization_id: UUID,
        created_by: Optional[UUID] = None,
    ) -> WorkflowTask | None:
        """Create/replace the single actionable task from the newest AI decision."""

        metadata = recommendation.metadata_json or {}

        if bool(metadata.get("is_terminal", False)):
            current = await self.workflow_repo.get_active_for_lead(
                organization_id=organization_id,
                lead_id=lead_id,
            )

            if current:
                await self.workflow_repo.supersede(current)

            return None

        action = (recommendation.recommendation or "").strip()

        if not action:
            return None

        current = await self.workflow_repo.get_active_for_lead(
            organization_id=organization_id,
            lead_id=lead_id,
        )

        if current and self._same_action(current.action_type, action):
            return current

        if current:
            await self.workflow_repo.supersede(current)

        latest = await self.workflow_repo.get_latest_for_lead(
            organization_id=organization_id,
            lead_id=lead_id,
        )

        if (
            latest
            and latest.status == "completed"
            and self._same_action(latest.action_type, action)
        ):
            if latest.completed_at and recommendation.generated_at <= latest.completed_at:
                return None

        step_order = await self._next_step_order(
            organization_id,
            lead_id,
        )

        current_stage = (
            str(
                metadata.get("current_stage")
                or metadata.get("stage")
                or metadata.get("pipeline_stage")
                or ""
            )
            or None
        )

        return await self.workflow_repo.create_task(
            lead_id=lead_id,
            organization_id=organization_id,
            created_by=created_by,
            source_recommendation_id=recommendation.id,
            action_type=action,
            reasoning=recommendation.reasoning,
            priority=recommendation.priority,
            current_stage=current_stage,
            due_at=self._calculate_due_at(recommendation.priority),
            step_order=step_order,
        )

    # ------------------------------------------------------------------
    # AUTO-INITIALIZE ON LEAD CREATION
    # ------------------------------------------------------------------

    async def initialize_workflow_for_new_lead(
        self,
        *,
        organization_id: UUID,
        lead_id: UUID,
        created_by: Optional[UUID] = None,
    ) -> WorkflowTask | None:
        """
        Call this the moment a lead is created (or as soon as the first
        AI recommendation for it lands, whichever your recommendation
        pipeline supports). It seeds the first WorkflowTask from
        whatever recommendation already exists, so build_workflow_plan
        has a real personalized action to show instead of falling back
        to the bare pipeline-stage skeleton.

        Idempotent: a no-op if the lead already has an active task, so
        it's safe to call again from a retry or a webhook that fires
        twice.
        """

        existing = await self.workflow_repo.get_active_for_lead(
            organization_id=organization_id,
            lead_id=lead_id,
        )

        if existing:
            return existing

        recommendation = await self.get_latest_recommendation(
            organization_id=organization_id,
            lead_id=lead_id,
        )

        if not recommendation:
            # Nothing to seed yet. Whatever generates the lead's first
            # AI recommendation should call sync_from_recommendation()
            # directly as soon as it's produced - that's the other
            # half of this fix, see the note below.
            return None

        return await self.sync_from_recommendation(
            recommendation=recommendation,
            lead_id=lead_id,
            organization_id=organization_id,
            created_by=created_by,
        )

    # ------------------------------------------------------------------
    # RECOVERY WORKFLOW (STALLED TASKS)
    # ------------------------------------------------------------------

    async def process_stalled_tasks(
        self,
        *,
        organization_id: UUID,
        now: Optional[datetime] = None,
    ) -> list[WorkflowTask]:
        """
        Intended to run on a schedule (e.g. every 15 min per org, or
        triggered by whatever job runner already exists). Finds every
        active task whose due_at has passed, expires it, bumps
        stall_count, and immediately tries to replace it with a fresh
        AI-recommended action so the lead's workflow keeps moving
        instead of silently going dark.

        A task created this way carries stall_count > 0, which is what
        LeadWorkflowResponse.is_recovery already keys off of - so the
        "Recovery Workflow" card flips from NOT TRIGGERED automatically
        once this runs, no frontend changes needed.
        """

        expired = await self.workflow_repo.get_expired_tasks(
            organization_id=organization_id,
            now=now,
        )

        recovered: list[WorkflowTask] = []

        for task in expired:
            new_stall_count = task.stall_count + 1

            await self.workflow_repo.expire(task)

            recommendation = await self.get_latest_recommendation(
                organization_id=organization_id,
                lead_id=task.lead_id,
            )

            if not recommendation:
                continue

            metadata = recommendation.metadata_json or {}

            if bool(metadata.get("is_terminal", False)):
                continue

            action = (recommendation.recommendation or "").strip()

            if not action:
                continue

            if self._same_action(action, task.action_type):
                # The AI has not produced a new decision yet.
                # Do not create the exact same task again.
                continue

            # Don't recreate the exact same stalled action - that would
            # just stall again. Ask for a fresh recommendation cycle if
            # your AI pipeline supports re-scoring on stall; otherwise
            # this at least surfaces the recovery framing to the rep.
            recovery_task = await self.workflow_repo.create_task(
                lead_id=task.lead_id,
                organization_id=organization_id,
                created_by=None,
                source_recommendation_id=recommendation.id,
                action_type=action,
                reasoning=recommendation.reasoning
                or f"Recovery action after {task.action_type!r} missed its due date.",
                priority=recommendation.priority,
                current_stage=task.current_stage,
                due_at=self._calculate_due_at(recommendation.priority),
                step_order=task.step_order + 1,
                stall_count=new_stall_count,
            )

            recovered.append(recovery_task)

        return recovered

    # ------------------------------------------------------------------
    # WORKFLOW PLAN
    # ------------------------------------------------------------------

    async def build_workflow_plan(
        
        self,
        *,
        organization_id: UUID,
        lead_id: UUID,
    ) -> list[dict[str, Any]]:
        """
        Build the visual workflow for one lead.

        Important:
        - AI actions remain completely dynamic.
        - Pipeline stages are visual milestones only.
        - Previous stages are shown as completed.
        - Current AI recommendation is shown at the current position.
        - Future pipeline stages are shown until Won.
        - Future AI actions are NOT invented.
        - When the current task is completed and AI creates a new
        recommendation, that new action automatically appears in
        this same workflow.
        """

        history = await self.workflow_repo.list_for_lead(
            organization_id=organization_id,
            lead_id=lead_id,
            limit=100,
        )

        recommendation = await self.get_latest_recommendation(
            organization_id=organization_id,
            lead_id=lead_id,
        )

        current_task = await self.workflow_repo.get_active_for_lead(
            organization_id=organization_id,
            lead_id=lead_id,
        )

        # --------------------------------------------------------------
        # PIPELINE
        # --------------------------------------------------------------

        pipeline_stages = await self._get_pipeline_stages(
            organization_id=organization_id,
        )

        # --------------------------------------------------------------
        # CURRENT STAGE
        # --------------------------------------------------------------

        current_stage = self._resolve_current_stage(
            current_task=current_task,
            recommendation=recommendation,
        )

        current_index = self._find_stage_index(
            pipeline_stages,
            current_stage,
        )

        # --------------------------------------------------------------
        # COMPLETED AI TASKS
        # --------------------------------------------------------------

        completed_tasks = [
            task
            for task in history
            if task.status == "completed"
        ]

        completed_tasks.sort(
            key=lambda task: (
                task.step_order or 0,
                task.created_at,
            )
        )

        # Remove duplicate completed actions.
        seen_actions: set[str] = set()

        unique_completed_tasks: list[WorkflowTask] = []

        for task in completed_tasks:
            action = str(
                task.action_type or ""
            ).strip()

            key = self._action_key(action)

            if not key:
                continue

            if key in seen_actions:
                continue

            seen_actions.add(key)
            unique_completed_tasks.append(task)

        completed_tasks = unique_completed_tasks

        # --------------------------------------------------------------
        # BUILD WORKFLOW
        # --------------------------------------------------------------

        plan: list[dict[str, Any]] = []

        step_order = 1

        # --------------------------------------------------------------
        # 1. PREVIOUS PIPELINE STAGES
        # --------------------------------------------------------------

        if pipeline_stages:
            previous_stages = (
                pipeline_stages[:current_index]
                if current_index >= 0
                else []
            )

            for stage in previous_stages:
                stage_name = str(
                    stage.get("name") or ""
                ).strip()

                if not stage_name:
                    continue

                plan.append(
                    {
                        "action_type": stage_name,
                        "current_stage": stage_name,
                        "reasoning": None,
                        "priority": None,
                        "score": None,
                        "status": "completed",
                        "step_order": step_order,
                        "task_id": None,
                        "kind": "stage",
                    }
                )

                step_order += 1

        # --------------------------------------------------------------
        # 2. CURRENT STAGE
        # --------------------------------------------------------------

        if current_stage:
            plan.append(
                {
                    "action_type": current_stage,
                    "current_stage": current_stage,
                    "reasoning": None,
                    "priority": None,
                    "score": None,
                    "status": (
                        "completed"
                        if current_task is None
                        else "current"
                    ),
                    "step_order": step_order,
                    "task_id": None,
                    "kind": "stage",
                }
            )

            step_order += 1

        # --------------------------------------------------------------
        # 3. COMPLETED AI ACTIONS
        #
        # Put the completed AI actions into the workflow.
        # Their current_stage tells us where they happened.
        # --------------------------------------------------------------

        for task in completed_tasks:

            action = str(
                task.action_type or ""
            ).strip()

            if not action:
                continue

            # Do not add an action that is already represented
            # as the current active task.
            if (
                current_task
                and self._same_action(
                    action,
                    current_task.action_type,
                )
            ):
                continue

            plan.append(
                {
                    "action_type": action,
                    "current_stage": task.current_stage,
                    "reasoning": task.reasoning,
                    "priority": task.priority,
                    "score": None,
                    "status": "completed",
                    "step_order": step_order,
                    "task_id": str(task.id),
                    "kind": "action",
                }
            )

            step_order += 1

        # --------------------------------------------------------------
        # 4. CURRENT AI RECOMMENDATION
        # --------------------------------------------------------------

        if current_task:

            plan.append(
                {
                    "action_type": current_task.action_type,
                    "current_stage": current_task.current_stage
                    or current_stage,
                    "reasoning": current_task.reasoning,
                    "priority": current_task.priority,
                    "score": (
                        self._recommendation_score(
                            recommendation
                        )
                        if recommendation
                        else None
                    ),
                    "status": "current",
                    "step_order": step_order,
                    "task_id": str(current_task.id),
                    "kind": "action",
                }
            )

            step_order += 1

        # --------------------------------------------------------------
        # 5. FUTURE PIPELINE STAGES
        #
        # Show the remaining CRM path until Won.
        # These are ONLY visual milestones.
        # They do NOT create workflow tasks.
        # --------------------------------------------------------------

        if pipeline_stages:

            future_stages = (
                pipeline_stages[current_index + 1:]
                if current_index >= 0
                else pipeline_stages
            )

            used_future_stages: set[str] = set()

            for stage in future_stages:

                stage_name = str(
                    stage.get("name") or ""
                ).strip()

                if not stage_name:
                    continue

                normalized = self._normalize_stage(
                    stage_name
                )

                if normalized in used_future_stages:
                    continue

                # Stop after Won.
                if normalized == "won":

                    plan.append(
                        {
                            "action_type": stage_name,
                            "current_stage": stage_name,
                            "reasoning": None,
                            "priority": None,
                            "score": None,
                            "status": "planned",
                            "step_order": step_order,
                            "task_id": None,
                            "kind": "stage",
                        }
                    )

                    step_order += 1
                    break

                # Never show Lost as part of the successful
                # personalized workflow path.
                if normalized == "lost":
                    continue

                used_future_stages.add(normalized)

                plan.append(
                    {
                        "action_type": stage_name,
                        "current_stage": stage_name,
                        "reasoning": None,
                        "priority": None,
                        "score": None,
                        "status": "planned",
                        "step_order": step_order,
                        "task_id": None,
                        "kind": "stage",
                    }
                )

                step_order += 1

        # --------------------------------------------------------------
        # 6. FINAL CLEANUP
        # --------------------------------------------------------------

        return self._finalize_plan(plan)
    

    # ------------------------------------------------------------------
    # COMPLETE TASK
    # ------------------------------------------------------------------

    async def complete_task(
        self,
        *,
        organization_id: UUID,
        task_id: UUID,
    ) -> WorkflowTask:

        task = await self.workflow_repo.get_by_id_for_org(
            task_id=task_id,
            organization_id=organization_id,
        )

        if not task:
            raise ValueError("Workflow task not found")

        if task.status == "completed":
            return task

        if task.status in {"superseded", "expired"}:
            raise ValueError(
                f"Cannot complete a {task.status} workflow task"
            )

        completed = await self.workflow_repo.complete(task)

        # Do NOT create the next task from old planned candidates.
        #
        # The next task must come from the newest AI recommendation for this lead.
        # The recommendation pipeline should create/store the new recommendation
        # after the task completion.
        await self.db.flush()
        await self.db.refresh(completed)

        return completed

    # ------------------------------------------------------------------
    # CURRENT TASK
    # ------------------------------------------------------------------

    async def get_current_task(
        self,
        *,
        organization_id: UUID,
        lead_id: UUID,
    ) -> WorkflowTask | None:

        return await self.workflow_repo.get_active_for_lead(
            organization_id=organization_id,
            lead_id=lead_id,
        )

    # ------------------------------------------------------------------
    # HISTORY
    # ------------------------------------------------------------------

    async def get_history(
        self,
        *,
        organization_id: UUID,
        lead_id: UUID,
        limit: int = 100,
    ) -> list[WorkflowTask]:

        return await self.workflow_repo.list_for_lead(
            organization_id=organization_id,
            lead_id=lead_id,
            limit=limit,
        )

    # ------------------------------------------------------------------
    # ACTIVATE NEXT ACTION
    # ------------------------------------------------------------------

    async def _activate_next_planned_action(
        self,
        *,
        organization_id: UUID,
        lead_id: UUID,
        completed_task: WorkflowTask,
    ) -> WorkflowTask | None:

        if await self.workflow_repo.get_active_for_lead(
            organization_id=organization_id,
            lead_id=lead_id,
        ):
            return None

        plan = await self.build_workflow_plan(
            organization_id=organization_id,
            lead_id=lead_id,
        )

        next_step = next(
            (
                step
                for step in plan
                if step["status"] == "current"
            ),
            None,
        )

        if not next_step:
            return None

        # A pipeline-stage marker is not an executable task.
        if next_step.get("kind") == "stage":
            return None

        action = str(
            next_step["action_type"]
        ).strip()

        if self._same_action(
            action,
            completed_task.action_type,
        ):
            return None

        recommendation = await self.get_latest_recommendation(
            organization_id=organization_id,
            lead_id=lead_id,
        )

        metadata = (
            recommendation.metadata_json
            if recommendation
            else {}
        )

        return await self.workflow_repo.create_task(
            lead_id=lead_id,
            organization_id=organization_id,
            created_by=None,
            source_recommendation_id=(
                recommendation.id
                if recommendation
                else None
            ),
            action_type=action,
            reasoning=(
                next_step.get("reasoning")
                or (
                    recommendation.reasoning
                    if recommendation
                    else None
                )
            ),
            priority=(
                next_step.get("priority")
                or (
                    recommendation.priority
                    if recommendation
                    else "medium"
                )
            ),
            current_stage=(
                str(
                    next_step.get("current_stage")
                    or metadata.get("current_stage")
                    or metadata.get("stage")
                    or ""
                )
                or completed_task.current_stage
            ),
            due_at=self._calculate_due_at(
                next_step.get("priority")
                or (
                    recommendation.priority
                    if recommendation
                    else "medium"
                )
            ),
            step_order=completed_task.step_order + 1,
        )

    # ------------------------------------------------------------------
    # PIPELINE STAGES
    # ------------------------------------------------------------------

    async def _get_pipeline_stages(
        self,
        *,
        organization_id: UUID,
    ) -> list[dict[str, Any]]:

        result = await self.db.execute(
            select(PipelineStage)
            .where(
                PipelineStage.organization_id
                == organization_id
            )
            .order_by(
                asc(PipelineStage.sort_order),
                asc(PipelineStage.created_at),
            )
        )

        stages = list(result.scalars().all())

        return [
            {
                "id": str(stage.id),
                "name": stage.name,
                "slug": stage.slug,
                "sort_order": stage.sort_order,
                "probability": stage.probability,
            }
            for stage in stages
        ]

    @staticmethod
    def _resolve_current_stage(
        *,
        current_task: WorkflowTask | None,
        recommendation: AIRecommendation | None,
    ) -> str | None:

        if current_task and current_task.current_stage:
            return current_task.current_stage

        if recommendation:
            metadata = (
                recommendation.metadata_json
                or {}
            )

            value = (
                metadata.get("current_stage")
                or metadata.get("stage")
                or metadata.get("pipeline_stage")
            )

            if value:
                return str(value)

        return None

    @staticmethod
    def _find_stage_index(
        stages: list[dict[str, Any]],
        current_stage: str | None,
    ) -> int:

        if not stages:
            return -1

        if not current_stage:
            return 0

        target = WorkflowService._normalize_stage(
            current_stage
        )

        for index, stage in enumerate(stages):
            if (
                WorkflowService._normalize_stage(
                    stage["name"]
                )
                == target
            ):
                return index

            if (
                WorkflowService._normalize_stage(
                    stage["slug"]
                )
                == target
            ):
                return index

        return 0

    @staticmethod
    def _future_pipeline_stages(
        *,
        pipeline_stages: list[dict[str, Any]],
        current_index: int,
    ) -> list[dict[str, Any]]:

        if not pipeline_stages:
            return []

        start = (
            current_index + 1
            if current_index >= 0
            else 0
        )

        return pipeline_stages[start:]

    @staticmethod
    def _find_won_stage(
        stages: list[dict[str, Any]],
    ) -> dict[str, Any] | None:

        for stage in reversed(stages):
            slug = str(
                stage.get("slug") or ""
            ).lower()

            name = str(
                stage.get("name") or ""
            ).lower()

            if (
                slug in {
                    "won",
                    "closed_won",
                    "closed-won",
                }
                or "closed won" in name
                or name == "won"
            ):
                return stage

        return None

    # ------------------------------------------------------------------
    # CANDIDATES
    # ------------------------------------------------------------------

    @staticmethod
    def _candidate_list(
        recommendation: AIRecommendation | None,
    ) -> list[dict[str, Any]]:

        if not recommendation:
            return []

        metadata = (
            recommendation.metadata_json
            or {}
        )

        raw = (
            metadata.get("all_candidates")
            or metadata.get("all_recommendations")
            or metadata.get("recommendations")
            or []
        )

        return [
            item
            for item in raw
            if isinstance(item, dict)
        ]

    @staticmethod
    def _find_candidate_for_stage(
        *,
        candidates: list[dict[str, Any]],
        stage_name: str,
    ) -> dict[str, Any] | None:

        target = WorkflowService._normalize_stage(
            stage_name
        )

        for candidate in candidates:
            candidate_stage = (
                candidate.get("current_stage")
                or candidate.get("stage")
                or candidate.get("pipeline_stage")
                or candidate.get("next_stage")
            )

            if not candidate_stage:
                continue

            if (
                WorkflowService._normalize_stage(
                    str(candidate_stage)
                )
                == target
            ):
                return candidate

        return None

    @staticmethod
    def _candidate_action(
        candidate: dict[str, Any] | None,
    ) -> str:

        if not candidate:
            return ""

        return str(
            candidate.get("action")
            or candidate.get("name")
            or candidate.get("label")
            or candidate.get("title")
            or candidate.get("recommendation")
            or ""
        ).strip()

    @staticmethod
    def _candidate_reason(
        candidate: dict[str, Any] | None,
        recommendation: AIRecommendation | None,
    ) -> str | None:

        if candidate:
            value = (
                candidate.get("reasoning")
                or candidate.get("reason")
                or candidate.get("why")
            )

            if value:
                return str(value)

        return (
            recommendation.reasoning
            if recommendation
            else None
        )

    @staticmethod
    def _candidate_priority(
        candidate: dict[str, Any] | None,
        recommendation: AIRecommendation | None,
    ) -> str:

        if candidate:
            value = str(
                candidate.get("priority")
                or candidate.get("urgency")
                or ""
            ).lower()

            if value in {
                "critical",
                "high",
                "medium",
                "low",
            }:
                return value

        return (
            recommendation.priority
            if recommendation
            else "medium"
        )

    @staticmethod
    def _candidate_score(
        candidate: dict[str, Any] | None,
    ) -> float | None:

        if not candidate:
            return None

        value = (
            candidate.get("score")
            if candidate.get("score") is not None
            else candidate.get("weight")
        )

        if value is None:
            value = candidate.get("rank")

        if value is None:
            return None

        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _recommendation_score(
        recommendation: AIRecommendation,
    ) -> float | None:

        value = (
            recommendation.metadata_json
            or {}
        ).get("score")

        try:
            return (
                float(value)
                if value is not None
                else None
            )
        except (TypeError, ValueError):
            return None

    # ------------------------------------------------------------------
    # PLAN FINALIZATION
    # ------------------------------------------------------------------

    @staticmethod
    def _finalize_plan(
        plan: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:

        # Remove duplicate actions while preserving the first occurrence.
        seen_actions: set[str] = set()
        cleaned: list[dict[str, Any]] = []

        for item in sorted(
            plan,
            key=lambda value: (
                value.get("step_order", 999999)
            ),
        ):
            action = str(
                item.get("action_type") or ""
            ).strip()

            # Pipeline-stage markers can repeat only if they are genuinely
            # different stages.
            if item.get("kind") == "action":
                key = WorkflowService._action_key(
                    action
                )

                if key and key in seen_actions:
                    continue

                if key:
                    seen_actions.add(key)

            cleaned.append(item)

        # Exactly one executable item can be current.
        current_found = False

        for item in cleaned:
            if item.get("status") == "completed":
                continue

            if (
                item.get("kind") == "stage"
            ):
                item["status"] = "planned"
                continue

            if not current_found:
                item["status"] = "current"
                current_found = True
            else:
                item["status"] = "planned"

        return cleaned

    # ------------------------------------------------------------------
    # HELPERS
    # ------------------------------------------------------------------

    async def _next_step_order(
        self,
        organization_id: UUID,
        lead_id: UUID,
    ) -> int:

        history = await self.workflow_repo.list_for_lead(
            organization_id=organization_id,
            lead_id=lead_id,
            limit=100,
        )

        return (
            max(
                (
                    task.step_order
                    for task in history
                ),
                default=0,
            )
            + 1
        )

    @staticmethod
    def _same_action(
        left: str | None,
        right: str | None,
    ) -> bool:

        return (
            WorkflowService._action_key(left)
            == WorkflowService._action_key(right)
        )

    @staticmethod
    def _action_key(
        value: str | None,
    ) -> str:

        return " ".join(
            (value or "").lower().split()
        )

    @staticmethod
    def _normalize_stage(
        value: str | None,
    ) -> str:

        normalized = " ".join(
            (value or "").lower().replace("_", " ").replace("-", " ").split()
        )

        aliases = {
            "new lead": "new",
            "new": "new",
            "contacted": "contacted",
            "qualified": "qualified",
            "proposal sent": "proposal",
            "proposal": "proposal",
            "negotiation": "negotiation",
            "closed won": "won",
            "won": "won",
            "closed lost": "lost",
            "lost": "lost",
        }

        return aliases.get(
            normalized,
            normalized,
        )

    def _calculate_due_at(
        self,
        priority: str | None,
    ) -> datetime:

        hours = self.PRIORITY_DUE_HOURS.get(
            (priority or "medium").lower(),
            self.DEFAULT_DUE_HOURS,
        )

        return (
            datetime.now(timezone.utc)
            + timedelta(hours=hours)
        )