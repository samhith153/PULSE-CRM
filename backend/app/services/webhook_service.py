from __future__ import annotations

import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import NotFoundException
from app.models.webhook import WebhookDelivery
from app.repositories.webhook_repository import WebhookDeliveryRepository, WebhookEndpointRepository
from app.schemas.webhook import WebhookDeliveryResponse, WebhookEndpointCreate, WebhookEndpointResponse


class WebhookService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.endpoint_repo = WebhookEndpointRepository(db)
        self.delivery_repo = WebhookDeliveryRepository(db)

    async def register(self, organization_id: UUID, created_by: UUID, payload: WebhookEndpointCreate) -> WebhookEndpointResponse:
        endpoint = await self.endpoint_repo.create(
            organization_id=organization_id,
            created_by=created_by,
            name=payload.name,
            target_url=str(payload.target_url),
            secret=payload.secret or secrets.token_urlsafe(32),
            event_types=payload.event_types,
            max_attempts=settings.WEBHOOK_MAX_ATTEMPTS,
        )
        return WebhookEndpointResponse.model_validate(endpoint)

    async def list_endpoints(self, organization_id: UUID) -> list[WebhookEndpointResponse]:
        endpoints = await self.endpoint_repo.list_by_organization(organization_id)
        return [WebhookEndpointResponse.model_validate(endpoint) for endpoint in endpoints]

    async def enqueue_event(self, organization_id: UUID, event_type: str, payload: dict) -> list[WebhookDeliveryResponse]:
        endpoints = await self.endpoint_repo.list_by_organization(organization_id)
        deliveries = []
        for endpoint in endpoints:
            if endpoint.event_types and event_type not in endpoint.event_types:
                continue
            delivery = await self.delivery_repo.create(
                organization_id=organization_id,
                endpoint_id=endpoint.id,
                event_type=event_type,
                payload=payload,
                status="pending",
                attempts=0,
            )
            deliveries.append(WebhookDeliveryResponse.model_validate(delivery))
        return deliveries

    async def deliver_due(self) -> list[WebhookDeliveryResponse]:
        results = []
        for delivery in await self.delivery_repo.pending_due():
            results.append(await self.deliver(delivery))
        return results

    async def retry(self, organization_id: UUID, delivery_id: UUID) -> WebhookDeliveryResponse:
        delivery = await self.delivery_repo.get_by_id(delivery_id)
        if not delivery or delivery.organization_id != organization_id:
            raise NotFoundException("WebhookDelivery", delivery_id)
        return await self.deliver(delivery)

    async def deliver(self, delivery: WebhookDelivery) -> WebhookDeliveryResponse:
        endpoint = await self.endpoint_repo.get_by_id(delivery.endpoint_id)
        if not endpoint:
            delivery.status = "failed"
            delivery.last_error = "Webhook endpoint no longer exists."
            await self.db.flush()
            return WebhookDeliveryResponse.model_validate(delivery)
        body = json.dumps(delivery.payload, separators=(",", ":"), default=str).encode()
        signature = hmac.new(endpoint.secret.encode(), body, hashlib.sha256).hexdigest()
        delivery.attempts += 1
        try:
            async with httpx.AsyncClient(timeout=settings.WEBHOOK_TIMEOUT_SECONDS) as client:
                response = await client.post(endpoint.target_url, content=body, headers={"Content-Type": "application/json", "X-Pulse-Signature": signature, "X-Pulse-Event": delivery.event_type})
            delivery.last_status_code = response.status_code
            if 200 <= response.status_code < 300:
                delivery.status = "delivered"
                delivery.delivered_at = datetime.now(timezone.utc)
                delivery.next_attempt_at = None
            else:
                self._schedule_retry(delivery, f"HTTP {response.status_code}")
        except Exception as exc:
            self._schedule_retry(delivery, str(exc))
        await self.db.flush()
        return WebhookDeliveryResponse.model_validate(delivery)

    def _schedule_retry(self, delivery: WebhookDelivery, error: str) -> None:
        delivery.last_error = error[:1000]
        max_attempts = settings.WEBHOOK_MAX_ATTEMPTS
        if delivery.attempts >= max_attempts:
            delivery.status = "failed"
            delivery.next_attempt_at = None
            return
        delivery.status = "retrying"
        delivery.next_attempt_at = datetime.now(timezone.utc) + timedelta(minutes=2 ** max(0, delivery.attempts - 1))
