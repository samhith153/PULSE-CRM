"""add manager_id to users for manager–sales-rep hierarchy

Revision ID: 20260812_0001
Revises: 20260811_0001
Create Date: 2026-08-12 00:00:00.000000

Adds a nullable self-referencing `manager_id` foreign key on `users` so that
an Admin can assign Sales Representatives to a Manager. Each rep points at
their manager; a manager can see and manage only the reps assigned to them.
The FK is `ON DELETE SET NULL` so deactivating/deleting a manager never
orphans rows — reps simply become unassigned.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260812_0001"
down_revision = "20260811_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("manager_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_users_manager_id",
        "users",
        "users",
        ["manager_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_users_manager_id", "users", ["manager_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_users_manager_id", table_name="users")
    op.drop_constraint("fk_users_manager_id", "users", type_="foreignkey")
    op.drop_column("users", "manager_id")
