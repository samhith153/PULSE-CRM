from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Index, String, JSON, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class EventOutbox(Base):
    __tablename__ = "event_outbox"

    __table_args__ = (
        Index("ix_event_outbox_organization_occurred_at", "organization_id", "occurred_at"),
        Index("ix_event_outbox_event_type_occurred_at", "event_type", "occurred_at"),
        Index("ix_event_outbox_aggregate_lookup", "aggregate_type", "aggregate_id"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True, index=True)
    actor_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    event_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    aggregate_type: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    aggregate_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    source: Mapped[str | None] = mapped_column(String(120), nullable=True)
    correlation_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=False, default=dict)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    def __repr__(self) -> str:
        return (
            "EventOutbox("
            f"id={self.id!s}, "
            f"event_type={self.event_type!r}, "
            f"aggregate_type={self.aggregate_type!r}, "
            f"aggregate_id={self.aggregate_id!r}"
            ")"
        )
