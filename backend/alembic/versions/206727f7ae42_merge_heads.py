"""merge heads

Revision ID: 206727f7ae42
Revises: 20260723_0011, 20260724_0007
Create Date: 2026-07-25 18:04:06.984798

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '206727f7ae42'
down_revision: Union[str, None] = ('20260723_0011', '20260724_0007')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
