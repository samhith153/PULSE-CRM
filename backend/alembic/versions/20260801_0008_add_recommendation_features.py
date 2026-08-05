"""create recommendation feature store

Revision ID: 20260801_0008
Revises: 206727f7ae42
Create Date: 2026-08-01 10:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260801_0008"
down_revision = "206727f7ae42"
branch_labels = None
depends_on = None


meeting_attendance_status_enum = postgresql.ENUM(
    "ATTENDED",
    "NO_SHOW",
    "RESCHEDULED",
    name="meeting_attendance_status_enum",
    create_type=False,
)


def upgrade() -> None:
    meeting_attendance_status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "recommendation_features",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("current_score", sa.Float(), nullable=True),
        sa.Column("current_stage", sa.String(length=50), nullable=True),
        sa.Column("days_since_last_activity", sa.Integer(), nullable=True),
        sa.Column("reply_received_flag", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("deal_value", sa.Numeric(15, 2), nullable=True),
        sa.Column("email_open_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("email_opened_no_reply_flag", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("meeting_attendance_status", meeting_attendance_status_enum, nullable=True),
        sa.Column("rep_active_action_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("best_contact_time_slot", sa.String(length=50), nullable=True),
        sa.Column("has_upcoming_activity", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("stage_dwell_time", sa.Integer(), nullable=True),
        sa.CheckConstraint("days_since_last_activity IS NULL OR days_since_last_activity >= 0", name="ck_recommendation_features_days_since_last_activity_nonnegative"),
        sa.CheckConstraint("deal_value IS NULL OR deal_value >= 0", name="ck_recommendation_features_deal_value_nonnegative"),
        sa.CheckConstraint("email_open_count >= 0", name="ck_recommendation_features_email_open_count_nonnegative"),
        sa.CheckConstraint("rep_active_action_count >= 0", name="ck_recommendation_features_rep_active_action_count_nonnegative"),
        sa.CheckConstraint("stage_dwell_time IS NULL OR stage_dwell_time >= 0", name="ck_recommendation_features_stage_dwell_time_nonnegative"),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_recommendation_features_id"), "recommendation_features", ["id"])
    op.create_index(op.f("ix_recommendation_features_is_active"), "recommendation_features", ["is_active"])
    op.create_index(op.f("ix_recommendation_features_organization_id"), "recommendation_features", ["organization_id"])
    op.create_index(op.f("ix_recommendation_features_lead_id"), "recommendation_features", ["lead_id"])
    op.create_index(
        "ix_recommendation_features_org_lead_created_at",
        "recommendation_features",
        ["organization_id", "lead_id", "created_at"],
    )
    op.create_index(
        "ix_recommendation_features_meeting_attendance_status",
        "recommendation_features",
        ["meeting_attendance_status"],
    )


def downgrade() -> None:
    op.drop_index("ix_recommendation_features_meeting_attendance_status", table_name="recommendation_features")
    op.drop_index("ix_recommendation_features_org_lead_created_at", table_name="recommendation_features")
    op.drop_index(op.f("ix_recommendation_features_lead_id"), table_name="recommendation_features")
    op.drop_index(op.f("ix_recommendation_features_organization_id"), table_name="recommendation_features")
    op.drop_index(op.f("ix_recommendation_features_is_active"), table_name="recommendation_features")
    op.drop_index(op.f("ix_recommendation_features_id"), table_name="recommendation_features")
    op.drop_table("recommendation_features")
    meeting_attendance_status_enum.drop(op.get_bind(), checkfirst=True)
