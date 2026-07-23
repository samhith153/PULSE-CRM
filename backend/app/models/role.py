"""
Role & Permission Models
Supports granular RBAC.
Roles have many Permissions (M2M via RolePermission).
Users have many Roles (M2M via UserRole).
"""
import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, AuditMixin

if TYPE_CHECKING:
    from app.models.user import UserRole


class Permission(Base, AuditMixin):
    """Atomic permission unit — e.g. 'company:create'."""
    __tablename__ = "permissions"
    __table_args__ = (
        UniqueConstraint("codename", name="uq_permission_codename"),
    )

    codename: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resource: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    role_permissions: Mapped[List["RolePermission"]] = relationship(
        "RolePermission", back_populates="permission", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<Permission codename={self.codename!r}>"


class Role(Base, AuditMixin):
    """Named role — e.g. 'admin', 'manager', 'sales_rep'."""
    __tablename__ = "roles"
    __table_args__ = (
        UniqueConstraint("name", name="uq_role_name"),
    )

    name: Mapped[str] = mapped_column(String(50), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_system: Mapped[bool] = mapped_column(default=True, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    role_permissions: Mapped[List["RolePermission"]] = relationship(
        "RolePermission", back_populates="role", lazy="selectin"
    )
    user_roles: Mapped[List["UserRole"]] = relationship(
        "UserRole", back_populates="role", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<Role name={self.name!r}>"


class RolePermission(Base):
    """Association table — Role ↔ Permission."""
    __tablename__ = "role_permissions"
    __table_args__ = (
        UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    permission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("permissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    role: Mapped["Role"] = relationship("Role", back_populates="role_permissions")
    permission: Mapped["Permission"] = relationship(
        "Permission", back_populates="role_permissions"
    )
