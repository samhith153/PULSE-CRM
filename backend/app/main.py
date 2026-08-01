"""
KALNET PULSE CRM - FastAPI Application Factory
"""
import os
import sys

# Monorepo layout: the `ai` package lives at the repository root, while this
# service is run from `backend/` (Render uses rootDir: backend). Ensure the
# repository root is on sys.path so `import ai...` resolves both locally and
# in production, instead of failing with ModuleNotFoundError at import time.
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

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
from app.services.event_worker import EventWorker

setup_logging(level=settings.LOG_LEVEL, fmt=settings.LOG_FORMAT)
logger = get_logger(__name__)

from apscheduler.schedulers.asyncio import AsyncIOScheduler
import sys
import os

scheduler = AsyncIOScheduler()
event_worker = EventWorker()


async def process_event_outbox():
    try:
        processed = await event_worker.run_once(batch_size=100)
        if processed:
            logger.info("Event outbox: processed %d event(s).", processed)
    except Exception as exc:
        logger.warning("Event outbox processing failed: %s", exc)

def recompute_features():
    from app.services.feature_recompute_service import recompute_lead_features

    try:
        from app.database.connection import engine
        from sqlalchemy import text
        import asyncio

        async def _get_org_ids():
            async with engine.connect() as conn:
                result = await conn.execute(text("SELECT DISTINCT id FROM organizations"))
                return [str(row[0]) for row in result]

        org_ids = asyncio.run(_get_org_ids())
    except Exception as exc:
        logger.warning("Failed to fetch organization IDs: %s", exc)
        return

    for org_id in org_ids:
        ok = recompute_lead_features(org_id)
        if not ok:
            logger.warning("Feature recompute failed for org %s.", org_id)
        else:
            logger.info("Feature recompute completed for org %s.", org_id)

        # After feature vectors are updated, re-run scoring for all leads
        try:
            import asyncio as _asyncio
            from uuid import UUID as _UUID
            from app.database.connection import AsyncSessionFactory
            from app.models.lead import Lead
            from app.services.lead_scoring_service import LeadScoringService
            from sqlalchemy import select as _select

            async def _rescore_all():
                async with AsyncSessionFactory() as db:
                    result = await db.execute(
                        _select(Lead.id).where(
                            Lead.organization_id == _UUID(org_id),
                            Lead.is_active.is_(True),
                            Lead.is_deleted.is_(False),
                        )
                    )
                    lead_ids = [row[0] for row in result.all()]
                    svc = LeadScoringService(db)
                    scored = 0
                    for lid in lead_ids:
                        try:
                            ls = await svc.compute_and_store_scores(lid, _UUID(org_id))
                            if ls:
                                scored += 1
                        except Exception:
                            pass
                    await db.commit()
                    return scored

            scored_count = _asyncio.run(_rescore_all())
            logger.info("Rescored %d leads for org %s.", scored_count, org_id)
        except Exception as exc:
            logger.warning("Rescoring failed for org %s: %s", org_id, exc)

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
    logger.info(...)  # your existing startup lines stay here

    scheduler.add_job(recompute_features, "interval", minutes=5)
    scheduler.add_job(process_event_outbox, "interval", seconds=15)
    scheduler.add_job(poll_gmail_replies, "interval", minutes=5)
    scheduler.start()

    yield

    scheduler.shutdown()
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
