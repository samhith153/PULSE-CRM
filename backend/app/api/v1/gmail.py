"""
Gmail integration routes.
"""
from __future__ import annotations

import base64
import json
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import HTMLResponse

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import PaginatedResponse, StandardResponse
from app.schemas.email import (
    EmailHistoryResponse,
    EmailResponse,
    EmailSendRequest,
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


@router.get(
    "/oauth/callback",
    summary="Handle Gmail OAuth callback (browser redirect)",
    include_in_schema=False,
)
async def oauth_callback_get(code: str = Query(None), state: str = Query(None), error: str = Query(None)) -> HTMLResponse:
    """Google redirects the browser here with ?code=...&state=... or ?error=..."""
    from app.core.logging import get_logger
    from app.database.connection import AsyncSessionFactory

    logger = get_logger(__name__)

    if error:
        return HTMLResponse(
            f"""<!DOCTYPE html>
<html><head><title>Gmail Connection Failed</title>
<style>
body {{ font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }}
.card {{ background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }}
h1 {{ color: #d93025; margin-bottom: 8px; }}
p {{ color: #555; }}
</style></head>
<body><div class="card">
<h1>Gmail Connection Failed</h1>
<p>Google returned an error: <strong>{error}</strong></p>
<p>Make sure you clicked "Allow" on the Google consent screen.</p>
</div></body></html>""",
            status_code=400,
        )

    if not code:
        return HTMLResponse("<h1>Error: No authorization code received from Google.</h1>", status_code=400)

    try:
        decoded = json.loads(base64.urlsafe_b64decode(state))
        org_id = UUID(decoded["org"])
        user_id = UUID(decoded["user"])
    except Exception:
        return HTMLResponse("<h1>Error: Invalid or missing state parameter.</h1>", status_code=400)

    try:
        async with AsyncSessionFactory() as db:
            svc = EmailService(db)
            payload = GmailOAuthCallbackRequest(code=code, state=state)
            connection = await svc.handle_oauth_callback(org_id, user_id, payload)
            await db.commit()
            email = connection.email_address
    except Exception as exc:
        logger.exception("Gmail OAuth callback failed")
        return HTMLResponse(f"<h1>Error connecting Gmail</h1><p>{exc}</p>", status_code=400)

    return HTMLResponse(
        f"""<!DOCTYPE html>
<html><head><title>Gmail Connected</title>
<style>
body {{ font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }}
.card {{ background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }}
h1 {{ color: #1a73e8; margin-bottom: 8px; }}
p {{ color: #555; }}
.check {{ font-size: 48px; margin-bottom: 16px; }}
</style></head>
<body><div class="card">
<div class="check">&#10003;</div>
<h1>Gmail Connected</h1>
<p>{email} is now connected to PULSE CRM.</p>
<p>You can close this window.</p>
</div></body></html>""",
        status_code=200,
    )


@router.post(
    "/pubsub/webhook",
    summary="Receive Gmail Pub/Sub push notification (no auth)",
    include_in_schema=False,
)
async def pubsub_webhook(request_body: dict) -> HTMLResponse:
    """Google Pub/Sub pushes Gmail notifications here.
    Format: {"message": {"data": "base64-encoded-json", ...}, "subscription": "..."}
    The base64 data contains {"historyId": "123", "emailAddress": "user@gmail.com"}
    """
    import asyncio as _asyncio
    from app.core.logging import get_logger
    from app.database.connection import AsyncSessionFactory
    from app.models.email import GmailConnection
    from app.services.email_service import EmailService, _background_tasks
    from app.utils.enums import EmailSyncStatus
    from sqlalchemy import select

    logger = get_logger(__name__)

    try:
        message_data = request_body.get("message", {}).get("data")
        if not message_data:
            logger.warning("Pub/Sub message has no data")
            return HTMLResponse("OK", status_code=200)

        decoded = json.loads(base64.urlsafe_b64decode(message_data))
        email_address = decoded.get("emailAddress")
        history_id = decoded.get("historyId")
        logger.info("Pub/Sub notification: email=%s historyId=%s", email_address, history_id)

        if not email_address or not history_id:
            logger.warning("Pub/Sub message missing emailAddress or historyId: %s", decoded)
            return HTMLResponse("OK", status_code=200)

        async with AsyncSessionFactory() as db:
            from uuid import UUID
            stmt = select(GmailConnection).where(
                GmailConnection.email_address == email_address,
                GmailConnection.is_active.is_(True),
            ).order_by(GmailConnection.created_at.desc())
            result = await db.execute(stmt)
            connection = result.scalars().first()

            if not connection:
                logger.warning("No Gmail connection found for %s", email_address)
                return HTMLResponse("OK", status_code=200)

            svc = EmailService(db)
            try:
                access_token = await svc._access_token_for_connection(
                    connection.organization_id, None, connection
                )
            except Exception as exc:
                logger.warning("Failed to get access token for %s: %s", email_address, exc)
                return HTMLResponse("OK", status_code=200)

            try:
                cursor = connection.sync_cursor
                if not cursor or not cursor.isdigit():
                    logger.info("[PUBSUB] No valid sync_cursor, falling back to full fetch")
                    sync_result = await svc.fetch_from_gmail(
                        connection.organization_id, connection.id, None,
                    )
                else:
                    sync_result = await svc._incremental_sync_from_gmail(
                        connection.organization_id, None, connection, access_token, cursor,
                    )
                await db.commit()
                logger.info(
                    "Pub/Sub sync completed for %s: synced=%d skipped=%d",
                    email_address, sync_result.synced_count, sync_result.skipped_count,
                )
            except Exception as exc:
                logger.warning("Pub/Sub sync failed for %s: %s", email_address, exc)
                await db.rollback()

    except Exception as exc:
        logger.exception("Pub/Sub webhook processing failed")

    return HTMLResponse("OK", status_code=200)


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
    "/watch/refresh",
    summary="Re-establish Gmail Pub/Sub watches for all connections (no auth)",
    include_in_schema=False,
)
async def refresh_watches() -> HTMLResponse:
    """Manually trigger Gmail watch refresh for all active connections.
    Useful for debugging and after server restarts.
    """
    from app.core.logging import get_logger
    from app.database.connection import AsyncSessionFactory

    logger = get_logger(__name__)
    try:
        async with AsyncSessionFactory() as db:
            svc = EmailService(db)
            refreshed = await svc.refresh_watch_for_all_connections()
            await db.commit()
            logger.info("Manual watch refresh: %d connections refreshed", refreshed)
            return HTMLResponse(f"OK — {refreshed} watch(es) refreshed", status_code=200)
    except Exception as exc:
        logger.exception("Manual watch refresh failed")
        return HTMLResponse(f"FAIL — {exc}", status_code=500)


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
    "/connections/{connection_id}/sync",
    response_model=StandardResponse[EmailSyncResultResponse],
    summary="Fetch and sync Gmail messages for a connection",
    dependencies=[Depends(require_permission("email:sync"))],
)
async def fetch_connection_emails(connection_id: UUID, current_user: CurrentUser, db: DBSession) -> dict:
    svc = EmailService(db)
    result = await svc.fetch_from_gmail(current_user.organization_id, connection_id, current_user.id)
    return {"success": True, "message": "Gmail messages synced.", "data": result}

@router.post(
    "/send",
    response_model=StandardResponse[EmailResponse],
    summary="Send Gmail email",
    dependencies=[Depends(require_permission("email:send"))],
)
async def send_email(
    payload: EmailSendRequest,
    current_user: CurrentUser,
    db: DBSession,
):
    svc = EmailService(db)

    email = await svc.send_email(
        organization_id=current_user.organization_id,
        created_by=current_user.id,
        gmail_connection_id=payload.gmail_connection_id,
        receiver=str(payload.receiver),
        subject=payload.subject,
        html_body=payload.html_body,
        external_entity_type=payload.external_entity_type,
        external_entity_id=payload.external_entity_id,
    )

    return {
        "success": True,
        "message": "Email sent successfully.",
        "data": email,
    }

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
