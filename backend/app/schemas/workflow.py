"""Schemas for AI-driven lead workflows."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class WorkflowTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    lead_id: UUID
    source_recommendation_id: UUID | None = None
    action_type: str
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
    history: list[WorkflowTaskResponse]