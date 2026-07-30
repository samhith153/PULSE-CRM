"""
Audit Log Controller
Thin orchestration layer: validates inputs, calls the service, returns response data.
"""
from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.audit_log import (
    AuditLogEntry,
    AuditLogListResponse,
    AuditLogStatisticsResponse,
)
from app.services.audit_log_service import AuditLogService

_VALID_DATE_FILTERS = {"today", "week", "month", "all"}


class AuditLogController:
    def __init__(self, db: AsyncSession) -> None:
        self._svc = AuditLogService(db)

    async def get_audit_logs(
        self,
        user: User,
        *,
        date_filter: Optional[str] = None,
        activity_type: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> AuditLogListResponse:
        # Normalise filter
        if date_filter and date_filter.lower() not in _VALID_DATE_FILTERS:
            date_filter = None
        if date_filter == "all":
            date_filter = None

        return await self._svc.get_audit_logs(
            user,
            date_filter=date_filter,
            activity_type=activity_type,
            search=search,
            page=page,
            page_size=page_size,
        )

    async def get_statistics(self, user: User) -> AuditLogStatisticsResponse:
        return await self._svc.get_statistics(user)

    async def get_recent(self, user: User, limit: int = 10) -> list[AuditLogEntry]:
        limit = max(1, min(limit, 50))  # clamp to 1-50
        return await self._svc.get_recent(user, limit=limit)

    async def search(
        self,
        user: User,
        q: str,
        *,
        page: int = 1,
        page_size: int = 20,
    ) -> AuditLogListResponse:
        return await self._svc.search(user, q, page=page, page_size=page_size)
