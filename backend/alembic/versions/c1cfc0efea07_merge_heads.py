"""merge heads

Revision ID: c1cfc0efea07
Revises: 12e7cb6247a5, 20260806_0011, a1b2c3d4e5f6
Create Date: 2026-08-08 01:29:38.046102

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1cfc0efea07'
down_revision: Union[str, None] = ('12e7cb6247a5', '20260806_0011', 'a1b2c3d4e5f6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
