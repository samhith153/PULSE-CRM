"""Gmail integration service plus transactional SMTP email helpers."""
from __future__ import annotations

import asyncio
import re
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

from sqlalchemy import func
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

# ── Background-task infrastructure ──────────────────────────────────────
# Holds references to fire-and-forget tasks so the garbage collector
# does not cancel them mid-flight.
_background_tasks: set[asyncio.Task] = set()  # noqa: F811


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
        import base64, json
        payload = base64.urlsafe_b64encode(json.dumps({
            "org": str(organization_id),
            "user": str(created_by),
        }).encode()).decode()
        return GmailOAuthLoginResponse(authorization_url=self.gmail_client.authorization_url(payload), state=payload)

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

        # Deactivate any existing active connection for this email in this org
        deactivated = await self.connection_repo.deactivate_by_email(organization_id, str(email_address))
        if deactivated:
            logger.info("Deactivated %d existing Gmail connection(s) for %s", deactivated, email_address)

        sync_cursor = None
        if settings.GOOGLE_PUBSUB_TOPIC:
            try:
                watch_response = await self.gmail_client.watch(
                    access_token=access_token,
                    topic_name=settings.GOOGLE_PUBSUB_TOPIC,
                )
                sync_cursor = watch_response.get("historyId")
                logger.info("Gmail watch started for %s, historyId=%s", email_address, sync_cursor)
            except Exception as exc:
                logger.warning("Gmail watch failed for %s: %s", email_address, exc)

        return await self.connect_gmail(
            organization_id=organization_id,
            created_by=created_by,
            user_id=created_by,
            email_address=str(email_address),
            access_token_encrypted=access_token,
            refresh_token_encrypted=refresh_token,
            token_expires_at=self.gmail_client.token_expiry(token_response),
            sync_cursor=sync_cursor,
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

    async def refresh_watch_for_all_connections(self) -> int:
        """Re-establish Gmail Pub/Sub watches for all active connections.

        Called on application startup and periodically to ensure notifications
        keep flowing after server restarts or watch expiration (~7 days).
        Returns the number of successfully refreshed watches.
        """
        if not settings.GOOGLE_PUBSUB_TOPIC:
            logger.warning("GOOGLE_PUBSUB_TOPIC not configured, skipping watch refresh")
            return 0

        connections = await self.connection_repo.list_all_active()
        refreshed = 0
        for conn in connections:
            try:
                access_token = await self._access_token_for_connection(
                    conn.organization_id, conn.user_id, conn
                )
                watch_response = await self.gmail_client.watch(
                    access_token=access_token,
                    topic_name=settings.GOOGLE_PUBSUB_TOPIC,
                )
                new_history_id = watch_response.get("historyId")
                if new_history_id:
                    conn.sync_cursor = new_history_id
                conn.sync_status = "active"
                refreshed += 1
                logger.info("Gmail watch refreshed for %s, historyId=%s", conn.email_address, new_history_id)
            except Exception as exc:
                logger.warning("Gmail watch refresh failed for %s: %s", conn.email_address, exc)

        if refreshed:
            await self.db.flush()
        logger.info("Gmail watch refresh: %d/%d connections refreshed", refreshed, len(connections))
        return refreshed

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

        # Sequential inbound processing: summarize FIRST, then assess
        if ingested:
            # Group inbound threads by lead_id for sequential processing
            lead_threads: dict[UUID, set[str]] = {}
            standalone_threads: set[str] = set()
            for e in ingested:
                if e.thread_id and e.direction == EmailDirection.INBOUND.value:
                    if (
                        e.external_entity_type == "lead"
                        and e.external_entity_id
                    ):
                        lead_threads.setdefault(e.external_entity_id, set()).add(e.thread_id)
                    else:
                        standalone_threads.add(e.thread_id)

            # Summarize threads not linked to any lead
            for tid in standalone_threads:
                task = asyncio.create_task(
                    self._safe_summarize(organization_id, tid)
                )
                _background_tasks.add(task)
                task.add_done_callback(_background_tasks.discard)

            # For lead-linked threads: summarize then assess (sequential)
            for lid, tids in lead_threads.items():
                task = asyncio.create_task(
                    self._summarize_and_assess(organization_id, lid, tids)
                )
                _background_tasks.add(task)
                task.add_done_callback(_background_tasks.discard)

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

        logger.info("[INGEST_EMAIL] Creating email: gmail_message_id=%s direction=%s sender=%s subject=%s entity_type=%s entity_id=%s body_preview=%s", gmail_message_id, direction, sender, subject, external_entity_type, external_entity_id, (body_preview or "")[:200])
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

        # Commit the email row so fresh-session background tasks (summarize/assess)
        # can see it — otherwise the new email is invisible to the assessment.
        await self.db.commit()

        if direction == EmailDirection.INBOUND:
            await self.events.record_event(
                EventType.EMAIL_RECEIVED,
                organization_id=organization_id,
                actor_id=created_by,
                aggregate_type="email",
                aggregate_id=str(email.id),
                source="gmail" if gmail_connection_id else "smtp",
                payload={
                    "email_id": str(email.id),
                    "gmail_message_id": gmail_message_id,
                    "thread_id": thread_id,
                    "subject": subject,
                    "body_preview": body_preview,
                    "external_entity_type": external_entity_type,
                    "external_entity_id": str(external_entity_id) if external_entity_id else None,
                },
            )
            # Best-effort: never let an assessment failure break email storage.
            # Summarize thread first, then assess only for lead-linked emails.
            if external_entity_type == "lead" and external_entity_id is not None:
                thread_ids = {thread_id} if thread_id else set()
                logger.info("[INGEST] Lead-linked inbound email: lead=%s thread=%s entity_type=%s — triggering summarize+assess", external_entity_id, thread_id, external_entity_type)
                task = asyncio.create_task(
                    self._summarize_and_assess(organization_id, external_entity_id, thread_ids)
                )
                _background_tasks.add(task)
                task.add_done_callback(_background_tasks.discard)
            elif thread_id:
                logger.info("[INGEST] Standalone inbound email (no lead link): thread=%s — summarizing only", thread_id)
                task = asyncio.create_task(
                    self._safe_summarize(organization_id, thread_id)
                )
                _background_tasks.add(task)
                task.add_done_callback(_background_tasks.discard)
        elif direction == EmailDirection.OUTBOUND:
            # Also run assessment for outbound emails linked to a lead
            if external_entity_type == "lead" and external_entity_id is not None:
                logger.info("[INGEST] Lead-linked outbound email: lead=%s thread=%s — triggering assess", external_entity_id, thread_id)
                task = asyncio.create_task(
                    self._run_assessment_background(
                        organization_id, external_entity_id, trigger="outbound_email"
                    )
                )
                _background_tasks.add(task)
                task.add_done_callback(_background_tasks.discard)
        elif is_read:

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

    async def _safe_summarize(self, organization_id: UUID, thread_id: str) -> Optional[str]:
        try:
            from app.core.concurrency import assessment_semaphore
            from app.database.connection import AsyncSessionFactory
            from app.services.email_summary_service import EmailSummaryService

            async with assessment_semaphore:
                async with AsyncSessionFactory() as db:
                    svc = EmailSummaryService(db)
                    result = await svc.summarize_thread(organization_id, thread_id)
                    if result:
                        await db.commit()
                        intent = result.summary_word or result.intent
                        logger.info("[SAFE_SUMMARIZE] Summarized thread %s — intent=%s summary_word=%s", thread_id, result.intent, result.summary_word)
                        return intent
                    else:
                        logger.warning("No summary generated for thread %s (empty or no emails)", thread_id)
                        return None
        except Exception:
            logger.exception("Email summarization failed for thread %s", thread_id)
            return None

    async def _summarize_and_assess(
        self, organization_id: UUID, lead_id: UUID, thread_ids: set[str]
    ) -> None:
        try:
            logger.info("[SUMMARIZE_ASSESS] Starting for lead=%s org=%s threads=%s", lead_id, organization_id, thread_ids)
            # Step 1: Summarize all inbound threads for this lead, collect intent
            latest_intent = None
            for tid in thread_ids:
                logger.info("[SUMMARIZE_ASSESS] Summarizing thread %s for lead %s", tid, lead_id)
                intent = await self._safe_summarize(organization_id, tid)
                if intent:
                    latest_intent = intent
                logger.info("[SUMMARIZE_ASSESS] Finished summarizing thread %s — intent=%s", tid, intent)

            # Step 2: Run assessment with the intent we just got
            logger.info("[SUMMARIZE_ASSESS] Running assessment for lead=%s intent=%s", lead_id, latest_intent)
            await self._run_assessment_background(
                organization_id, lead_id, trigger="inbound_email", intent=latest_intent
            )
            logger.info("[SUMMARIZE_ASSESS] Assessment completed for lead=%s", lead_id)
        except Exception:
            logger.exception("Summarize+assess failed for lead %s", lead_id)

    async def _run_assessment_background(
        self, organization_id: UUID, lead_id: UUID, trigger: str = "inbound_email", intent: Optional[str] = None
    ) -> None:
        """Run the unified assessment pipeline in a background task."""
        _MAX_RETRIES = 3
        _RETRY_DELAY = 0.8

        for attempt in range(_MAX_RETRIES):
            try:
                from app.core.concurrency import assessment_semaphore
                from app.database.connection import AsyncSessionFactory
                from app.services.ai_pipeline import run_lead_assessment

                logger.info("[ASSESS_BG] Starting assessment for lead=%s org=%s trigger=%s intent=%s attempt=%d", lead_id, organization_id, trigger, intent, attempt + 1)
                async with assessment_semaphore:
                    async with AsyncSessionFactory() as db:
                        result = await run_lead_assessment(db, lead_id, organization_id, created_by=None, trigger=trigger, intent=intent)
                        if result:
                            await db.commit()
                            logger.info("[ASSESS_BG] Assessment persisted for lead=%s engagement=%s overall=%s",
                                lead_id,
                                result.get("engagement", {}).get("score"),
                                result.get("overall", {}).get("score"),
                            )
                            return
                        # result is None — email rows or lead may not be committed yet; retry
                        if attempt < _MAX_RETRIES - 1:
                            logger.info("[ASSESS_BG] lead %s assessment returned None (attempt %d/%d), retrying in %.1fs", lead_id, attempt + 1, _MAX_RETRIES, _RETRY_DELAY)
                            await asyncio.sleep(_RETRY_DELAY)
            except Exception:
                logger.exception("Background assessment failed for lead %s (attempt %d)", lead_id, attempt + 1)
                return
        logger.warning("[ASSESS_BG] lead %s assessment skipped after %d attempts", lead_id, _MAX_RETRIES)


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
        Send an email through Gmail API and persist it in the CRM.
        """
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        connection = await self.connection_repo.get_by_id_in_org(
            organization_id,
            gmail_connection_id,
        )

        if not connection:
            raise NotFoundException(
                "GmailConnection",
                gmail_connection_id,
            )

        access_token = await self._access_token_for_connection(
            organization_id, created_by, connection
        )

        sender_email = connection.email_address

        msg = MIMEMultipart("alternative")
        msg["From"] = sender_email
        msg["To"] = receiver
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))
        msg.attach(MIMEText(html_body, "plain"))

        raw_mime = msg.as_string()

        gmail_response = await self.gmail_client.send_message(access_token, raw_mime)

        message_id = gmail_response.get("id", str(uuid4()))
        thread_id = gmail_response.get("threadId", message_id)

        # Auto-link the outbound email to a lead by matching the recipient
        # (compose modal may not pass entity info). Case-insensitive match.
        if not external_entity_type or not external_entity_id:
            from sqlalchemy import select as sa_outbound_select
            from app.models.lead import Lead
            recipient_email = parseaddr(receiver)[1] or receiver
            if recipient_email:
                o_row = (
                    await self.db.execute(
                        sa_outbound_select(Lead.id)
                        .where(
                            Lead.organization_id == organization_id,
                            func.lower(Lead.email) == recipient_email.lower(),
                            Lead.is_active.is_(True),
                        )
                        .limit(1)
                    )
                ).first()
                if o_row:
                    external_entity_type = "lead"
                    external_entity_id = o_row[0]

        email, _ = await self.ingest_email(
            organization_id=organization_id,
            created_by=created_by,
            gmail_connection_id=gmail_connection_id,
            gmail_message_id=message_id,
            thread_id=thread_id,
            direction=EmailDirection.OUTBOUND,
            sender=sender_email,
            receiver=receiver,
            subject=subject,
            body_preview=html_body[:500],
            sent_at=datetime.now(timezone.utc),
            attachment_metadata=[],
            raw_payload={
                "provider": "gmail_api",
                "status": "sent",
                "gmail_message_id": message_id,
                "gmail_thread_id": thread_id,
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

        cursor = connection.sync_cursor
        if cursor and cursor.isdigit():
            try:
                return await self._incremental_sync_from_gmail(
                    organization_id, created_by, connection, access_token, cursor,
                )
            except Exception as exc:
                logger.warning(
                    "Incremental sync failed (stale historyId?), falling back to full list: %s",
                    exc,
                )
                connection.sync_cursor = None
                await self.connection_repo.update(connection, sync_cursor=None)

        try:
            listed = await self.gmail_client.list_messages(access_token, page_token=None, max_results=500)
        except Exception as exc:
            logger.warning("Gmail list_messages failed: %s", exc)
            raise

        messages = []
        for item in listed.get("messages", []):
            try:
                raw_message = await self.gmail_client.get_message(access_token, item["id"])
                messages.append(self._gmail_message_to_sync(connection, raw_message))
            except Exception as exc:
                logger.warning("Skipping Gmail message after fetch failure", extra={"message_id": item.get("id"), "error": str(exc)})

        from app.models.lead import Lead
        from sqlalchemy import select as sa_select
        for msg in messages:
            if msg.direction == EmailDirection.INBOUND.value and not msg.external_entity_id:
                sender_email = parseaddr(msg.sender)[1] if msg.sender else None
                if sender_email:
                    stmt = (
                        sa_select(Lead.id, Lead.contact_id)
                        .where(Lead.organization_id == organization_id, func.lower(Lead.email) == sender_email.lower(), Lead.is_active.is_(True))
                        .limit(1)
                    )
                    row = (await self.db.execute(stmt)).first()
                    if row:
                        msg.external_entity_type = "lead"
                        msg.external_entity_id = row[0]
                    else:
                        from app.models.contact import Contact
                        c_stmt = (
                            sa_select(Contact.id)
                            .where(Contact.organization_id == organization_id, func.lower(Contact.email) == sender_email.lower())
                            .limit(1)
                        )
                        c_row = (await self.db.execute(c_stmt)).first()
                        if c_row:
                            l_stmt = (
                                sa_select(Lead.id)
                                .where(Lead.organization_id == organization_id, Lead.contact_id == c_row[0], Lead.is_active.is_(True))
                                .limit(1)
                            )
                            l_row = (await self.db.execute(l_stmt)).first()
                            if l_row:
                                msg.external_entity_type = "lead"
                                msg.external_entity_id = l_row[0]

        history_id = listed.get("historyId")
        payload = EmailSyncRequest(
            gmail_connection_id=connection.id,
            sync_cursor=history_id or connection.sync_cursor,
            messages=messages,
        )
        return await self.sync_messages(organization_id, created_by, payload)

    async def _ingest_gmail_message(
        self,
        organization_id: UUID,
        created_by: Optional[UUID],
        connection: GmailConnection,
        msg: dict,
    ) -> tuple[Email | None, bool]:
        """Reply-match a single Gmail message and ingest it against the original.

        Returns (email, created); (None, False) when no matching original is found.
        """
        headers = headers_map(msg)
        msg_id = msg.get("id")
        thread_id = msg.get("threadId")
        from_email = parseaddr(headers.get("from", ""))[1]
        subject = headers.get("subject", "")
        logger.info("[REPLY_MATCH] Processing message %s thread=%s from=%s subject=%s", msg_id, thread_id, from_email, subject)

        # 1) Same Gmail thread as an outbound email — replies share the threadId
        #    of the message they answer, so this is the most reliable signal.
        original = None
        if thread_id:
            original = await self.email_repo.get_outbound_by_thread(organization_id, thread_id)
            if original:
                logger.info("[REPLY_MATCH] Strategy 1 (threadId): Found original email_id=%s thread_id=%s", original.id, original.thread_id)

        # 2) In-Reply-To / References → RFC 5322 Message-ID local part. The local
        #    part is stored on the outbound email (raw_payload) when we send it.
        if not original:
            raw_ref = headers.get("in-reply-to") or (
                headers.get("references", "").split()[-1] if headers.get("references") else ""
            )
            in_reply_to = raw_ref.strip("<>").split("@")[0] if raw_ref else ""
            if in_reply_to:
                original = await self.email_repo.get_by_raw_message_id_local(in_reply_to)
                if not original:
                    original = await self.email_repo.get_by_message_id_global(in_reply_to)
                if original:
                    logger.info("[REPLY_MATCH] Strategy 2 (In-Reply-To): Found original email_id=%s", original.id)

        # 3) Subject + participants fallback (handles clients that rewrite threads).
        if not original:
            normalized = self._normalize_subject(subject)
            original = await self.email_repo.get_latest_outbound_by_subject_and_participants(
                organization_id, normalized, from_email
            )
            if original:
                logger.info("[REPLY_MATCH] Strategy 3 (subject+participants): Found original email_id=%s", original.id)

        if not original:
            logger.info("[REPLY_MATCH] No matching original found for message %s — returning (None, False)", msg_id)
            return None, False

        merged = dict(original.raw_payload or {})
        merged["status"] = "replied"
        merged.setdefault("events", []).append({"event": "replied", "gmail_message_id": msg["id"]})
        original.raw_payload = merged

        body_preview = decode_gmail_body(msg.get("payload", {})) or msg.get("snippet", "")

        entity_type = original.external_entity_type
        entity_id = original.external_entity_id

        # If the original outbound has no entity link (e.g. sent from compose
        # modal without passing entity info), try to match the inbound sender
        # to a lead so the assessment pipeline can run.
        if not entity_type or not entity_id:
            from_email = parseaddr(headers.get("from", ""))[1]
            if from_email:
                from sqlalchemy import select as sa_select2
                from app.models.lead import Lead
                stmt = (
                    sa_select2(Lead.id, Lead.contact_id)
                    .where(Lead.organization_id == organization_id, func.lower(Lead.email) == from_email.lower(), Lead.is_active.is_(True))
                    .limit(1)
                )
                row = (await self.db.execute(stmt)).first()
                if row:
                    entity_type = "lead"
                    entity_id = row[0]
                else:
                    from app.models.contact import Contact
                    c_stmt = (
                        sa_select2(Contact.id)
                        .where(Contact.organization_id == organization_id, func.lower(Contact.email) == from_email.lower())
                        .limit(1)
                    )
                    c_row = (await self.db.execute(c_stmt)).first()
                    if c_row:
                        l_stmt = (
                            sa_select2(Lead.id)
                            .where(Lead.organization_id == organization_id, Lead.contact_id == c_row[0], Lead.is_active.is_(True))
                            .limit(1)
                        )
                        l_row = (await self.db.execute(l_stmt)).first()
                        if l_row:
                            entity_type = "lead"
                            entity_id = l_row[0]
            if not entity_type:
                logger.info("[INGEST_GMAIL] No lead match for sender %s — inbound email will have no entity link", from_email)

        return await self.ingest_email(
            organization_id=organization_id,
            created_by=created_by,
            gmail_connection_id=connection.id,
            gmail_message_id=msg["id"],
            thread_id=original.thread_id,
            direction=EmailDirection.INBOUND,
            sender=headers.get("from", ""),
            receiver=headers.get("to", ""),
            subject=headers.get("subject", ""),
            body_preview=body_preview[:2000],
            sent_at=gmail_datetime(msg),
            raw_payload=msg,
            external_entity_type=entity_type,
            external_entity_id=entity_id,
        )

    async def _incremental_sync_from_gmail(
        self,
        organization_id: UUID,
        created_by: Optional[UUID],
        connection: GmailConnection,
        access_token: str,
        start_history_id: str,
    ) -> EmailSyncResultResponse:
        """Incremental sync via the Gmail users.history API since the stored cursor."""
        message_ids: list[str] = []
        history_id: Optional[str] = None
        page_token: Optional[str] = None
        logger.info("[INBOUND_SYNC] Starting incremental sync from historyId=%s for org=%s", start_history_id, organization_id)
        while True:
            history = await self.gmail_client.list_history(
                access_token,
                start_history_id=start_history_id,
                page_token=page_token,
            )
            history_id = history.get("historyId") or history_id
            history_entries = history.get("history", []) or []
            logger.info("[INBOUND_SYNC] History API returned %d entries, historyId=%s", len(history_entries), history_id)
            for entry in history_entries:
                for group in ("messagesAdded", "messageUpdated"):
                    for item in entry.get(group, []) or []:
                        message = item.get("message") or {}
                        if message.get("id"):
                            message_ids.append(message["id"])
                            logger.info("[INBOUND_SYNC] Found message: id=%s threadId=%s labelIds=%s", message.get("id"), message.get("threadId"), message.get("labelIds"))
            page_token = history.get("nextPageToken")
            if not page_token:
                break

        logger.info("[INBOUND_SYNC] Total message IDs extracted: %d", len(message_ids))
        ingested: list[Email] = []
        skipped = 0
        for message_id in dict.fromkeys(message_ids):
            try:
                msg = await self.gmail_client.get_message(access_token, message_id)
                logger.info("[INBOUND_SYNC] Fetched message %s: labels=%s snippet=%s", message_id, msg.get("labelIds"), (msg.get("snippet") or "")[:200])
            except Exception as exc:
                logger.warning("Skipping Gmail message after fetch failure", extra={"message_id": message_id, "error": str(exc)})
                skipped += 1
                continue
            email, created = await self._ingest_gmail_message(organization_id, created_by, connection, msg)
            logger.info("[INBOUND_SYNC] _ingest_gmail_message result: email=%s created=%s", email.id if email else None, created)
            if created:
                ingested.append(email)
            elif email is None:
                headers = headers_map(msg)
                labels = set(msg.get("labelIds") or [])
                direction = EmailDirection.OUTBOUND if "SENT" in labels else EmailDirection.INBOUND
                body_preview = decode_gmail_body(msg.get("payload", {})) or msg.get("snippet", "")
                from_email = parseaddr(headers.get("from", ""))[1]
                logger.info("[INBOUND_SYNC] Fallback path: message_id=%s direction=%s from=%s subject=%s body_preview=%s", msg["id"], direction, from_email, headers.get("subject", ""), (body_preview or "")[:200])

                entity_type = None
                entity_id = None
                if from_email:
                    from sqlalchemy import select as sa_select
                    from app.models.lead import Lead
                    stmt = (
                        sa_select(Lead.id, Lead.contact_id)
                        .where(Lead.organization_id == organization_id, func.lower(Lead.email) == from_email.lower(), Lead.is_active.is_(True))
                        .limit(1)
                    )
                    row = (await self.db.execute(stmt)).first()
                    if row:
                        entity_type = "lead"
                        entity_id = row[0]
                    else:
                        from app.models.contact import Contact
                        c_stmt = (
                            sa_select(Contact.id)
                            .where(Contact.organization_id == organization_id, func.lower(Contact.email) == from_email.lower())
                            .limit(1)
                        )
                        c_row = (await self.db.execute(c_stmt)).first()
                        if c_row:
                            l_stmt = (
                                sa_select(Lead.id)
                                .where(Lead.organization_id == organization_id, Lead.contact_id == c_row[0], Lead.is_active.is_(True))
                                .limit(1)
                            )
                            l_row = (await self.db.execute(l_stmt)).first()
                            if l_row:
                                entity_type = "lead"
                                entity_id = l_row[0]

                logger.info("[INBOUND_SYNC] Entity match: entity_type=%s entity_id=%s for from=%s", entity_type, entity_id, from_email)
                logger.info("[INBOUND_SYNC] Calling ingest_email: message_id=%s thread_id=%s direction=%s subject=%s", msg["id"], msg.get("threadId"), direction, headers.get("subject", ""))
                email_record, was_created = await self.ingest_email(
                    organization_id=organization_id,
                    created_by=created_by,
                    gmail_connection_id=connection.id,
                    gmail_message_id=msg["id"],
                    thread_id=msg.get("threadId"),
                    direction=direction,
                    sender=headers.get("from", ""),
                    receiver=headers.get("to", ""),
                    subject=headers.get("subject", ""),
                    body_preview=body_preview[:2000],
                    sent_at=gmail_datetime(msg),
                    raw_payload=msg,
                    external_entity_type=entity_type,
                    external_entity_id=entity_id,
                )
                if was_created:
                    ingested.append(email_record)
                else:
                    skipped += 1
            else:
                skipped += 1

        connection.sync_cursor = (
            history_id or start_history_id
        )
        await self.connection_repo.update(
            connection, sync_cursor=connection.sync_cursor, sync_status=EmailSyncStatus.ACTIVE.value
        )
        await self.email_repo.save()

        logger.info("[INBOUND_SYNC] Sync complete: ingested=%d skipped=%d cursor=%s", len(ingested), skipped, history_id or start_history_id)

        if ingested:
            inbound_threads = {
                e.thread_id for e in ingested
                if e.thread_id and e.direction == EmailDirection.INBOUND.value
            }

            # Group inbound threads by lead_id for sequential processing
            lead_threads: dict[UUID, set[str]] = {}
            for e in ingested:
                if (
                    e.direction == EmailDirection.INBOUND.value
                    and e.external_entity_type == "lead"
                    and e.external_entity_id
                    and e.thread_id
                ):
                    lead_threads.setdefault(e.external_entity_id, set()).add(e.thread_id)

            logger.info("[INBOUND_SYNC] Lead threads to summarize+assess: %s", {str(lid): list(tids) for lid, tids in lead_threads.items()})
            for lid, tids in lead_threads.items():
                task = asyncio.create_task(
                    self._summarize_and_assess(organization_id, lid, tids)
                )
                _background_tasks.add(task)
                task.add_done_callback(_background_tasks.discard)

        return EmailSyncResultResponse(
            gmail_connection_id=connection.id,
            synced_count=len(ingested),
            skipped_count=skipped,
            next_cursor=connection.sync_cursor,
            connection_status=EmailSyncStatus.ACTIVE.value,
            emails=[EmailResponse.model_validate(item) for item in ingested],
        )

    def _normalize_subject(self, subject: str) -> str:
        # Strips repeated reply/forward markers like "Re:", "RE:", "Re[2]:",
        # "Re: Fwd: Re: ..." and locale variants ("Aw:", "Sv:").
        return re.sub(
            r"^((re|fwd|fw|aw|sv)(\s*\[\d+\])?\s*:\s*)+",
            "",
            subject.strip(),
            flags=re.IGNORECASE,
        ).lower()

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



