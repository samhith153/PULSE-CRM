"""AI-driven lead workflow routes."""

from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import StandardResponse
from app.schemas.workflow import LeadWorkflowResponse, WorkflowTaskResponse
from app.services.workflow_service import WorkflowService

router = APIRouter()


@router.get(
    "/leads/{lead_id}",
    response_model=StandardResponse[LeadWorkflowResponse],
    summary="Get AI-driven workflow for a lead",
    dependencies=[Depends(require_permission("lead:read"))],
)
async def get_lead_workflow(
    lead_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """Return the current AI workflow task and its history."""

    service = WorkflowService(db)

    current_task = await service.get_current_task(
        organization_id=current_user.organization_id,
        lead_id=lead_id,
    )

    history = await service.get_history(
        organization_id=current_user.organization_id,
        lead_id=lead_id,
    )

    data = LeadWorkflowResponse(
        current_task=(
            WorkflowTaskResponse.model_validate(current_task)
            if current_task
            else None
        ),
        history=[
            WorkflowTaskResponse.model_validate(task)
            for task in history
        ],
    )

    return {
        "success": True,
        "message": "Lead workflow retrieved.",
        "data": data,
    }

@router.post(
    "/tasks/{task_id}/complete",
    response_model=StandardResponse[WorkflowTaskResponse],
    summary="Complete an AI workflow task",
    dependencies=[Depends(require_permission("lead:read"))],
)
async def complete_workflow_task(
    task_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """Mark an AI-generated workflow task as completed."""

    service = WorkflowService(db)

    task = await service.complete_task(
        organization_id=current_user.organization_id,
        task_id=task_id,
    )

    return {
        "success": True,
        "message": "Workflow task completed.",
        "data": WorkflowTaskResponse.model_validate(task),
    }