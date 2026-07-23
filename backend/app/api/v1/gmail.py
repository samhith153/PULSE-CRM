"""
Gmail integration routes.
"""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import PaginatedResponse, StandardResponse
from app.schemas.email import (
    EmailHistoryResponse,
    EmailResponse,
    EmailSyncRequest,
    EmailSyncResultResponse,
    EmailThreadResponse,
    GmailConnectRequest,
    GmailConnectionResponse,
    GmailOAuthCallbackRequest,
    GmailOAuthLoginResponse,
    GmailTokenRefreshRequest,
    GmailWebhookRequest,
)
from app.services.email_service import EmailService
from app.utils.enums import EmailDirection, SortOrder

router = APIRouter()


@router.get(
    "/oauth/login",
    response_model=StandardResponse[GmailOAuthLoginResponse],
    summary="Start Gmail OAuth login",
    dependencies=[Depends(require_permission("gmail:connect"))],
)
async def oauth_login(current_user: CurrentUser, db: DBSession) -> dict:
    svc = EmailService(db)
    result = await svc.start_oauth_login(current_user.organization_id, current_user.id, current_user.email)
    return {"success": True, "message": "OK", "data": result}


@router.post(
    "/oauth/callback",
    response_model=StandardResponse[GmailConnectionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Handle Gmail OAuth callback",
    dependencies=[Depends(require_permission("gmail:connect"))],
)
async def oauth_callback(payload: GmailOAuthCallbackRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = EmailService(db)
    connection = await svc.handle_oauth_callback(current_user.organization_id, current_user.id, payload)
    return {"success": True, "message": "Gmail connected.", "data": GmailConnectionResponse.model_validate(connection)}


@router.post(
    "/refresh",
    response_model=StandardResponse[GmailConnectionResponse],
    summary="Refresh Gmail access token",
    dependencies=[Depends(require_permission("gmail:connect"))],
)
async def refresh_token(payload: GmailTokenRefreshRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = EmailService(db)
    connection = await svc.refresh_token(current_user.organization_id, current_user.id, payload)
    return {"success": True, "message": "Token refreshed.", "data": GmailConnectionResponse.model_validate(connection)}


@router.post(
    "/webhook",
    response_model=StandardResponse[EmailSyncResultResponse],
    summary="Receive Gmail webhook notification",
    dependencies=[Depends(require_permission("email:sync"))],
)
async def webhook(payload: GmailWebhookRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = EmailService(db)
    result = await svc.webhook_sync(current_user.organization_id, current_user.id, payload)
    return {"success": True, "message": "Webhook processed.", "data": result}


@router.post(
    "/sync-worker",
    response_model=StandardResponse[list[EmailSyncResultResponse]],
    summary="Run Gmail sync worker",
    dependencies=[Depends(require_permission("email:sync"))],
)
async def sync_worker(current_user: CurrentUser, db: DBSession) -> dict:
    svc = EmailService(db)
    results = await svc.sync_all_connections(current_user.organization_id, current_user.id)
    return {"success": True, "message": "Sync worker completed.", "data": results}


@router.post(
    "/connect",
    response_model=StandardResponse[GmailConnectionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Connect Gmail account",
    dependencies=[Depends(require_permission("gmail:connect"))],
)
async def connect_gmail(payload: GmailConnectRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = EmailService(db)
    connection = await svc.connect_gmail(
        organization_id=current_user.organization_id,
        created_by=current_user.id,
        user_id=current_user.id,
        email_address=str(payload.email_address),
        access_token_encrypted=payload.access_token,
        refresh_token_encrypted=payload.refresh_token,
        token_expires_at=payload.token_expires_at,
        sync_cursor=payload.sync_cursor,
        scopes_json=payload.scopes_json,
    )
    return {"success": True, "message": "Gmail connected.", "data": GmailConnectionResponse.model_validate(connection)}


@router.get(
    "/connections",
    response_model=StandardResponse[list[GmailConnectionResponse]],
    summary="List Gmail connections",
    dependencies=[Depends(require_permission("email:read"))],
)
async def list_connections(current_user: CurrentUser, db: DBSession) -> dict:
    svc = EmailService(db)
    connections = await svc.list_connections(current_user.organization_id)
    return {"success": True, "message": "OK", "data": [GmailConnectionResponse.model_validate(item) for item in connections]}


@router.get(
    "/emails",
    response_model=StandardResponse[PaginatedResponse[EmailResponse]],
    summary="List synced emails",
    dependencies=[Depends(require_permission("email:read"))],
)
async def list_emails(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    direction: Optional[EmailDirection] = Query(default=None),
    thread_id: Optional[str] = Query(default=None),
    contact_id: Optional[UUID] = Query(default=None),
    deal_id: Optional[UUID] = Query(default=None),
    sort_order: SortOrder = Query(default=SortOrder.DESC),
) -> dict:
    svc = EmailService(db)
    entity_type = None
    entity_id = None
    if contact_id:
        entity_type = "contact"
        entity_id = contact_id
    elif deal_id:
        entity_type = "deal"
        entity_id = deal_id

    emails, total = await svc.list_emails(
        current_user.organization_id,
        search,
        direction,
        thread_id,
        entity_type,
        entity_id,
        page,
        page_size,
        sort_order=sort_order,
    )
    paginated = PaginatedResponse.create(
        data=[EmailResponse.model_validate(email) for email in emails],
        total=total,
        page=page,
        page_size=page_size,
    )
    return {"success": True, "message": "OK", "data": paginated}


@router.post(
    "/sync",
    response_model=StandardResponse[EmailSyncResultResponse],
    summary="Sync Gmail messages",
    description="Accepts a sync payload from a background worker or integration job and persists Gmail messages into the CRM.",
    dependencies=[Depends(require_permission("email:sync"))],
)
async def sync_email(payload: EmailSyncRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = EmailService(db)
    result = await svc.sync_messages(current_user.organization_id, current_user.id, payload)
    return {"success": True, "message": "Email sync completed.", "data": result}


@router.get(
    "/threads/{thread_id}",
    response_model=StandardResponse[EmailThreadResponse],
    summary="View an email thread",
    dependencies=[Depends(require_permission("email:read"))],
)
async def get_thread(thread_id: str, current_user: CurrentUser, db: DBSession) -> dict:
    svc = EmailService(db)
    thread = await svc.get_thread_history(current_user.organization_id, thread_id)
    return {"success": True, "message": "OK", "data": thread}


@router.get(
    "/contacts/{contact_id}/history",
    response_model=StandardResponse[EmailHistoryResponse],
    summary="Get contact email history",
    dependencies=[Depends(require_permission("email:read"))],
)
async def get_contact_history(
    contact_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    sort_order: SortOrder = Query(default=SortOrder.DESC),
) -> dict:
    svc = EmailService(db)
    records = await svc.email_history_page(
        current_user.organization_id,
        "contact",
        contact_id,
        search,
        page,
        page_size,
        sort_order=sort_order,
    )
    return {"success": True, "message": "OK", "data": records}


@router.get(
    "/deals/{deal_id}/history",
    response_model=StandardResponse[EmailHistoryResponse],
    summary="Get deal email history",
    dependencies=[Depends(require_permission("email:read"))],
)
async def get_deal_history(
    deal_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    sort_order: SortOrder = Query(default=SortOrder.DESC),
) -> dict:
    svc = EmailService(db)
    records = await svc.email_history_page(
        current_user.organization_id,
        "deal",
        deal_id,
        search,
        page,
        page_size,
        sort_order=sort_order,
    )
    return {"success": True, "message": "OK", "data": records}
