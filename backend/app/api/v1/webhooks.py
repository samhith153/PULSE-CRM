from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.webhook import WebhookDeliverRequest, WebhookDeliveryResponse, WebhookEndpointCreate, WebhookEndpointResponse
from app.services.webhook_service import WebhookService

router = APIRouter(dependencies=[Depends(require_permission("webhook:manage"))])


@router.post("/endpoints", response_model=WebhookEndpointResponse, status_code=status.HTTP_201_CREATED)
async def create_endpoint(payload: WebhookEndpointCreate, current_user: CurrentUser, db: DBSession) -> WebhookEndpointResponse:
    return await WebhookService(db).register(current_user.organization_id, current_user.id, payload)


@router.get("/endpoints", response_model=list[WebhookEndpointResponse])
async def list_endpoints(current_user: CurrentUser, db: DBSession) -> list[WebhookEndpointResponse]:
    return await WebhookService(db).list_endpoints(current_user.organization_id)


@router.post("/deliveries", response_model=list[WebhookDeliveryResponse], status_code=status.HTTP_202_ACCEPTED)
async def enqueue_delivery(payload: WebhookDeliverRequest, current_user: CurrentUser, db: DBSession) -> list[WebhookDeliveryResponse]:
    return await WebhookService(db).enqueue_event(current_user.organization_id, payload.event_type, payload.payload)


@router.post("/deliveries/retry", response_model=list[WebhookDeliveryResponse])
async def retry_due(current_user: CurrentUser, db: DBSession) -> list[WebhookDeliveryResponse]:
    return await WebhookService(db).deliver_due()


@router.post("/deliveries/{delivery_id}/retry", response_model=WebhookDeliveryResponse)
async def retry_delivery(delivery_id: UUID, current_user: CurrentUser, db: DBSession) -> WebhookDeliveryResponse:
    return await WebhookService(db).retry(current_user.organization_id, delivery_id)
