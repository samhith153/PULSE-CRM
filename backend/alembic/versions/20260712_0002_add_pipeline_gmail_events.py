"""add pipeline, gmail, and event tables

Revision ID: 20260712_0002
Revises: 20260711_0001
Create Date: 2026-07-12 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260712_0002"
down_revision = "20260711_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("deals", sa.Column("close_reason", sa.Text(), nullable=True))
    op.add_column("deals", sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("deals", sa.Column("pipeline_stage_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_table(
        "pipeline_stages",
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("color", sa.String(length=20), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("probability", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("organization_id", "slug", name="uq_pipeline_stage_slug_per_org"),
    )
    op.create_index(op.f("ix_pipeline_stages_id"), "pipeline_stages", ["id"], unique=False)
    op.create_index(op.f("ix_pipeline_stages_is_active"), "pipeline_stages", ["is_active"], unique=False)
    op.create_index(op.f("ix_pipeline_stages_organization_id"), "pipeline_stages", ["organization_id"], unique=False)
    op.create_index(op.f("ix_pipeline_stages_slug"), "pipeline_stages", ["slug"], unique=False)


    op.create_foreign_key("fk_deals_pipeline_stage_id", "deals", "pipeline_stages", ["pipeline_stage_id"], ["id"], ondelete="SET NULL")
    op.create_index(op.f("ix_deals_pipeline_stage_id"), "deals", ["pipeline_stage_id"], unique=False)


    op.create_table(
        "gmail_connections",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email_address", sa.String(length=255), nullable=False),
        sa.Column("access_token_encrypted", sa.Text(), nullable=False),
        sa.Column("refresh_token_encrypted", sa.Text(), nullable=True),
        sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sync_cursor", sa.String(length=255), nullable=True),
        sa.Column("sync_status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("scopes_json", sa.JSON(), nullable=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("organization_id", "user_id", name="uq_gmail_connection_org_user"),
    )
    op.create_index(op.f("ix_gmail_connections_email_address"), "gmail_connections", ["email_address"], unique=False)
    op.create_index(op.f("ix_gmail_connections_id"), "gmail_connections", ["id"], unique=False)
    op.create_index(op.f("ix_gmail_connections_organization_id"), "gmail_connections", ["organization_id"], unique=False)
    op.create_index(op.f("ix_gmail_connections_user_id"), "gmail_connections", ["user_id"], unique=False)

    op.create_table(
        "emails",
        sa.Column("gmail_message_id", sa.String(length=255), nullable=False),
        sa.Column("thread_id", sa.String(length=255), nullable=True),
        sa.Column("direction", sa.String(length=20), nullable=False),
        sa.Column("sender", sa.String(length=255), nullable=False),
        sa.Column("receiver", sa.String(length=255), nullable=True),
        sa.Column("subject", sa.String(length=500), nullable=False),
        sa.Column("body_preview", sa.Text(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attachment_metadata", sa.JSON(), nullable=True),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("gmail_connection_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("external_entity_type", sa.String(length=50), nullable=True),
        sa.Column("external_entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.ForeignKeyConstraint(["gmail_connection_id"], ["gmail_connections.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("organization_id", "gmail_message_id", name="uq_email_message_per_org"),
    )
    op.create_index(op.f("ix_emails_gmail_message_id"), "emails", ["gmail_message_id"], unique=False)
    op.create_index(op.f("ix_emails_id"), "emails", ["id"], unique=False)
    op.create_index(op.f("ix_emails_organization_id"), "emails", ["organization_id"], unique=False)
    op.create_index(op.f("ix_emails_sent_at"), "emails", ["sent_at"], unique=False)

    op.create_table(
        "domain_events",
        sa.Column("aggregate_type", sa.String(length=50), nullable=False),
        sa.Column("aggregate_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("topic", sa.String(length=100), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("source", sa.String(length=100), nullable=True),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="pending"),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index(op.f("ix_domain_events_aggregate_id"), "domain_events", ["aggregate_id"], unique=False)
    op.create_index(op.f("ix_domain_events_aggregate_type"), "domain_events", ["aggregate_type"], unique=False)
    op.create_index(op.f("ix_domain_events_created_at"), "domain_events", ["created_at"], unique=False)
    op.create_index(op.f("ix_domain_events_event_type"), "domain_events", ["event_type"], unique=False)
    op.create_index(op.f("ix_domain_events_id"), "domain_events", ["id"], unique=False)
    op.create_index(op.f("ix_domain_events_organization_id"), "domain_events", ["organization_id"], unique=False)
    op.create_index(op.f("ix_domain_events_topic"), "domain_events", ["topic"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_domain_events_topic"), table_name="domain_events")
    op.drop_index(op.f("ix_domain_events_organization_id"), table_name="domain_events")
    op.drop_index(op.f("ix_domain_events_id"), table_name="domain_events")
    op.drop_index(op.f("ix_domain_events_event_type"), table_name="domain_events")
    op.drop_index(op.f("ix_domain_events_created_at"), table_name="domain_events")
    op.drop_index(op.f("ix_domain_events_aggregate_type"), table_name="domain_events")
    op.drop_index(op.f("ix_domain_events_aggregate_id"), table_name="domain_events")
    op.drop_table("domain_events")

    op.drop_index(op.f("ix_emails_sent_at"), table_name="emails")
    op.drop_index(op.f("ix_emails_organization_id"), table_name="emails")
    op.drop_index(op.f("ix_emails_id"), table_name="emails")
    op.drop_index(op.f("ix_emails_gmail_message_id"), table_name="emails")
    op.drop_table("emails")

    op.drop_index(op.f("ix_gmail_connections_user_id"), table_name="gmail_connections")
    op.drop_index(op.f("ix_gmail_connections_organization_id"), table_name="gmail_connections")
    op.drop_index(op.f("ix_gmail_connections_id"), table_name="gmail_connections")
    op.drop_index(op.f("ix_gmail_connections_email_address"), table_name="gmail_connections")
    op.drop_table("gmail_connections")

    op.drop_index(op.f("ix_pipeline_stages_slug"), table_name="pipeline_stages")
    op.drop_index(op.f("ix_pipeline_stages_organization_id"), table_name="pipeline_stages")
    op.drop_index(op.f("ix_pipeline_stages_is_active"), table_name="pipeline_stages")
    op.drop_index(op.f("ix_pipeline_stages_id"), table_name="pipeline_stages")
    op.drop_table("pipeline_stages")

    op.drop_index(op.f("ix_deals_pipeline_stage_id"), table_name="deals")
    op.drop_constraint("fk_deals_pipeline_stage_id", "deals", type_="foreignkey")
    op.drop_column("deals", "pipeline_stage_id")
    op.drop_column("deals", "closed_at")
    op.drop_column("deals", "close_reason")

