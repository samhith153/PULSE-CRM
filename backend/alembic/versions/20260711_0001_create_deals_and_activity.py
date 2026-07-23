"""create deals and activity timeline tables

Revision ID: 20260711_0001
Revises: 20260710_0000
Create Date: 2026-07-11 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260711_0001"
down_revision = "20260710_0000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "deals",
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="open"),
        sa.Column("amount", sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="USD"),
        sa.Column("expected_close_date", sa.Date(), nullable=True),
        sa.Column("probability", sa.Integer(), nullable=False, server_default="50"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("contact_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["contact_id"], ["contacts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("lead_id", name="uq_deal_lead_id"),
    )
    op.create_index(op.f("ix_deals_amount"), "deals", ["amount"], unique=False)
    op.create_index(op.f("ix_deals_company_id"), "deals", ["company_id"], unique=False)
    op.create_index(op.f("ix_deals_contact_id"), "deals", ["contact_id"], unique=False)
    op.create_index(op.f("ix_deals_created_at"), "deals", ["created_at"], unique=False)
    op.create_index(op.f("ix_deals_expected_close_date"), "deals", ["expected_close_date"], unique=False)
    op.create_index(op.f("ix_deals_id"), "deals", ["id"], unique=False)
    op.create_index(op.f("ix_deals_lead_id"), "deals", ["lead_id"], unique=False)
    op.create_index(op.f("ix_deals_name"), "deals", ["name"], unique=False)
    op.create_index(op.f("ix_deals_organization_id"), "deals", ["organization_id"], unique=False)
    op.create_index(op.f("ix_deals_owner_id"), "deals", ["owner_id"], unique=False)
    op.create_index(op.f("ix_deals_probability"), "deals", ["probability"], unique=False)
    op.create_index(op.f("ix_deals_status"), "deals", ["status"], unique=False)
    op.create_index(op.f("ix_deals_updated_at"), "deals", ["updated_at"], unique=False)

    op.create_table(
        "activity_timeline_events",
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_activity_timeline_events_action"), "activity_timeline_events", ["action"], unique=False)
    op.create_index(op.f("ix_activity_timeline_events_created_at"), "activity_timeline_events", ["created_at"], unique=False)
    op.create_index(op.f("ix_activity_timeline_events_entity_id"), "activity_timeline_events", ["entity_id"], unique=False)
    op.create_index(op.f("ix_activity_timeline_events_entity_type"), "activity_timeline_events", ["entity_type"], unique=False)
    op.create_index(op.f("ix_activity_timeline_events_id"), "activity_timeline_events", ["id"], unique=False)
    op.create_index(op.f("ix_activity_timeline_events_organization_id"), "activity_timeline_events", ["organization_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_activity_timeline_events_organization_id"), table_name="activity_timeline_events")
    op.drop_index(op.f("ix_activity_timeline_events_id"), table_name="activity_timeline_events")
    op.drop_index(op.f("ix_activity_timeline_events_entity_type"), table_name="activity_timeline_events")
    op.drop_index(op.f("ix_activity_timeline_events_entity_id"), table_name="activity_timeline_events")
    op.drop_index(op.f("ix_activity_timeline_events_created_at"), table_name="activity_timeline_events")
    op.drop_index(op.f("ix_activity_timeline_events_action"), table_name="activity_timeline_events")
    op.drop_table("activity_timeline_events")

    op.drop_index(op.f("ix_deals_updated_at"), table_name="deals")
    op.drop_index(op.f("ix_deals_status"), table_name="deals")
    op.drop_index(op.f("ix_deals_probability"), table_name="deals")
    op.drop_index(op.f("ix_deals_owner_id"), table_name="deals")
    op.drop_index(op.f("ix_deals_organization_id"), table_name="deals")
    op.drop_index(op.f("ix_deals_name"), table_name="deals")
    op.drop_index(op.f("ix_deals_lead_id"), table_name="deals")
    op.drop_index(op.f("ix_deals_id"), table_name="deals")
    op.drop_index(op.f("ix_deals_expected_close_date"), table_name="deals")
    op.drop_index(op.f("ix_deals_created_at"), table_name="deals")
    op.drop_index(op.f("ix_deals_contact_id"), table_name="deals")
    op.drop_index(op.f("ix_deals_company_id"), table_name="deals")
    op.drop_index(op.f("ix_deals_amount"), table_name="deals")
    op.drop_table("deals")


