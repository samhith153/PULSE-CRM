"""merge heads

Revision ID: 770749af2fcc
Revises: 3eef3c402ed3, e5f9c1d8a7b6
Create Date: 2026-08-10 00:02:55.106924

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '770749af2fcc'
down_revision: Union[str, None] = ('3eef3c402ed3', 'e5f9c1d8a7b6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
