"""AI-driven lead workflow routes."""

from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import StandardResponse
from app.schemas.workflow import LeadWorkflowResponse, WorkflowPlannedStep, WorkflowTaskResponse
from app.services.workflow_service import WorkflowService

router = APIRouter()


@router.get(
    "/leads/{lead_id}",
    response_model=StandardResponse[LeadWorkflowResponse],
    summary="Get AI-driven workflow for a lead",
    dependencies=[Depends(require_permission("lead:read"))],
)
async def get_lead_workflow(lead_id: UUID, current_user: CurrentUser, db: DBSession) -> dict:
    service = WorkflowService(db)

    current_task = await service.get_current_task(
        organization_id=current_user.organization_id,
        lead_id=lead_id,
    )
    history = await service.get_history(
        organization_id=current_user.organization_id,
        lead_id=lead_id,
    )
    workflow_plan = await service.build_workflow_plan(
        organization_id=current_user.organization_id,
        lead_id=lead_id,
    )

    # Send both the current step and future AI candidates. The frontend determines
    # the visual state from position; the backend remains the source of truth.
    planned_steps = [
        WorkflowPlannedStep(
            action_type=step["action_type"],
            current_stage=step.get("current_stage"),
            score=step.get("score"),
            reasoning=(
                [step["reasoning"]]
                if step.get("reasoning")
                else []
            ),
            priority=step.get("priority"),
            # NEW: propagate the stage/action distinction the service
            # already computed instead of dropping it here.
            kind=step.get("kind", "action"),
        )
        for step in workflow_plan
        if step["status"] in {"current", "planned"}
    ]

    completed_count = sum(1 for step in workflow_plan if step["status"] == "completed")
    total_steps = len(workflow_plan)
    progress_percent = round(completed_count / total_steps * 100) if total_steps else 0
    is_recovery = any(task.stall_count > 0 or task.status == "expired" for task in history)

    data = LeadWorkflowResponse(
        current_task=WorkflowTaskResponse.model_validate(current_task) if current_task else None,
        history=[WorkflowTaskResponse.model_validate(task) for task in history],
        planned_steps=planned_steps,
        total_steps=total_steps,
        completed_steps=completed_count,
        progress_percent=progress_percent,
        is_recovery=is_recovery,
    )

    return {
        "success": True,
        "message": "Personalized lead workflow retrieved.",
        "data": data,
    }


@router.post(
    "/tasks/{task_id}/complete",
    response_model=StandardResponse[WorkflowTaskResponse],
    summary="Complete an AI workflow task",
    dependencies=[Depends(require_permission("lead:write"))],
)
async def complete_workflow_task(task_id: UUID, current_user: CurrentUser, db: DBSession) -> dict:
    service = WorkflowService(db)
    task = await service.complete_task(
        organization_id=current_user.organization_id,
        task_id=task_id,
    )
    return {
        "success": True,
        "message": "Workflow task completed and next action evaluated.",
        "data": WorkflowTaskResponse.model_validate(task),
    }