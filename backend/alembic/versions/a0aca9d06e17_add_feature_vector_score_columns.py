"""add feature vector score columns

Revision ID: a0aca9d06e17
Revises: 52423d83e647
Create Date: 2026-07-29 13:25:25.190949

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a0aca9d06e17'
down_revision: Union[str, None] = '52423d83e647'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("feature_vectors", sa.Column("average_response_time", sa.Float(), nullable=True))
    op.add_column("feature_vectors", sa.Column("response_time_score", sa.Float(), nullable=True))
    op.add_column("feature_vectors", sa.Column("days_since_last_outbound", sa.Integer(), nullable=True))
    op.add_column("feature_vectors", sa.Column("engagement_decay_penalty", sa.Float(), nullable=True))
    op.add_column("feature_vectors", sa.Column("ai_intent_category_score", sa.Float(), nullable=True))
    op.add_column("feature_vectors", sa.Column("buying_stage_score", sa.Float(), nullable=True))
    op.add_column("feature_vectors", sa.Column("customer_initiative_score", sa.Float(), nullable=True))
    op.add_column("feature_vectors", sa.Column("engagement_trend_score", sa.Float(), nullable=True))
    op.add_column("feature_vectors", sa.Column("company_size_score", sa.Float(), nullable=True))
    op.add_column("feature_vectors", sa.Column("industry_complexity_score", sa.Float(), nullable=True))
    op.add_column("feature_vectors", sa.Column("software_gap_score", sa.Float(), nullable=True))
    op.add_column("feature_vectors", sa.Column("operational_system_score", sa.Float(), nullable=True))
    op.add_column("feature_vectors", sa.Column("customization_potential_score", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("feature_vectors", "customization_potential_score")
    op.drop_column("feature_vectors", "operational_system_score")
    op.drop_column("feature_vectors", "software_gap_score")
    op.drop_column("feature_vectors", "industry_complexity_score")
    op.drop_column("feature_vectors", "company_size_score")
    op.drop_column("feature_vectors", "engagement_trend_score")
    op.drop_column("feature_vectors", "customer_initiative_score")
    op.drop_column("feature_vectors", "buying_stage_score")
    op.drop_column("feature_vectors", "ai_intent_category_score")
    op.drop_column("feature_vectors", "engagement_decay_penalty")
    op.drop_column("feature_vectors", "days_since_last_outbound")
    op.drop_column("feature_vectors", "response_time_score")
    op.drop_column("feature_vectors", "average_response_time")
