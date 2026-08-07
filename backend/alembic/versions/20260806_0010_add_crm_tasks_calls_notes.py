"""add crm_tasks, crm_calls, crm_notes tables

Revision ID: 20260806_0010
Revises: f4b8c2d9e6a1
Create Date: 2026-08-06
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260806_0010"
down_revision = "f4b8c2d9e6a1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── crm_tasks ─────────────────────────────────────────────────────────────
    op.create_table(
        "crm_tasks",
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("priority", sa.String(20), nullable=False, server_default="medium"),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reminder_minutes", sa.Integer(), nullable=True, server_default="15"),
        sa.Column("related_entity_type", sa.String(50), nullable=True),
        sa.Column("related_lead_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_contact_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_company_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_deal_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
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
    op.create_index("ix_crm_tasks_id", "crm_tasks", ["id"])
    op.create_index("ix_crm_tasks_subject", "crm_tasks", ["subject"])
    op.create_index("ix_crm_tasks_status", "crm_tasks", ["status"])
    op.create_index("ix_crm_tasks_priority", "crm_tasks", ["priority"])
    op.create_index("ix_crm_tasks_due_date", "crm_tasks", ["due_date"])
    op.create_index("ix_crm_tasks_owner_id", "crm_tasks", ["owner_id"])
    op.create_index("ix_crm_tasks_organization_id", "crm_tasks", ["organization_id"])
    op.create_index("ix_crm_tasks_related_entity_type", "crm_tasks", ["related_entity_type"])
    op.create_index("ix_crm_tasks_related_lead_id", "crm_tasks", ["related_lead_id"])
    op.create_index("ix_crm_tasks_is_active", "crm_tasks", ["is_active"])
    op.create_index("ix_crm_tasks_org_owner_due", "crm_tasks", ["organization_id", "owner_id", "due_date"])

    # ── crm_calls ─────────────────────────────────────────────────────────────
    op.create_table(
        "crm_calls",
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("contact_name", sa.String(255), nullable=True),
        sa.Column("phone_number", sa.String(50), nullable=True),
        sa.Column("call_type", sa.String(20), nullable=False, server_default="outbound"),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("outcome", sa.String(100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="completed"),
        sa.Column("priority", sa.String(20), nullable=False, server_default="medium"),
        sa.Column("called_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("related_entity_type", sa.String(50), nullable=True),
        sa.Column("related_lead_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_contact_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_company_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_deal_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
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
    op.create_index("ix_crm_calls_id", "crm_calls", ["id"])
    op.create_index("ix_crm_calls_subject", "crm_calls", ["subject"])
    op.create_index("ix_crm_calls_status", "crm_calls", ["status"])
    op.create_index("ix_crm_calls_priority", "crm_calls", ["priority"])
    op.create_index("ix_crm_calls_call_type", "crm_calls", ["call_type"])
    op.create_index("ix_crm_calls_outcome", "crm_calls", ["outcome"])
    op.create_index("ix_crm_calls_called_at", "crm_calls", ["called_at"])
    op.create_index("ix_crm_calls_owner_id", "crm_calls", ["owner_id"])
    op.create_index("ix_crm_calls_organization_id", "crm_calls", ["organization_id"])
    op.create_index("ix_crm_calls_related_entity_type", "crm_calls", ["related_entity_type"])
    op.create_index("ix_crm_calls_related_lead_id", "crm_calls", ["related_lead_id"])
    op.create_index("ix_crm_calls_is_active", "crm_calls", ["is_active"])

    # ── crm_notes ─────────────────────────────────────────────────────────────
    op.create_table(
        "crm_notes",
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("related_entity_type", sa.String(50), nullable=True),
        sa.Column("related_lead_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_contact_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_company_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_deal_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
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
    op.create_index("ix_crm_notes_id", "crm_notes", ["id"])
    op.create_index("ix_crm_notes_title", "crm_notes", ["title"])
    op.create_index("ix_crm_notes_owner_id", "crm_notes", ["owner_id"])
    op.create_index("ix_crm_notes_organization_id", "crm_notes", ["organization_id"])
    op.create_index("ix_crm_notes_related_entity_type", "crm_notes", ["related_entity_type"])
    op.create_index("ix_crm_notes_related_lead_id", "crm_notes", ["related_lead_id"])
    op.create_index("ix_crm_notes_is_active", "crm_notes", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_crm_notes_is_active", table_name="crm_notes")
    op.drop_index("ix_crm_notes_related_lead_id", table_name="crm_notes")
    op.drop_index("ix_crm_notes_related_entity_type", table_name="crm_notes")
    op.drop_index("ix_crm_notes_organization_id", table_name="crm_notes")
    op.drop_index("ix_crm_notes_owner_id", table_name="crm_notes")
    op.drop_index("ix_crm_notes_title", table_name="crm_notes")
    op.drop_index("ix_crm_notes_id", table_name="crm_notes")
    op.drop_table("crm_notes")

    op.drop_index("ix_crm_calls_is_active", table_name="crm_calls")
    op.drop_index("ix_crm_calls_related_lead_id", table_name="crm_calls")
    op.drop_index("ix_crm_calls_related_entity_type", table_name="crm_calls")
    op.drop_index("ix_crm_calls_organization_id", table_name="crm_calls")
    op.drop_index("ix_crm_calls_owner_id", table_name="crm_calls")
    op.drop_index("ix_crm_calls_called_at", table_name="crm_calls")
    op.drop_index("ix_crm_calls_outcome", table_name="crm_calls")
    op.drop_index("ix_crm_calls_call_type", table_name="crm_calls")
    op.drop_index("ix_crm_calls_priority", table_name="crm_calls")
    op.drop_index("ix_crm_calls_status", table_name="crm_calls")
    op.drop_index("ix_crm_calls_subject", table_name="crm_calls")
    op.drop_index("ix_crm_calls_id", table_name="crm_calls")
    op.drop_table("crm_calls")

    op.drop_index("ix_crm_tasks_org_owner_due", table_name="crm_tasks")
    op.drop_index("ix_crm_tasks_is_active", table_name="crm_tasks")
    op.drop_index("ix_crm_tasks_related_lead_id", table_name="crm_tasks")
    op.drop_index("ix_crm_tasks_related_entity_type", table_name="crm_tasks")
    op.drop_index("ix_crm_tasks_organization_id", table_name="crm_tasks")
    op.drop_index("ix_crm_tasks_owner_id", table_name="crm_tasks")
    op.drop_index("ix_crm_tasks_due_date", table_name="crm_tasks")
    op.drop_index("ix_crm_tasks_priority", table_name="crm_tasks")
    op.drop_index("ix_crm_tasks_status", table_name="crm_tasks")
    op.drop_index("ix_crm_tasks_subject", table_name="crm_tasks")
    op.drop_index("ix_crm_tasks_id", table_name="crm_tasks")
    op.drop_table("crm_tasks")
