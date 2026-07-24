from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.webhook import WebhookDelivery, WebhookEndpoint
from app.repositories.base import BaseRepository


class WebhookEndpointRepository(BaseRepository[WebhookEndpoint]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(WebhookEndpoint, db)

    async def list_by_organization(self, organization_id: UUID) -> list[WebhookEndpoint]:
        result = await self.db.execute(select(WebhookEndpoint).where(WebhookEndpoint.organization_id == organization_id, WebhookEndpoint.is_active.is_(True)))
        return list(result.scalars().all())

    async def get_in_org(self, organization_id: UUID, endpoint_id: UUID) -> WebhookEndpoint | None:
        result = await self.db.execute(select(WebhookEndpoint).where(WebhookEndpoint.organization_id == organization_id, WebhookEndpoint.id == endpoint_id, WebhookEndpoint.is_active.is_(True)))
        return result.scalar_one_or_none()


class WebhookDeliveryRepository(BaseRepository[WebhookDelivery]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(WebhookDelivery, db)

    async def pending_due(self, limit: int = 50) -> list[WebhookDelivery]:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(WebhookDelivery)
            .where(WebhookDelivery.status.in_(["pending", "retrying"]), or_(WebhookDelivery.next_attempt_at.is_(None), WebhookDelivery.next_attempt_at <= now))
            .limit(limit)
        )
        return list(result.scalars().all())
