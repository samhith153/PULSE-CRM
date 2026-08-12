"""merge heads for crm_emails

Revision ID: 12cc36a454c0
Revises: 12e7cb6247a5, 20260806_0011, a1b2c3d4e5f6
Create Date: 2026-08-07 17:45:37.047000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '12cc36a454c0'
down_revision: Union[str, None] = ('12e7cb6247a5', '20260806_0011', 'a1b2c3d4e5f6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
