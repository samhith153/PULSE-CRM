from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class WorkflowPlannedStep(BaseModel):
    action_type: str
    current_stage: str | None = None
    score: float | None = None
    reasoning: list[str] = Field(default_factory=list)
    priority: str | None = None
    # NEW: tells the client whether this node is a CRM pipeline stage
    # marker or an AI-recommended action. Without this the frontend has
    # to infer it by comparing action_type == current_stage, which is
    # fragile and silently misclassifies stage nodes as actions.
    kind: Literal["stage", "action"] = "action"


class WorkflowTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    lead_id: UUID
    source_recommendation_id: UUID | None = None
    action_type: str
    step_order: int
    reasoning: str | None = None
    priority: str
    current_stage: str | None = None
    status: str
    stall_count: int
    due_at: datetime
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class LeadWorkflowResponse(BaseModel):
    current_task: WorkflowTaskResponse | None = None
    history: list[WorkflowTaskResponse] = Field(default_factory=list)
    planned_steps: list[WorkflowPlannedStep] = Field(default_factory=list)
    total_steps: int = 0
    completed_steps: int = 0
    progress_percent: int = 0
    is_recovery: bool = False