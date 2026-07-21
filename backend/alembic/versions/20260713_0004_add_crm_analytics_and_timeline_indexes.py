"""add crm analytics and timeline indexes

Revision ID: 20260713_0004
Revises: 20260713_0003
Create Date: 2026-07-13 18:00:00.000000
"""
from alembic import op


revision = "20260713_0004"
down_revision = "20260713_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_activity_timeline_events_org_entity_created_at",
        "activity_timeline_events",
        ["organization_id", "entity_type", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_activity_timeline_events_org_action_created_at",
        "activity_timeline_events",
        ["organization_id", "action", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_domain_events_org_status_created_at",
        "domain_events",
        ["organization_id", "status", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_domain_events_org_topic_status",
        "domain_events",
        ["organization_id", "topic", "status"],
        unique=False,
    )
    op.create_index(
        "ix_emails_org_thread_sent_at",
        "emails",
        ["organization_id", "thread_id", "sent_at"],
        unique=False,
    )
    op.create_index(
        "ix_emails_org_external_entity",
        "emails",
        ["organization_id", "external_entity_type", "external_entity_id"],
        unique=False,
    )
    op.create_index(
        "ix_pipeline_stages_org_probability",
        "pipeline_stages",
        ["organization_id", "probability"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_pipeline_stages_org_probability", table_name="pipeline_stages")
    op.drop_index("ix_emails_org_external_entity", table_name="emails")
    op.drop_index("ix_emails_org_thread_sent_at", table_name="emails")
    op.drop_index("ix_domain_events_org_topic_status", table_name="domain_events")
    op.drop_index("ix_domain_events_org_status_created_at", table_name="domain_events")
    op.drop_index("ix_activity_timeline_events_org_action_created_at", table_name="activity_timeline_events")
    op.drop_index("ix_activity_timeline_events_org_entity_created_at", table_name="activity_timeline_events")
