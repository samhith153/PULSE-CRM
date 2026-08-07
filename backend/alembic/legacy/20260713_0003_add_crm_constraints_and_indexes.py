"""add crm constraints and composite indexes

Revision ID: 20260713_0003
Revises: 20260712_0002
Create Date: 2026-07-13 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "20260713_0003"
down_revision = "20260712_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_deals_probability_range",
        "deals",
        "probability >= 0 AND probability <= 100",
    )
    op.create_check_constraint(
        "ck_pipeline_stages_probability_range",
        "pipeline_stages",
        "probability >= 0 AND probability <= 100",
    )
    op.create_check_constraint(
        "ck_pipeline_stages_sort_order_nonnegative",
        "pipeline_stages",
        "sort_order >= 0",
    )

    op.create_index(
        "ix_deals_org_stage",
        "deals",
        ["organization_id", "pipeline_stage_id"],
        unique=False,
    )
    op.create_index(
        "ix_deals_org_status",
        "deals",
        ["organization_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_pipeline_stages_org_sort_order",
        "pipeline_stages",
        ["organization_id", "sort_order"],
        unique=False,
    )
    op.create_index(
        "ix_activity_timeline_events_org_created_at",
        "activity_timeline_events",
        ["organization_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_domain_events_org_created_at",
        "domain_events",
        ["organization_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_domain_events_org_created_at", table_name="domain_events")
    op.drop_index("ix_activity_timeline_events_org_created_at", table_name="activity_timeline_events")
    op.drop_index("ix_pipeline_stages_org_sort_order", table_name="pipeline_stages")
    op.drop_index("ix_deals_org_status", table_name="deals")
    op.drop_index("ix_deals_org_stage", table_name="deals")

    op.drop_constraint("ck_pipeline_stages_sort_order_nonnegative", "pipeline_stages", type_="check")
    op.drop_constraint("ck_pipeline_stages_probability_range", "pipeline_stages", type_="check")
    op.drop_constraint("ck_deals_probability_range", "deals", type_="check")
