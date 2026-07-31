"""
AI Insights Controller
Thin orchestration layer: validates params, delegates to service.
"""
from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.ai_insights import ActionCenterResponse
from app.services.ai_insights_service import AIInsightsService

_VALID_DATE_FILTERS     = {"today", "week", "month", None}
_VALID_PRIORITY_FILTERS = {"p1", "critical", "high", "medium", "low", None}


class AIInsightsController:
    def __init__(self, db: AsyncSession) -> None:
        self._svc = AIInsightsService(db)

    async def get_action_center(
        self,
        user: User,
        *,
        date_filter: Optional[str] = None,
        priority_filter: Optional[str] = None,
    ) -> ActionCenterResponse:
        if date_filter and date_filter.lower() not in _VALID_DATE_FILTERS:
            date_filter = None
        if priority_filter and priority_filter.lower() not in _VALID_PRIORITY_FILTERS:
            priority_filter = None

        return await self._svc.get_action_center(
            user,
            date_filter=date_filter,
            priority_filter=priority_filter,
        )
