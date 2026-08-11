"""add dashboard task fields

Revision ID: 20260805_0012
Revises: f4b8c2d9e6a1
Create Date: 2026-08-05
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260805_0012"
down_revision = "f4b8c2d9e6a1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("sales_quota", sa.Numeric(15, 2), nullable=True))
    op.add_column("deals", sa.Column("value", sa.Numeric(15, 2), nullable=True))
    op.add_column("deals", sa.Column("sentiment", sa.String(length=50), nullable=True))
    op.add_column("ai_scores", sa.Column("tier", sa.String(length=30), nullable=True))
    op.create_index("ix_ai_scores_tier", "ai_scores", ["tier"])

    op.create_table(
        "tasks",
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_lead_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_deal_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_company_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_contact_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["related_company_id"], ["companies.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["related_contact_id"], ["contacts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["related_deal_id"], ["deals.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["related_lead_id"], ["leads.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tasks_id", "tasks", ["id"])
    op.create_index("ix_tasks_is_active", "tasks", ["is_active"])
    op.create_index("ix_tasks_title", "tasks", ["title"])
    op.create_index("ix_tasks_status", "tasks", ["status"])
    op.create_index("ix_tasks_priority", "tasks", ["priority"])
    op.create_index("ix_tasks_due_date", "tasks", ["due_date"])
    op.create_index("ix_tasks_organization_id", "tasks", ["organization_id"])
    op.create_index("ix_tasks_owner_id", "tasks", ["owner_id"])
    op.create_index("ix_tasks_related_lead_id", "tasks", ["related_lead_id"])
    op.create_index("ix_tasks_related_deal_id", "tasks", ["related_deal_id"])


def downgrade() -> None:
    op.drop_index("ix_tasks_related_deal_id", table_name="tasks")
    op.drop_index("ix_tasks_related_lead_id", table_name="tasks")
    op.drop_index("ix_tasks_owner_id", table_name="tasks")
    op.drop_index("ix_tasks_organization_id", table_name="tasks")
    op.drop_index("ix_tasks_due_date", table_name="tasks")
    op.drop_index("ix_tasks_priority", table_name="tasks")
    op.drop_index("ix_tasks_status", table_name="tasks")
    op.drop_index("ix_tasks_title", table_name="tasks")
    op.drop_index("ix_tasks_is_active", table_name="tasks")
    op.drop_index("ix_tasks_id", table_name="tasks")
    op.drop_table("tasks")

    op.drop_index("ix_ai_scores_tier", table_name="ai_scores")
    op.drop_column("ai_scores", "tier")
    op.drop_column("deals", "sentiment")
    op.drop_column("deals", "value")

    op.drop_column("users", "sales_quota")

