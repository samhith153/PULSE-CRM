"""
SQLAlchemy Declarative Base + Audit Mixins
─────────────────────────────────────────
AuditMixin   → id, created_at, updated_at, is_active
TenantMixin  → extends AuditMixin with organisation_id + created_by
               (declared as plain UUID columns here; each model that
               needs FK constraints re-declares them with ForeignKey.
               SQLAlchemy merges same-named columns, so FKs win.)
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """Project-wide declarative base — all models register here."""
    pass


class AuditMixin:
    """
    Standard audit columns present on every table.
    """
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        server_default=func.now(),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )


class TenantMixin(AuditMixin):
    """
    Extends AuditMixin with multi-tenancy fields.
    Models that need FK constraints on these columns simply redeclare
    them with ForeignKey(...) — SQLAlchemy merges the column definitions.
    """
    # Intentionally no ForeignKey here — concrete models add FKs themselves.
    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )
