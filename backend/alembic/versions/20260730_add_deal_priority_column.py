"""add priority column to deals table

Revision ID: 202607300002
Revises: 202607300001
Create Date: 2026-07-30 11:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "202607300002"
down_revision: Union[str, None] = "202607300001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("deals", sa.Column("priority", sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column("deals", "priority")
