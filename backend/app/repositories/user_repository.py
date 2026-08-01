"""
User Repository
Extends BaseRepository with user-specific queries.
"""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundException
from app.models.role import Role
from app.models.user import User, UserRole
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(User, db)

    def _base_query(self):
        """Always load roles eagerly to avoid N+1 issues."""
        return (
            select(User)
            .options(selectinload(User.user_roles).selectinload(UserRole.role))
            .where(User.is_deleted == False)
        )

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = self._base_query().where(User.email == email.lower())
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_with_roles(self, user_id: UUID) -> Optional[User]:
        stmt = self._base_query().where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_reset_token(self, token_hash: str) -> Optional[User]:
        stmt = self._base_query().where(
            User.password_reset_token == token_hash
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_organization(
        self,
        organization_id: UUID,
        search: Optional[str],
        page: int,
        page_size: int,
    ) -> Tuple[List[User], int]:
        stmt = (
            self._base_query()
            .where(User.organization_id == organization_id)
        )
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    User.full_name.ilike(term),
                    User.email.ilike(term),
                )
            )
        return await self.get_paginated(stmt, page, page_size)

    async def assign_role(
        self,
        user: User,
        role_id: UUID,
        assigned_by: UUID,
    ) -> User:
        from datetime import datetime, timezone

        stmt = select(Role.id).where(Role.id == role_id)
        result = await self.db.execute(stmt)
        if not result.scalar_one_or_none():
            raise NotFoundException("Role", str(role_id))

        # Remove existing roles
        stmt = select(UserRole).where(UserRole.user_id == user.id)
        result = await self.db.execute(stmt)
        for ur in result.scalars().all():
            await self.db.delete(ur)

        # Assign new role
        now = datetime.now(timezone.utc)
        ur = UserRole(
            user_id=user.id,
            role_id=role_id,
            assigned_by=assigned_by,
            assigned_at=now,
        )
        self.db.add(ur)

        await self.db.flush()
        await self.db.refresh(user)
        return user
