"""
Forecast Controller
Thin orchestration layer between the HTTP route and ForecastService.
Handles input validation, user-scope enforcement, and response shaping.
"""
from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.forecast import ManagerForecastResponse
from app.services.forecast_service import ForecastService


class ForecastController:
    def __init__(self, db: AsyncSession) -> None:
        self._svc = ForecastService(db)

    async def get_manager_forecast(
        self,
        organization_id: UUID,
        period: str = "monthly",
    ) -> ManagerForecastResponse:
        """
        Validates period param and delegates to ForecastService.
        Only data belonging to the caller's organisation is returned.
        """
        valid_periods = {"monthly", "quarterly", "yearly"}
        if period not in valid_periods:
            period = "monthly"

        return await self._svc.get_forecast(organization_id, period=period)
