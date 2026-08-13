"""merge heads 12cc36a454c0 and c1cfc0efea07

Revision ID: e5f9c1d8a7b6
Revises: 12cc36a454c0, c1cfc0efea07
Create Date: 2026-08-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f9c1d8a7b6'
down_revision: Union[str, list[str], None] = ('12cc36a454c0', 'c1cfc0efea07')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass