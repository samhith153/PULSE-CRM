"""
Role & Permission Repository
"""
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role, Permission, RolePermission
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository[Role]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Role, db)

    async def get_by_name(self, name: str) -> Optional[Role]:
        stmt = (
            select(Role)
            .options(selectinload(Role.role_permissions).selectinload(RolePermission.permission))
            .where(Role.name == name)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_with_permissions(self) -> List[Role]:
        stmt = (
            select(Role)
            .options(selectinload(Role.role_permissions).selectinload(RolePermission.permission))
            .where(Role.is_active == True)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_permissions_for_role(self, role_id: UUID) -> List[str]:
        stmt = (
            select(Permission.codename)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role_id)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


class PermissionRepository(BaseRepository[Permission]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Permission, db)

    async def get_by_codename(self, codename: str) -> Optional[Permission]:
        stmt = select(Permission).where(Permission.codename == codename)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_codenames(self, codenames: List[str]) -> List[Permission]:
        stmt = select(Permission).where(Permission.codename.in_(codenames))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
