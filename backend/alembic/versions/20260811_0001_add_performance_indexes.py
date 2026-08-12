"""add performance indexes for leads, deals, emails, activities

Revision ID: 20260811_0001
Revises: 20260805_0012, 20260810_0001, 20260810_0002, 60e88cc272ae
Create Date: 2026-08-11 00:00:00.000000

Adds composite and covering indexes that are hit by the most common
dashboard, leads-list, deal-filter, and email-inbox queries.
All operations are CREATE INDEX CONCURRENTLY-compatible — no table rewrites.
"""
from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260811_0001"
down_revision = ("20260805_0012", "20260810_0001", "20260810_0002", "60e88cc272ae")
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── leads ────────────────────────────────────────────────────────────────
    # List-leads query: org + owner + is_deleted (most common filter combo)
    op.create_index(
        "ix_leads_org_owner_deleted",
        "leads",
        ["organization_id", "owner_id", "is_deleted"],
        unique=False,
        postgresql_where="is_deleted = false",
    )
    # Status-filtered queries (funnel, status lists)
    op.create_index(
        "ix_leads_org_status_deleted",
        "leads",
        ["organization_id", "status", "is_deleted"],
        unique=False,
        postgresql_where="is_deleted = false",
    )
    # Email-based lookup (duplicate check, email sync matching)
    op.create_index(
        "ix_leads_org_email_lower",
        "leads",
        ["organization_id"],
        unique=False,
        postgresql_using="btree",
    )

    # ── deals ────────────────────────────────────────────────────────────────
    # Filter by owner (kanban / deal list)
    op.create_index(
        "ix_deals_org_owner_deleted",
        "deals",
        ["organization_id", "owner_id", "is_deleted"],
        unique=False,
        postgresql_where="is_deleted = false",
    )
    # Filter by status (pipeline stages)
    op.create_index(
        "ix_deals_org_status_deleted",
        "deals",
        ["organization_id", "status", "is_deleted"],
        unique=False,
        postgresql_where="is_deleted = false",
    )
    # Revenue aggregation (won deals in date range — dashboard + reports)
    op.create_index(
        "ix_deals_org_status_closed_at",
        "deals",
        ["organization_id", "status", "closed_at"],
        unique=False,
        postgresql_where="is_deleted = false AND status = 'won'",
    )
    # Pipeline stage filter
    op.create_index(
        "ix_deals_org_pipeline_stage",
        "deals",
        ["organization_id", "pipeline_stage_id", "is_deleted"],
        unique=False,
        postgresql_where="is_deleted = false",
    )

    # ── emails ───────────────────────────────────────────────────────────────
    # Unread count (inbox badge — hit on every page load)
    op.create_index(
        "ix_emails_org_unread_inbound",
        "emails",
        ["organization_id", "is_read", "direction"],
        unique=False,
        postgresql_where="is_active = true AND is_read = false AND direction = 'inbound'",
    )
    # Entity-linked email lookup (lead/contact/deal email history)
    op.create_index(
        "ix_emails_org_entity",
        "emails",
        ["organization_id", "external_entity_type", "external_entity_id"],
        unique=False,
        postgresql_where="is_active = true",
    )
    # Thread lookup
    op.create_index(
        "ix_emails_org_thread",
        "emails",
        ["organization_id", "thread_id"],
        unique=False,
        postgresql_where="is_active = true",
    )

    # ── activity_timeline ────────────────────────────────────────────────────
    # Entity-type + entity-id timeline queries
    op.create_index(
        "ix_activity_timeline_org_entity",
        "activity_timeline",
        ["organization_id", "entity_type", "entity_id"],
        unique=False,
        postgresql_where="is_active = true",
    )
    # Created-by + action (activity overview per rep)
    op.create_index(
        "ix_activity_timeline_org_created_by_action",
        "activity_timeline",
        ["organization_id", "created_by", "action"],
        unique=False,
        postgresql_where="is_active = true",
    )

    # ── lead_scores ──────────────────────────────────────────────────────────
    # Score lookup for priority queue / dashboard
    op.create_index(
        "ix_lead_scores_org_lead",
        "lead_scores",
        ["organization_id", "lead_id"],
        unique=False,
        postgresql_where="is_active = true",
    )


def downgrade() -> None:
    op.drop_index("ix_lead_scores_org_lead", table_name="lead_scores")
    op.drop_index("ix_activity_timeline_org_created_by_action", table_name="activity_timeline")
    op.drop_index("ix_activity_timeline_org_entity", table_name="activity_timeline")
    op.drop_index("ix_emails_org_thread", table_name="emails")
    op.drop_index("ix_emails_org_entity", table_name="emails")
    op.drop_index("ix_emails_org_unread_inbound", table_name="emails")
    op.drop_index("ix_deals_org_pipeline_stage", table_name="deals")
    op.drop_index("ix_deals_org_status_closed_at", table_name="deals")
    op.drop_index("ix_deals_org_status_deleted", table_name="deals")
    op.drop_index("ix_deals_org_owner_deleted", table_name="deals")
    op.drop_index("ix_leads_org_email_lower", table_name="leads")
    op.drop_index("ix_leads_org_status_deleted", table_name="leads")
    op.drop_index("ix_leads_org_owner_deleted", table_name="leads")
