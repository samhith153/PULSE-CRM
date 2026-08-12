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

    async def get_by_email_any(self, email: str) -> Optional[User]:
        """Check for email across ALL users including soft-deleted, for uniqueness enforcement."""
        stmt = select(User).where(User.email == email.lower())
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

    async def list_managers(self, organization_id: UUID) -> List[User]:
        """List active users holding the 'manager' role (for assignment pickers)."""
        stmt = (
            self._base_query()
            .join(UserRole, UserRole.user_id == User.id)
            .join(Role, Role.id == UserRole.role_id)
            .where(
                User.organization_id == organization_id,
                Role.name == "manager",
                User.is_active.is_(True),
            )
            .order_by(User.full_name)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_team_reps(
        self,
        manager_id: UUID,
        organization_id: UUID,
    ) -> List[User]:
        """List sales reps assigned to the given manager (manager team view).

        Filters to users who still hold the sales_rep role so a rep that was
        promoted to manager/admin drops out of their previous team.
        """
        stmt = (
            self._base_query()
            .join(UserRole, UserRole.user_id == User.id)
            .join(Role, Role.id == UserRole.role_id)
            .where(
                User.organization_id == organization_id,
                User.manager_id == manager_id,
                Role.name == "sales_rep",
            )
            .order_by(User.full_name)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_deleted_by_organization(
        self,
        organization_id: UUID,
        search: Optional[str],
        page: int,
        page_size: int,
    ) -> Tuple[List[User], int]:
        """List soft-deleted users in the organization (admin archived users view)."""
        stmt = (
            select(User)
            .options(selectinload(User.user_roles).selectinload(UserRole.role))
            .where(User.organization_id == organization_id)
            .where(User.is_deleted == True)
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

    async def get_by_id_any(self, user_id: UUID) -> Optional[User]:
        """Get user by ID including soft-deleted, for restore/permanent delete operations."""
        stmt = (
            select(User)
            .options(selectinload(User.user_roles).selectinload(UserRole.role))
            .where(User.id == user_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

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
