"""
Notification Model
Persisted, per-user notifications generated from real domain events
(deal won/lost, lead assigned, lead converted, etc). Replaces the
hardcoded mock arrays that used to live in the frontend.
"""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TenantMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class Notification(Base, TenantMixin):
    __tablename__ = "notifications"

    # Recipient — who sees this notification. Distinct from created_by
    # (the AuditMixin/TenantMixin column), which records who/what triggered it.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    payload: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    is_dismissed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    dismissed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Idempotency: avoids creating a duplicate notification if the same
    # outbox event gets dispatched more than once (retry, worker restart).
    source_event_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)

    def __repr__(self) -> str:
        return f"<Notification id={self.id} user_id={self.user_id} type={self.type!r} is_read={self.is_read}>"
