"""merge revoked_tokens and composite_indexes heads

Revision ID: 9407dc2a6b5c
Revises: 921e008a492b, 20260818_0001
Create Date: 2026-08-18 16:47:54.823840

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9407dc2a6b5c'
down_revision: Union[str, None] = ('921e008a492b', '20260818_0001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
