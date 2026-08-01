"""
Audit Log Service
Business logic layer for the Activities → Audit Logs module.

RBAC rules enforced here:
  sales_rep  → own activities only  (created_by == user.id)
  manager    → own + team (all users in same org)
  admin      → entire organization
"""
from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.audit_log import (
    AuditLogEntry,
    AuditLogListResponse,
    AuditLogStatisticsResponse,
)


class AuditLogService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = AuditLogRepository(db)

    # ── RBAC scope resolver ───────────────────────────────────────────────────

    async def _resolve_scope(
        self, user: User
    ) -> tuple[UUID | None, list[UUID] | None]:
        """
        Returns (user_id_filter, team_user_ids_filter).
        Exactly one will be non-None, or both None for admin.
        """
        role_names = {ur.role.name for ur in user.user_roles if ur.role}

        if "admin" in role_names:
            # Admin sees everything
            return None, None

        if "manager" in role_names:
            # Manager sees entire org (all users in org)
            stmt = select(User.id).where(
                User.organization_id == user.organization_id,
                User.is_active.is_(True),
                User.is_deleted.is_(False),
            )
            result = await self.db.execute(stmt)
            team_ids = [row[0] for row in result.all()]
            return None, team_ids

        # Sales rep (or any other role) — own only
        return user.id, None

    # ── Audit Logs list ───────────────────────────────────────────────────────

    async def get_audit_logs(
        self,
        user: User,
        *,
        date_filter: str | None = None,
        activity_type: str | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> AuditLogListResponse:
        user_id, team_ids = await self._resolve_scope(user)

        rows, total = await self.repo.list_audit_logs(
            user.organization_id,
            user_id=user_id,
            team_user_ids=team_ids,
            date_filter=date_filter,
            activity_type=activity_type,
            search=search,
            page=page,
            page_size=page_size,
        )

        entries = [AuditLogEntry.from_row(r) for r in rows]
        total_pages = max(1, (total + page_size - 1) // page_size)

        return AuditLogListResponse(
            total_records=total,
            page=page,
            page_size=page_size,
            has_next=page < total_pages,
            activities=entries,
        )

    # ── Statistics ────────────────────────────────────────────────────────────

    async def get_statistics(self, user: User) -> AuditLogStatisticsResponse:
        user_id, team_ids = await self._resolve_scope(user)

        stats = await self.repo.get_statistics(
            user.organization_id,
            user_id=user_id,
            team_user_ids=team_ids,
        )

        return AuditLogStatisticsResponse(
            todayActivities=stats["todayActivities"],
            weekActivities=stats["weekActivities"],
            monthActivities=stats["monthActivities"],
            emails=stats["emails"],
            calls=stats["calls"],
            meetings=stats["meetings"],
            notes=stats["notes"],
        )

    # ── Recent activities ─────────────────────────────────────────────────────

    async def get_recent(self, user: User, limit: int = 10) -> list[AuditLogEntry]:
        user_id, team_ids = await self._resolve_scope(user)

        rows = await self.repo.get_recent(
            user.organization_id,
            user_id=user_id,
            team_user_ids=team_ids,
            limit=limit,
        )
        return [AuditLogEntry.from_row(r) for r in rows]

    # ── Search ────────────────────────────────────────────────────────────────

    async def search(
        self,
        user: User,
        q: str,
        *,
        page: int = 1,
        page_size: int = 20,
    ) -> AuditLogListResponse:
        return await self.get_audit_logs(
            user,
            search=q,
            page=page,
            page_size=page_size,
        )
