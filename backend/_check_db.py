import asyncio
import sys
sys.path.insert(0, 'D:\\programs\\Python\\Kalnet\\PULSE\\PULSE-CRM\\backend')

from app.core.config import settings
from app.core.database import async_engine, async_session_factory
from app.models.user import User
from app.models.organization import Organization
from app.models.role import Role
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.core.security import hash_password
from sqlalchemy import text

async def seed():
    # Check existing data
    async with async_session_factory() as db:
        result = await db.execute(text('SELECT COUNT(*) FROM users'))
        user_count = result.scalar()
        result = await db.execute(text('SELECT COUNT(*) FROM organizations'))
        org_count = result.scalar()
        result = await db.execute(text('SELECT name FROM roles'))
        roles = [r[0] for r in result.fetchall()]
        print(f'Users: {user_count}, Orgs: {org_count}, Roles: {roles}')

asyncio.run(seed())
