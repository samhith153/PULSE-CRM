"""
KALNET PULSE CRM - FastAPI Application Factory
"""
import asyncio

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import PulseCRMException
from app.core.logging import get_logger, setup_logging
from app.middlewares.exception_handler import (
    generic_exception_handler,
    http_exception_handler,
    pulse_exception_handler,
    validation_exception_handler,
)
from app.middlewares.logging import RequestLoggingMiddleware
from app.middlewares.private_network import PrivateNetworkAccessMiddleware
from app.middlewares.rate_limit import AuthRateLimitMiddleware, RateLimitMiddleware, SecurityHeadersMiddleware
from app.middlewares.request_id import RequestIDMiddleware
from app.services.event_bus import register_default_consumers
from app.services.event_worker import EventWorker

setup_logging(level=settings.LOG_LEVEL, fmt=settings.LOG_FORMAT)
logger = get_logger(__name__)

from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()
event_worker = EventWorker()


_outbox_backoff: int = 0

async def process_event_outbox():
    global _outbox_backoff
    try:
        processed = await event_worker.run_once(batch_size=50)
        if processed:
            logger.info("Event outbox: processed %d event(s).", processed)
        _outbox_backoff = 0
    except Exception as exc:
        _outbox_backoff = min(_outbox_backoff + 5, 60)
        logger.warning("Event outbox processing failed: %s (backoff %ds)", exc, _outbox_backoff)
        await asyncio.sleep(_outbox_backoff)


async def refresh_gmail_watches():
    """Re-establish Gmail Pub/Sub watches for all active connections.
    Runs on startup and every 6 hours via APScheduler.
    """
    from app.database.connection import AsyncSessionFactory
    from app.services.email_service import EmailService

    try:
        async with AsyncSessionFactory() as db:
            service = EmailService(db)
            refreshed = await service.refresh_watch_for_all_connections()
            await db.commit()
            return refreshed
    except Exception as exc:
        logger.warning("Gmail watch refresh failed: %s", exc)
        return 0


async def daily_lead_assessment():
    """Daily batch job: reassess leads whose decay changed or who missed scoring.
    Runs via APScheduler cron at 12:00 AM. Uses the same unified pipeline.

    Optimizations:
    - Batch-fetches email stats for all leads in a single DB query instead of
      one query per lead (reduces N+1 → 1 query).
    - Batch-fetches latest inbound timestamps for all leads in a single query.
    """
    from datetime import datetime, timezone
    from app.services.ai_pipeline import run_lead_assessment
    from app.services.email_analytics import EmailStatsService
    from app.database.connection import AsyncSessionFactory
    from app.models.lead import Lead
    from app.models.lead_score import LeadScore
    from app.models.feature_vector import FeatureVector
    from app.models.email import Email
    from sqlalchemy import desc, func, select, text
    from uuid import UUID

    try:
        async with AsyncSessionFactory() as db:
            result = await db.execute(text("SELECT DISTINCT id FROM organizations"))
            org_ids = [str(row[0]) for row in result]
    except Exception as exc:
        logger.warning("Failed to fetch organization IDs: %s", exc)
        return

    for org_id in org_ids:
        try:
            async with AsyncSessionFactory() as db:
                uuid_org = UUID(org_id)
                # Get active leads with their scores and feature vectors
                stmt = (
                    select(Lead.id, Lead.status, LeadScore.id.label("score_id"),
                           LeadScore.scored_at, FeatureVector.engagement_decay_penalty)
                    .outerjoin(LeadScore, (LeadScore.lead_id == Lead.id) & (LeadScore.organization_id == Lead.organization_id))
                    .outerjoin(FeatureVector, (FeatureVector.lead_id == Lead.id) & (FeatureVector.organization_id == Lead.organization_id))
                    .where(
                        Lead.organization_id == uuid_org,
                        Lead.is_active.is_(True),
                        Lead.is_deleted.is_(False),
                    )
                )
                result = await db.execute(stmt)
                leads = result.all()

                lead_ids = [lead_row.id for lead_row in leads]

                # ── Batch email stats (1 query instead of N) ─────────────
                email_svc = EmailStatsService(db)
                all_email_stats = await email_svc.batch_get_lead_email_stats(lead_ids, uuid_org)

                # ── Batch latest inbound timestamps (1 query instead of N) ─
                latest_inbound_stmt = (
                    select(Email.external_entity_id, func.max(Email.sent_at).label("latest_inbound_at"))
                    .where(
                        Email.organization_id == uuid_org,
                        Email.external_entity_type == "lead",
                        Email.external_entity_id.in_(lead_ids),
                        Email.direction == "inbound",
                        Email.is_active.is_(True),
                    )
                    .group_by(Email.external_entity_id)
                )
                latest_inbound_result = await db.execute(latest_inbound_stmt)
                latest_inbound_map = {
                    row[0]: row[1] for row in latest_inbound_result
                }

                assessed = 0
                for lead_row in leads:
                    lead_id = lead_row.id
                    scored_at = lead_row.scored_at
                    stored_decay = lead_row.engagement_decay_penalty

                    needs_assessment = False

                    # (a) Never scored
                    if scored_at is None:
                        needs_assessment = True

                    if not needs_assessment:
                        # (b) Decay changed: compute current days_since_last_inbound
                        stats = all_email_stats.get(lead_id, {})
                        last_inbound = stats.get("last_inbound_at")
                        if last_inbound:
                            now = datetime.now(timezone.utc)
                            if last_inbound.tzinfo is None:
                                last_inbound = last_inbound.replace(tzinfo=timezone.utc)
                            days = (now - last_inbound).days
                            # Compute current decay penalty
                            if days <= 3:
                                current_decay = 0
                            elif days <= 7:
                                current_decay = -5
                            elif days <= 14:
                                current_decay = -10
                            elif days <= 30:
                                current_decay = -20
                            else:
                                current_decay = -30
                            if current_decay != (stored_decay or 0):
                                needs_assessment = True

                    if not needs_assessment:
                        # (c) Missed event: latest inbound newer than scored_at
                        latest_inbound = latest_inbound_map.get(lead_id)
                        if latest_inbound and scored_at and latest_inbound > scored_at:
                            needs_assessment = True

                    if needs_assessment:
                        try:
                            await run_lead_assessment(
                                db, lead_id, uuid_org, None,
                                trigger="daily_refresh",
                            )
                            assessed += 1
                        except Exception as exc:
                            logger.warning(
                                "Daily assessment failed for lead %s: %s", lead_id, exc
                            )

                await db.commit()
                logger.info("Daily assessment: %d leads reassessed for org %s", assessed, org_id)
        except Exception as exc:
            logger.warning("Daily assessment failed for org %s: %s", org_id, exc)



@asynccontextmanager
async def lifespan(app: FastAPI):
    register_default_consumers()
    logger.info(
        "Starting %s v%s [%s]",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.ENVIRONMENT,
    )
    logger.info("Application starting")

    scheduler.add_job(daily_lead_assessment, "cron", hour=0, minute=0)
    scheduler.add_job(process_event_outbox, "interval", seconds=30, max_instances=1, misfire_grace_time=60)
    scheduler.add_job(refresh_gmail_watches, "interval", hours=6, max_instances=1, misfire_grace_time=300)
    scheduler.start()

    # Re-establish Gmail Pub/Sub watches on startup
    await refresh_gmail_watches()

    # Health-check: verify AI service is reachable on startup
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as hc:
            resp = await hc.get(f"{settings.AI_SERVICE_URL}/health")
            if resp.status_code == 200:
                logger.info("AI service reachable at %s", settings.AI_SERVICE_URL)
            else:
                logger.warning("AI service returned %d at %s — scoring/recommendations may fail", resp.status_code, settings.AI_SERVICE_URL)
    except Exception as exc:
        logger.warning("AI service NOT reachable at %s — scoring/recommendations will be unavailable: %s", settings.AI_SERVICE_URL, exc)

    yield
    scheduler.shutdown(wait=False)
    from app.services.ai_client import close_shared_client
    await close_shared_client()
    logger.info("Application shutdown complete.")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description=settings.APP_DESCRIPTION,
        version=settings.APP_VERSION,
        docs_url=settings.DOCS_URL if not settings.is_production else None,
        redoc_url=settings.REDOC_URL if not settings.is_production else None,
        openapi_url=settings.OPENAPI_URL if not settings.is_production else None,
        lifespan=lifespan,
    )

    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(AuthRateLimitMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(PrivateNetworkAccessMiddleware)
    # CORSMiddleware registered LAST so it is outermost: rate-limit 429
    # responses (which bypass inner middlewares) still receive correct,
    # credentials-aware CORS headers instead of a hand-rolled "*" policy.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.cors_methods_list,
        allow_headers=settings.cors_headers_list,
        expose_headers=["*"],
    )

    app.add_exception_handler(PulseCRMException, pulse_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    app.mount("/uploads", StaticFiles(directory=settings.LOCAL_STORAGE_PATH), name="uploads")

    @app.get("/", include_in_schema=False)
    async def root():
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": settings.DOCS_URL,
        }

    return app


app = create_app()
