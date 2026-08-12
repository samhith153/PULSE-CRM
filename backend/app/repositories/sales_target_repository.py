"""
SalesTarget Repository
Database operations for sales targets.
"""
from datetime import date
from decimal import Decimal
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.sales_target import SalesTarget
from app.models.user import User
from app.repositories.base import BaseRepository


class SalesTargetRepository(BaseRepository[SalesTarget]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(SalesTarget, db)

    async def list_by_org(
        self,
        organization_id: UUID,
        *,
        period_type: Optional[str] = None,
        rep_id: Optional[UUID] = None,
    ) -> List[SalesTarget]:
        stmt = select(SalesTarget).where(
            SalesTarget.organization_id == organization_id,
            SalesTarget.is_active.is_(True),
        )
        if period_type:
            stmt = stmt.where(SalesTarget.period_type == period_type)
        if rep_id:
            stmt = stmt.where(SalesTarget.rep_id == rep_id)
        stmt = stmt.order_by(SalesTarget.period_start.desc(), SalesTarget.created_at.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_active_by_rep_and_period(
        self,
        organization_id: UUID,
        rep_id: UUID,
        period_type: str,
        period_start: date,
    ) -> Optional[SalesTarget]:
        stmt = select(SalesTarget).where(
            SalesTarget.organization_id == organization_id,
            SalesTarget.rep_id == rep_id,
            SalesTarget.period_type == period_type,
            SalesTarget.period_start == period_start,
            SalesTarget.is_active.is_(True),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_and_org(
        self,
        target_id: UUID,
        organization_id: UUID,
    ) -> Optional[SalesTarget]:
        stmt = select(SalesTarget).where(
            SalesTarget.id == target_id,
            SalesTarget.organization_id == organization_id,
            SalesTarget.is_active.is_(True),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_reps_in_org(
        self,
        organization_id: UUID,
        *,
        manager_id: Optional[UUID] = None,
        rep_user_id: Optional[UUID] = None,
    ) -> List[User]:
        """Return active sales reps in the organization (not managers/admins).

        Scope: all reps by default (admin), only the reps assigned to the given
        manager when ``manager_id`` is set, only one rep when ``rep_user_id`` is set.
        """
        from app.models.role import Role
        from app.models.user import UserRole

        stmt = (
            select(User)
            .join(UserRole, UserRole.user_id == User.id)
            .join(Role, Role.id == UserRole.role_id)
            .where(
                User.organization_id == organization_id,
                User.is_active.is_(True),
                User.is_deleted.is_(False),
                Role.name.in_(["sales_rep", "sales_representative"]),
            )
            .order_by(User.full_name)
        )
        if manager_id is not None:
            stmt = stmt.where(User.manager_id == manager_id)
        if rep_user_id is not None:
            stmt = stmt.where(User.id == rep_user_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_reps_with_targets(
        self,
        organization_id: UUID,
        period_type: str,
        period_start: date,
        *,
        manager_id: Optional[UUID] = None,
        rep_user_id: Optional[UUID] = None,
    ) -> List[Tuple[User, Optional[SalesTarget]]]:
        """Return all reps paired with their target for a given period (if set)."""
        reps = await self.get_reps_in_org(
            organization_id,
            manager_id=manager_id,
            rep_user_id=rep_user_id,
        )
        targets_map: dict[UUID, SalesTarget] = {}
        if reps:
            rep_ids = [r.id for r in reps]
            stmt = select(SalesTarget).where(
                SalesTarget.organization_id == organization_id,
                SalesTarget.rep_id.in_(rep_ids),
                SalesTarget.period_type == period_type,
                SalesTarget.period_start == period_start,
                SalesTarget.is_active.is_(True),
            )
            result = await self.db.execute(stmt)
            for t in result.scalars().all():
                targets_map[t.rep_id] = t

        return [(rep, targets_map.get(rep.id)) for rep in reps]
