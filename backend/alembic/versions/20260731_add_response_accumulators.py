"""add response time accumulators to feature_vectors

Revision ID: 20260731_add_response_accumulators
Revises: 20260730_drop_domain_events
Create Date: 2026-07-31 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7a1c3e9f0d2'
down_revision: Union[str, None] = '20260730_drop_domain_events'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("feature_vectors", sa.Column("num_response_pairs", sa.Integer(), nullable=True))
    op.add_column("feature_vectors", sa.Column("last_processed_sent_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("feature_vectors", "last_processed_sent_at")
    op.drop_column("feature_vectors", "num_response_pairs")
