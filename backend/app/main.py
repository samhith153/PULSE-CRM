"""
KALNET PULSE CRM - FastAPI Application Factory
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
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
import subprocess
import sys
import os

scheduler = AsyncIOScheduler()

def recompute_features():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    result = subprocess.run(
        [sys.executable, os.path.join(project_root, "..", "ai", "pipeline", "export_real_features.py"),
         "--org-id", "2122315f-b7d3-4628-8dfd-4be3a7e905b9"],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print("Feature recompute failed:", result.stderr)
    else:
        print("Feature recompute completed.")
@asynccontextmanager
async def lifespan(app: FastAPI):
    register_default_consumers()
    logger.info(...)  # your existing startup lines stay here

    scheduler.add_job(recompute_features, "interval", minutes=5)
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
