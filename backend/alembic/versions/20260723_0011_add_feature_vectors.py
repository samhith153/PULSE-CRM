"""add feature vectors table

Revision ID: 20260723_0011
Revises: 20260723_0010
Create Date: 2026-07-25
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260723_0011"
down_revision = "20260723_0010"
branch_labels = None
depends_on = None


def _uuid_type():
    return postgresql.UUID(as_uuid=True)


def upgrade() -> None:
    op.create_table(
        "feature_vectors",
        sa.Column("id", _uuid_type(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("lead_id", _uuid_type(), nullable=False),
        sa.Column("organization_id", _uuid_type(), nullable=False),
        sa.Column("feature_version", sa.Text(), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("company_size_score", sa.Integer(), nullable=True),
        sa.Column("industry_complexity_score", sa.Integer(), nullable=True),
        sa.Column("operational_system_score", sa.Integer(), nullable=True),
        sa.Column("software_gap_score", sa.Integer(), nullable=True),
        sa.Column("customization_potential_score", sa.Integer(), nullable=True),
        sa.Column("average_response_time", sa.Numeric(), nullable=True),
        sa.Column("response_time_score", sa.Integer(), nullable=True),
        sa.Column("reply_recency_score", sa.Integer(), nullable=True),
        sa.Column("days_since_last_outbound", sa.Integer(), nullable=True),
        sa.Column("engagement_decay_penalty", sa.Integer(), nullable=True),
        sa.Column("customer_initiative_score", sa.Integer(), nullable=True),
        sa.Column("buying_stage_score", sa.Integer(), nullable=True),
        sa.Column("intent_strength_score", sa.Integer(), nullable=True),
        sa.Column("engagement_trend_score", sa.Integer(), nullable=True),
        sa.Column("ai_intent_category", sa.Text(), nullable=True),
        sa.Column("ai_intent_category_score", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"]),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "lead_id",
            "feature_version",
            "generated_at",
            name="uq_feature_vectors_lead_version_generated_at",
        ),
    )
    op.create_index("idx_feature_vectors_lead", "feature_vectors", ["lead_id"])


def downgrade() -> None:
    op.drop_index("idx_feature_vectors_lead", table_name="feature_vectors")
    op.drop_table("feature_vectors")
