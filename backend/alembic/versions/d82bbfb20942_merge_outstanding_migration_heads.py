"""merge outstanding migration heads

Revision ID: d82bbfb20942
Revises: 20260801_0008, 20260803_0012, 20260805_0011
Create Date: 2026-08-05 12:07:39.338539

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd82bbfb20942'
down_revision: Union[str, None] = ('20260801_0008', '20260803_0012', '20260805_0011')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
