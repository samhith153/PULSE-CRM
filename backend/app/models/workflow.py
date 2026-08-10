"""AI-driven workflow task persistence model."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, TenantMixin


class WorkflowTask(Base, TenantMixin):
    __tablename__ = "workflow_tasks"

    lead_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Existing database column name.
    source_recommendation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_recommendations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # AI-generated action.
    action_type: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Why AI recommended this action.
    reasoning: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # AI priority.
    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="medium",
    )

    # CRM buying/pipeline stage at the time this task was created.
    current_stage: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    # Workflow state.
    #
    # pending
    # in_progress
    # completed
    # expired
    # superseded
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        index=True,
    )

    # Number of times the lead has stalled.
    stall_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    # Existing DB requires this column.
    due_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    # When the action was completed.
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Tenant foreign key.
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )