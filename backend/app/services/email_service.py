"""Gmail integration service plus transactional SMTP email helpers."""
from __future__ import annotations

import asyncio
import secrets
import smtplib
import ssl
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from email.utils import parseaddr
from html import escape
from pathlib import Path
from string import Template
from typing import Optional, Sequence, Tuple
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ConflictException, NotFoundException
from app.core.logging import get_logger
from app.models.email import Email, GmailConnection
from app.models.user import User
from app.repositories.email_repository import EmailRepository, GmailConnectionRepository
from app.schemas.email import (
    EmailDetailResponse,
    EmailHistoryResponse,
    EmailResponse,
    EmailSyncMessageRequest,
    EmailSyncRequest,
    EmailSyncResultResponse,
    EmailThreadResponse,
    GmailConnectRequest,
    GmailOAuthCallbackRequest,
    GmailOAuthLoginResponse,
    GmailTokenRefreshRequest,
    GmailWebhookRequest,
)
from app.schemas.event_outbox import EventType
from app.services.event_service import EventService
from app.services.gmail_client import GmailClient, decode_gmail_body, gmail_datetime, headers_map
from app.services.timeline_engine_service import TimelineEngineService
from app.utils.enums import EmailDirection, EmailSyncStatus, SortOrder


logger = get_logger(__name__)


class EmailService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.connection_repo = GmailConnectionRepository(db)
        self.email_repo = EmailRepository(db)
        self.timeline = TimelineEngineService(db)
        self.events = EventService(db)
        self.gmail_client = GmailClient()

    async def _render_template(self, template_name: str, context: dict[str, object]) -> str:
        template_path = Path(__file__).resolve().parents[1] / "templates" / template_name
        template = Template(template_path.read_text(encoding="utf-8"))
        safe_context = {key: escape(str(value)) for key, value in context.items()}
        return template.safe_substitute(safe_context)

    async def _send_smtp_message(self, message: EmailMessage) -> None:
        if not settings.SMTP_HOST:
            raise RuntimeError("SMTP_HOST is not configured")

        def _deliver() -> None:
            if settings.SMTP_TLS:
                context = ssl.create_default_context()
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
                    smtp.ehlo()
                    smtp.starttls(context=context)
                    smtp.ehlo()
                    if settings.SMTP_USER and settings.SMTP_PASSWORD:
                        smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    smtp.send_message(message)
            else:
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
                    smtp.ehlo()
                    if settings.SMTP_USER and settings.SMTP_PASSWORD:
                        smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    smtp.send_message(message)

        await asyncio.to_thread(_deliver)

    def _build_message(self, subject: str, to_email: str, html_body: str, text_body: str) -> EmailMessage:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email
        msg.set_content(text_body)
        msg.add_alternative(html_body, subtype="html")
        return msg

    def _reset_url(self, token: str) -> str:
        base = settings.FRONTEND_BASE_URL.rstrip("/")
        return f"{base}/reset-password?token={token}"

    async def send_password_reset_email(self, user: User, reset_token: str, expires_at: datetime) -> bool:
        reset_url = self._reset_url(reset_token)
        logger.info("Password reset email queued for %s", user.email)
        html_body = await self._render_template(
            "password_reset.html",
            {
                "user_name": user.full_name or user.email,
                "reset_url": reset_url,
                "expires_minutes": settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES,
            },
        )
        text_body = (
            f"Hi {user.full_name or user.email},\n\n"
            f"Reset your password here: {reset_url}\n\n"
            f"This link expires at {expires_at.isoformat()}."
        )
        message = self._build_message("Reset your KALNET PULSE CRM password", user.email, html_body, text_body)
        try:
            await self._send_smtp_message(message)
            logger.info("Email delivered", extra={"email": user.email, "type": "password_reset"})
            await self.events.record_event(
                EventType.EMAIL_SENT,
                organization_id=user.organization_id,
                actor_id=user.id,
                aggregate_type="user",
                aggregate_id=str(user.id),
                source="smtp",
                payload={
                    "email": user.email,
                    "subject": "Reset your KALNET PULSE CRM password",
                    "template": "password_reset.html",
                    "reset_url": reset_url,
                },
            )
            return True
        except smtplib.SMTPAuthenticationError as exc:
            logger.error("SMTP authentication failed", extra={"email": user.email, "error": str(exc)})
        except Exception as exc:  # pragma: no cover - network/runtime dependent
            logger.error("Password reset email failed", extra={"email": user.email, "error": str(exc)})
        return False

    async def send_welcome_email(self, user: User, organization_name: Optional[str] = None) -> bool:
        subject = f"Welcome to {settings.APP_NAME}"
        greeting = user.full_name or user.email
        html_body = """
        <html>
          <body style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#111827;">
            <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:18px;padding:32px;">
              <h1 style="margin-top:0;">Welcome to ${app_name}</h1>
              <p>Hi ${user_name}, your account is ready${org_text}.</p>
            </div>
          </body>
        </html>
        """
        html_body = Template(html_body).safe_substitute(
            app_name=escape(settings.APP_NAME),
            user_name=escape(greeting),
            org_text=f" for {escape(organization_name)}" if organization_name else "",
        )
        message = self._build_message(subject, user.email, html_body, f"Welcome to {settings.APP_NAME}!")
        try:
            await self._send_smtp_message(message)
            logger.info("Email delivered", extra={"email": user.email, "type": "welcome"})
            await self.events.record_event(
                EventType.EMAIL_SENT,
                organization_id=user.organization_id,
                actor_id=user.id,
                aggregate_type="user",
                aggregate_id=str(user.id),
                source="smtp",
                payload={"email": user.email, "subject": subject, "template": "welcome"},
            )
            return True
        except Exception as exc:  # pragma: no cover - network/runtime dependent
            logger.error("Welcome email failed", extra={"email": user.email, "error": str(exc)})
            return False

    async def send_verification_email(self, user: User, verification_url: str) -> bool:
        subject = f"Verify your {settings.APP_NAME} account"
        html_body = f"""
        <html>
          <body style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#111827;">
            <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:18px;padding:32px;">
              <h1 style="margin-top:0;">Verify your email</h1>
              <p>Hi {escape(user.full_name or user.email)}, click the link below to verify your account.</p>
              <p><a href="{escape(verification_url)}">Verify email</a></p>
            </div>
          </body>
        </html>
        """
        message = self._build_message(subject, user.email, html_body, f"Verify your account: {verification_url}")
        try:
            await self._send_smtp_message(message)
            logger.info("Email delivered", extra={"email": user.email, "type": "verification"})
            await self.events.record_event(
                EventType.EMAIL_SENT,
                organization_id=user.organization_id,
                actor_id=user.id,
                aggregate_type="user",
                aggregate_id=str(user.id),
                source="smtp",
                payload={"email": user.email, "subject": subject, "template": "verification"},
            )
            return True
        except Exception as exc:  # pragma: no cover - network/runtime dependent
            logger.error("Verification email failed", extra={"email": user.email, "error": str(exc)})
            return False

    async def connect_gmail(
        self,
        organization_id: UUID,
        created_by: UUID,
        user_id: UUID,
        email_address: str,
        access_token_encrypted: str,
        refresh_token_encrypted: Optional[str],
        token_expires_at: Optional[datetime],
        sync_cursor: Optional[str],
        scopes_json: Optional[list[str]],
    ) -> GmailConnection:
        existing = await self.connection_repo.get_by_user(organization_id, user_id)
        if existing:
            raise ConflictException("A Gmail connection already exists for this user.")

        connection = await self.connection_repo.create(
            organization_id=organization_id,
            created_by=created_by,
            user_id=user_id,
            email_address=email_address,
            access_token_encrypted=self.gmail_client.cipher.encrypt(access_token_encrypted),
            refresh_token_encrypted=self.gmail_client.cipher.encrypt(refresh_token_encrypted),
            token_expires_at=token_expires_at,
            sync_cursor=sync_cursor,
            scopes_json=scopes_json,
            sync_status=EmailSyncStatus.CONNECTED.value,
        )
        await self.timeline.record(
            organization_id=organization_id,
            created_by=created_by,
            entity_type="email",
            entity_id=connection.id,
            action="gmail_connected",
            title="Gmail connected",
            description=f"Connected Gmail account {email_address}.",
            payload={"gmail_connection_id": str(connection.id), "email_address": email_address},
            topic="gmail",
        )
        return connection

    async def start_oauth_login(self, organization_id: UUID, created_by: UUID, email_address: Optional[str] = None) -> GmailOAuthLoginResponse:
        state = secrets.token_urlsafe(24)
        return GmailOAuthLoginResponse(authorization_url=self.gmail_client.authorization_url(state), state=state)

    async def handle_oauth_callback(
        self,
        organization_id: UUID,
        created_by: UUID,
        payload: GmailOAuthCallbackRequest,
    ) -> GmailConnection:
        from app.core.exceptions import ValidationException

        token_response = await self.gmail_client.exchange_code(payload.code)
        access_token = token_response["access_token"]
        refresh_token = token_response.get("refresh_token")
        profile = await self.gmail_client.get_profile(access_token)
        email_address = payload.email_address or profile.get("emailAddress")
        if not email_address:
            raise ValidationException("Google profile did not include an email address.")
        return await self.connect_gmail(
            organization_id=organization_id,
            created_by=created_by,
            user_id=created_by,
            email_address=str(email_address),
            access_token_encrypted=access_token,
            refresh_token_encrypted=refresh_token,
            token_expires_at=self.gmail_client.token_expiry(token_response),
            sync_cursor=None,
            scopes_json=[scope.strip() for scope in settings.GOOGLE_OAUTH_SCOPES.split(",") if scope.strip()],
        )

    async def refresh_token(self, organization_id: UUID, created_by: UUID, payload: GmailTokenRefreshRequest) -> GmailConnection:
        from app.core.exceptions import ValidationException

        connection = await self.connection_repo.get_by_id_in_org(organization_id, payload.gmail_connection_id)
        if not connection:
            raise NotFoundException("GmailConnection", payload.gmail_connection_id)
        refresh_token = self.gmail_client.cipher.decrypt(connection.refresh_token_encrypted)
        if not refresh_token:
            raise ValidationException("Gmail refresh token is not available for this connection.")
        token_response = await self.gmail_client.refresh_access_token(refresh_token)
        connection.access_token_encrypted = self.gmail_client.cipher.encrypt(token_response["access_token"])
        if token_response.get("refresh_token"):
            connection.refresh_token_encrypted = self.gmail_client.cipher.encrypt(token_response.get("refresh_token"))
        connection.token_expires_at = self.gmail_client.token_expiry(token_response)
        connection.sync_status = EmailSyncStatus.ACTIVE.value
        await self.db.flush()
        return connection
    async def list_connections(self, organization_id: UUID) -> list[GmailConnection]:
        return await self.connection_repo.list_by_organization(organization_id)

    async def sync_messages(
        self,
        organization_id: UUID,
        created_by: Optional[UUID],
        payload: EmailSyncRequest,
    ) -> EmailSyncResultResponse:
        connection = await self.connection_repo.get_by_id_in_org(organization_id, payload.gmail_connection_id)
        if not connection:
            raise NotFoundException("GmailConnection", payload.gmail_connection_id)

        ingested: list[Email] = []
        skipped = 0
        messages: Sequence[EmailSyncMessageRequest] = payload.messages
        for message in messages:
            email, created = await self.ingest_email(
                organization_id=organization_id,
                created_by=created_by,
                gmail_connection_id=connection.id,
                gmail_message_id=message.gmail_message_id,
                thread_id=message.thread_id,
                direction=EmailDirection(message.direction),
                sender=str(message.sender),
                receiver=str(message.receiver) if message.receiver else None,
                subject=message.subject,
                body_preview=message.body_preview,
                sent_at=message.sent_at,
                attachment_metadata=[item.model_dump() for item in message.attachment_metadata],
                raw_payload=message.raw_payload,
                external_entity_type=message.external_entity_type,
                external_entity_id=message.external_entity_id,
                is_read=message.is_read,
            )
            if created:
                ingested.append(email)
            else:
                skipped += 1

        next_cursor = payload.sync_cursor or (messages[-1].gmail_message_id if messages else connection.sync_cursor)
        await self.connection_repo.update(
            connection,
            sync_cursor=next_cursor,
            sync_status=EmailSyncStatus.ACTIVE.value,
        )

        return EmailSyncResultResponse(
            gmail_connection_id=connection.id,
            synced_count=len(ingested),
            skipped_count=skipped,
            next_cursor=next_cursor,
            connection_status=EmailSyncStatus.ACTIVE.value,
            emails=[EmailResponse.model_validate(item) for item in ingested],
        )

    async def ingest_email(
        self,
        organization_id: UUID,
        created_by: Optional[UUID],
        gmail_connection_id: UUID,
        gmail_message_id: str,
        thread_id: Optional[str],
        direction: EmailDirection,
        sender: str,
        receiver: Optional[str],
        subject: str,
        body_preview: Optional[str],
        sent_at: datetime,
        attachment_metadata: Optional[list] = None,
        raw_payload: Optional[dict] = None,
        external_entity_type: Optional[str] = None,
        external_entity_id: Optional[UUID] = None,
        is_read: bool = False,
    ) -> tuple[Email, bool]:
        connection = None

        if gmail_connection_id:
            connection = await self.connection_repo.get_by_id_in_org(
                organization_id,
                gmail_connection_id,
            )

            if not connection:
                raise NotFoundException(
                    "GmailConnection",
                    gmail_connection_id,
                )
        existing = await self.email_repo.get_by_message_id(organization_id, gmail_message_id)
        if existing:
            return existing, False

        email = await self.email_repo.create(
            organization_id=organization_id,
            created_by=created_by,
            gmail_message_id=gmail_message_id,
            thread_id=thread_id,
            direction=direction.value,
            sender=sender,
            receiver=receiver,
            subject=subject,
            body_preview=body_preview,
            sent_at=sent_at,
            attachment_metadata=attachment_metadata or [],
            raw_payload=raw_payload,
            gmail_connection_id=gmail_connection_id,
            external_entity_type=external_entity_type,
            external_entity_id=external_entity_id,
            is_read=is_read,
        )
        await self.timeline.record(
            organization_id=organization_id,
            created_by=created_by,
            entity_type="email",
            entity_id=email.id,
            action="email_received" if direction == EmailDirection.INBOUND else "email_sent",
            title=subject,
            description=body_preview,
            payload={
                "gmail_message_id": gmail_message_id,
                "thread_id": thread_id,
                "external_entity_type": external_entity_type,
                "external_entity_id": str(external_entity_id) if external_entity_id else None,
            },
            topic = "gmail" if gmail_connection_id else "smtp",
        )
        if is_read:
            await self.events.record_event(
                EventType.EMAIL_READ,
                organization_id=organization_id,
                actor_id=created_by,
                aggregate_type="email",
                aggregate_id=str(email.id),
                source="gmail",
                payload={
                    "email_id": str(email.id),
                    "gmail_message_id": gmail_message_id,
                    "thread_id": thread_id,
                    "subject": subject,
                },
            )
        return email, True
    

    async def send_email(
        self,
        organization_id: UUID,
        created_by: UUID,
        gmail_connection_id: UUID,
        receiver: str,
        subject: str,
        html_body: str,
        external_entity_type: str | None = None,
        external_entity_id: UUID | None = None,
    ):
        """
        Send an email through Gmail and persist it in the CRM.
        """

        connection = await self.connection_repo.get_by_id_in_org(
        organization_id,
        gmail_connection_id,
        )

        if not connection:
            raise NotFoundException(
                "GmailConnection",
                gmail_connection_id,
            )

        message = self._build_message(
            subject=subject,
            to_email=receiver,
            html_body=html_body,
            text_body=html_body,
        )

        await self._send_smtp_message(message)
        message_id = str(uuid4())
        thread_id = message_id
    

        email, _ = await self.ingest_email(
            organization_id=organization_id,
            created_by=created_by,
            gmail_connection_id=gmail_connection_id,
            gmail_message_id=message_id,
            thread_id=thread_id,
            direction=EmailDirection.OUTBOUND,
            sender=settings.SMTP_FROM_EMAIL,
            receiver=receiver,
            subject=subject,
            body_preview=html_body[:500],
            sent_at=datetime.now(timezone.utc),
            attachment_metadata=[],
            raw_payload={
                "provider": "brevo_smtp",
                "status": "sent",
                "events": [
                    {
                        "event": "sent",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                ]
            },
            external_entity_type=external_entity_type,
            external_entity_id=external_entity_id,
            is_read=True,
        )

        return EmailResponse.model_validate(email)

    async def _access_token_for_connection(self, organization_id: UUID, created_by: Optional[UUID], connection: GmailConnection) -> str:
        from app.core.exceptions import ValidationException

        expires_at = connection.token_expires_at
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at and expires_at <= datetime.now(timezone.utc) + timedelta(minutes=2):
            refreshed = await self.refresh_token(
                organization_id,
                created_by or connection.user_id,
                GmailTokenRefreshRequest(gmail_connection_id=connection.id),
            )
            connection = refreshed
        token = self.gmail_client.cipher.decrypt(connection.access_token_encrypted)
        if not token:
            raise ValidationException("Gmail access token is not available for this connection.")
        return token

    def _gmail_message_to_sync(self, connection: GmailConnection, message: dict) -> EmailSyncMessageRequest:
        headers = headers_map(message)
        sender = parseaddr(headers.get("from") or connection.email_address)[1] or connection.email_address
        receiver = parseaddr(headers.get("to") or connection.email_address)[1] or connection.email_address
        body = decode_gmail_body(message.get("payload", {})) or message.get("snippet") or ""
        labels = set(message.get("labelIds") or [])
        direction = EmailDirection.OUTBOUND.value if "SENT" in labels else EmailDirection.INBOUND.value
        return EmailSyncMessageRequest(
            gmail_message_id=message["id"],
            thread_id=message.get("threadId"),
            direction=direction,
            sender=sender,
            receiver=receiver,
            subject=headers.get("subject") or "(no subject)",
            body_preview=body[:500],
            sent_at=gmail_datetime(message),
            attachment_metadata=[],
            raw_payload=message,
            is_read="UNREAD" not in labels,
        )

    async def fetch_from_gmail(self, organization_id: UUID, connection_id: UUID, created_by: Optional[UUID]) -> EmailSyncResultResponse:
        connection = await self.connection_repo.get_by_id_in_org(organization_id, connection_id)
        if not connection:
            raise NotFoundException("GmailConnection", connection_id)
        access_token = await self._access_token_for_connection(organization_id, created_by, connection)
        listed = await self.gmail_client.list_messages(access_token, page_token=connection.sync_cursor, max_results=25)
        messages = []
        for item in listed.get("messages", []):
            try:
                raw_message = await self.gmail_client.get_message(access_token, item["id"])
                messages.append(self._gmail_message_to_sync(connection, raw_message))
            except Exception as exc:
                logger.warning("Skipping Gmail message after fetch failure", extra={"message_id": item.get("id"), "error": str(exc)})
        payload = EmailSyncRequest(
            gmail_connection_id=connection.id,
            sync_cursor=listed.get("nextPageToken") or listed.get("historyId") or connection.sync_cursor,
            messages=messages,
        )
        return await self.sync_messages(organization_id, created_by, payload)
    async def webhook_sync(self, organization_id: UUID, created_by: Optional[UUID], payload: GmailWebhookRequest) -> EmailSyncResultResponse:
        if payload.gmail_connection_id:
            return await self.fetch_from_gmail(organization_id, payload.gmail_connection_id, created_by)
        connections = await self.connection_repo.list_by_organization(organization_id)
        if not connections:
            raise NotFoundException("GmailConnection", UUID(int=0))
        return await self.fetch_from_gmail(organization_id, connections[0].id, created_by)

    async def sync_all_connections(self, organization_id: UUID, created_by: Optional[UUID]) -> list[EmailSyncResultResponse]:
        results: list[EmailSyncResultResponse] = []
        for connection in await self.connection_repo.list_by_organization(organization_id):
            results.append(await self.fetch_from_gmail(organization_id, connection.id, created_by))
        return results

    async def get_email(self, organization_id: UUID, email_id: UUID) -> Email:
        email = await self.email_repo.get_by_id_in_org(organization_id, email_id)
        if not email:
            raise NotFoundException("Email", email_id)
        return email

    async def list_emails(
        self,
        organization_id: UUID,
        search: Optional[str],
        direction: Optional[EmailDirection],
        thread_id: Optional[str],
        external_entity_type: Optional[str],
        external_entity_id: Optional[UUID],
        page: int,
        page_size: int,
        sort_order: SortOrder = SortOrder.DESC,
    ) -> Tuple[list[Email], int]:
        return await self.email_repo.list_by_organization(
            organization_id,
            search,
            direction.value if direction else None,
            thread_id,
            external_entity_type,
            external_entity_id,
            page,
            page_size,
            sort_order=sort_order,
        )

    async def get_contact_history(
        self,
        organization_id: UUID,
        contact_id: UUID,
        search: Optional[str],
        page: int,
        page_size: int,
        sort_order: SortOrder = SortOrder.DESC,
    ) -> Tuple[list[Email], int]:
        return await self.email_repo.list_entity_history(
            organization_id,
            "contact",
            contact_id,
            search,
            page,
            page_size,
            sort_order=sort_order,
        )

    async def get_deal_history(
        self,
        organization_id: UUID,
        deal_id: UUID,
        search: Optional[str],
        page: int,
        page_size: int,
        sort_order: SortOrder = SortOrder.DESC,
    ) -> Tuple[list[Email], int]:
        return await self.email_repo.list_entity_history(
            organization_id,
            "deal",
            deal_id,
            search,
            page,
            page_size,
            sort_order=sort_order,
        )

    async def get_thread_history(self, organization_id: UUID, thread_id: str) -> EmailThreadResponse:
        emails = await self.email_repo.list_thread_history(organization_id, thread_id)
        return EmailThreadResponse(
            thread_id=thread_id,
            emails=[EmailResponse.model_validate(email) for email in emails],
        )

    async def email_history_page(
        self,
        organization_id: UUID,
        entity_type: Optional[str],
        entity_id: Optional[UUID],
        search: Optional[str],
        page: int,
        page_size: int,
        direction: Optional[EmailDirection] = None,
        thread_id: Optional[str] = None,
        sort_order: SortOrder = SortOrder.DESC,
    ) -> EmailHistoryResponse:
        if entity_type and entity_id:
            records, total = await self.email_repo.list_entity_history(
                organization_id,
                entity_type,
                entity_id,
                search,
                page,
                page_size,
                sort_order=sort_order,
            )
        else:
            records, total = await self.list_emails(
                organization_id,
                search,
                direction,
                thread_id,
                entity_type,
                entity_id,
                page,
                page_size,
                sort_order=sort_order,
            )
        return EmailHistoryResponse(
            total=total,
            page=page,
            page_size=page_size,
            records=[EmailResponse.model_validate(record) for record in records],
        )

    async def get_by_id_response(self, organization_id: UUID, email_id: UUID) -> EmailDetailResponse:
        email = await self.get_email(organization_id, email_id)
        return EmailDetailResponse.model_validate(email)



