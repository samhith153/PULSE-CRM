"""merge remaining heads

Revision ID: 8a84c1bc2729
Revises: 12cc36a454c0, c1cfc0efea07
Create Date: 2026-08-08 20:13:37.799187

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8a84c1bc2729'
down_revision: Union[str, None] = ('12cc36a454c0', 'c1cfc0efea07')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
