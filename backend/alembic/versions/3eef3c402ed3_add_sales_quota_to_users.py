"""add_sales_quota_to_users

Revision ID: 3eef3c402ed3
Revises: 8a84c1bc2729
Create Date: 2026-08-09 22:47:38.777020

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3eef3c402ed3'
down_revision: Union[str, None] = '8a84c1bc2729'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('sales_quota', sa.Numeric(15, 2), nullable=True))

def downgrade() -> None:
    op.drop_column('users', 'sales_quota')
