"""
Email Model
Stores synchronized Gmail messages and OAuth connection state.
"""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TenantMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class GmailConnection(Base, TenantMixin):
    __tablename__ = "gmail_connections"
    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="uq_gmail_connection_org_user"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email_address: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    access_token_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sync_cursor: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sync_status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    scopes_json: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    organization: Mapped["Organization"] = relationship("Organization", lazy="select")
    user: Mapped["User"] = relationship("User", lazy="select")


class Email(Base, TenantMixin):
    __tablename__ = "emails"
    __table_args__ = (
        UniqueConstraint("organization_id", "gmail_message_id", name="uq_email_message_per_org"),
    )

    gmail_message_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    thread_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    direction: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    sender: Mapped[str] = mapped_column(String(255), nullable=False)
    receiver: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    body_preview: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    attachment_metadata: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    raw_payload: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    gmail_connection_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gmail_connections.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    external_entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    external_entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    organization: Mapped["Organization"] = relationship("Organization", back_populates="emails", lazy="select")
    gmail_connection: Mapped[Optional["GmailConnection"]] = relationship("GmailConnection", lazy="select")
