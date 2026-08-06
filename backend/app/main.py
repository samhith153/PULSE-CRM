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
from app.middlewares.rate_limit import RateLimitMiddleware
from app.middlewares.request_id import RequestIDMiddleware
from app.services.event_bus import register_default_consumers

setup_logging(level=settings.LOG_LEVEL, fmt=settings.LOG_FORMAT)
logger = get_logger(__name__)

from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()
event_worker = EventWorker()


async def process_event_outbox():
    try:
        processed = await event_worker.run_once(batch_size=100)
        if processed:
            logger.info("Event outbox: processed %d event(s).", processed)
    except Exception as exc:
        logger.warning("Event outbox processing failed: %s", exc)


async def daily_lead_assessment():
    """Daily batch job: reassess leads whose decay changed or who missed scoring.
    Runs via APScheduler cron at 12:00 AM. Uses the same unified pipeline.
    """
    from app.services.ai_pipeline import run_lead_assessment
    from app.services.email_analytics import EmailStatsService
    from app.database.connection import AsyncSessionFactory
    from app.models.lead import Lead
    from app.models.lead_score import LeadScore
    from app.models.feature_vector import FeatureVector
    from app.utils.stage_maps import BUYING_STAGE_SCORES
    from sqlalchemy import select, text
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
                # Get active leads with their scores and feature vectors
                stmt = (
                    select(Lead.id, Lead.status, LeadScore.id.label("score_id"),
                           LeadScore.scored_at, FeatureVector.engagement_decay_penalty)
                    .outerjoin(LeadScore, (LeadScore.lead_id == Lead.id) & (LeadScore.organization_id == Lead.organization_id))
                    .outerjoin(FeatureVector, (FeatureVector.lead_id == Lead.id) & (FeatureVector.organization_id == Lead.organization_id))
                    .where(
                        Lead.organization_id == UUID(org_id),
                        Lead.is_active.is_(True),
                        Lead.is_deleted.is_(False),
                    )
                )
                result = await db.execute(stmt)
                leads = result.all()

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
                        email_svc = EmailStatsService(db)
                        stats = await email_svc.get_lead_email_stats(lead_id, UUID(org_id))
                        last_inbound = stats["last_inbound_at"]
                        if last_inbound:
                            from datetime import datetime, timezone
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
                        from app.models.email import Email
                        from sqlalchemy import desc
                        stmt_latest = (
                            select(Email.sent_at)
                            .where(
                                Email.organization_id == UUID(org_id),
                                Email.external_entity_type == "lead",
                                Email.external_entity_id == lead_id,
                                Email.direction == "inbound",
                                Email.is_active.is_(True),
                            )
                            .order_by(desc(Email.sent_at))
                            .limit(1)
                        )
                        result_latest = await db.execute(stmt_latest)
                        latest_inbound = result_latest.scalar_one_or_none()
                        if latest_inbound and scored_at and latest_inbound > scored_at:
                            needs_assessment = True

                    if needs_assessment:
                        try:
                            await run_lead_assessment(
                                db, lead_id, UUID(org_id), None,
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


async def poll_gmail_replies():
    """Poll connected Gmail accounts for new inbound messages / replies."""
    from sqlalchemy import select

    from app.database.connection import AsyncSessionFactory
    from app.models.email import GmailConnection
    from app.services.email_service import EmailService

    try:
        async with AsyncSessionFactory() as db:
            result = await db.execute(
                select(GmailConnection).where(GmailConnection.is_active.is_(True))
            )
            connections = list(result.scalars().all())
            if not connections:
                return
            svc = EmailService(db)
            for organization_id in {c.organization_id for c in connections}:
                try:
                    await svc.sync_all_connections(organization_id, None)
                    await db.commit()
                except Exception as exc:
                    await db.rollback()
                    logger.warning("Gmail polling failed for org %s: %s", organization_id, exc)
    except Exception as exc:
        logger.warning("Gmail polling failed: %s", exc)


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
    scheduler.add_job(process_event_outbox, "interval", seconds=15)
    scheduler.add_job(poll_gmail_replies, "interval", minutes=5)
    scheduler.start()

    yield
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
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.cors_methods_list,
        allow_headers=settings.cors_headers_list,
        expose_headers=["*"],
    )
    app.add_middleware(PrivateNetworkAccessMiddleware)

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
