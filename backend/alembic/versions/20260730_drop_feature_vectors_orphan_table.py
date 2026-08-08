"""drop feature_vectors orphan table (no model exists)

Revision ID: 202607300001
Revises: 202607290001
Create Date: 2026-07-30 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "202607300001"
down_revision: Union[str, None] = "202607290001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("ix_feature_vectors_organization_id", table_name="feature_vectors")
    op.drop_index("ix_feature_vectors_lead_id", table_name="feature_vectors")
    op.drop_constraint("uq_feature_vectors_lead_id", "feature_vectors", type_="unique")
    op.drop_table("feature_vectors")


def downgrade() -> None:
    op.create_table(
        "feature_vectors",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("lead_id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("average_response_time", sa.Float(), nullable=True),
        sa.Column("response_time_score", sa.Float(), nullable=True),
        sa.Column("days_since_last_outbound", sa.Integer(), nullable=True),
        sa.Column("engagement_decay_penalty", sa.Float(), nullable=True),
        sa.Column("ai_intent_category_score", sa.Float(), nullable=True),
        sa.Column("buying_stage_score", sa.Float(), nullable=True),
        sa.Column("customer_initiative_score", sa.Float(), nullable=True),
        sa.Column("engagement_trend_score", sa.Float(), nullable=True),
        sa.Column("company_size_score", sa.Float(), nullable=True),
        sa.Column("industry_complexity_score", sa.Float(), nullable=True),
        sa.Column("software_gap_score", sa.Float(), nullable=True),
        sa.Column("operational_system_score", sa.Float(), nullable=True),
        sa.Column("customization_potential_score", sa.Float(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("lead_id", name="uq_feature_vectors_lead_id"),
    )
    op.create_index("ix_feature_vectors_lead_id", "feature_vectors", ["lead_id"])
    op.create_index("ix_feature_vectors_organization_id", "feature_vectors", ["organization_id"])
