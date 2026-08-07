"""Add audit columns to feature_vectors

Revision ID: 20260806_0001
Revises: ac74c9e9ffb1
Create Date: 2026-08-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '20260806_0001'
down_revision: Union[str, None] = '20260731_0012'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add email analytics audit columns
    op.add_column('feature_vectors', sa.Column('inbound_count', sa.Integer(), nullable=True))
    op.add_column('feature_vectors', sa.Column('initiated_count', sa.Integer(), nullable=True))
    op.add_column('feature_vectors', sa.Column('last_inbound_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('feature_vectors', sa.Column('days_since_last_inbound', sa.Integer(), nullable=True))
    op.add_column('feature_vectors', sa.Column('intent', sa.String(length=100), nullable=True))

    # Add assessment metadata audit columns
    op.add_column('feature_vectors', sa.Column('assessment_trigger', sa.String(length=50), nullable=True))
    op.add_column('feature_vectors', sa.Column('assessment_version', sa.String(length=50), nullable=True))
    op.add_column('feature_vectors', sa.Column('model_version', sa.String(length=100), nullable=True))
    op.add_column('feature_vectors', sa.Column('prompt_version', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('feature_vectors', 'prompt_version')
    op.drop_column('feature_vectors', 'model_version')
    op.drop_column('feature_vectors', 'assessment_version')
    op.drop_column('feature_vectors', 'assessment_trigger')
    op.drop_column('feature_vectors', 'intent')
    op.drop_column('feature_vectors', 'days_since_last_inbound')
    op.drop_column('feature_vectors', 'last_inbound_at')
    op.drop_column('feature_vectors', 'initiated_count')
    op.drop_column('feature_vectors', 'inbound_count')
