"""
Health Check Endpoints
Used by load balancers, Docker, and Kubernetes probes.
"""
from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import settings
from app.database.connection import check_db_connection

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    database: str


@router.get(
    "",
    response_model=HealthResponse,
    summary="System Health Check",
    description="Returns application version, environment, and database connectivity status.",
)
async def health_check() -> HealthResponse:
    db_ok = await check_db_connection()
    return HealthResponse(
        status="healthy" if db_ok else "degraded",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        database="connected" if db_ok else "unreachable",
    )


@router.get("/debug")
async def debug_health():
    from app.database.connection import engine
    from sqlalchemy import text
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            val = result.scalar()
            return {"status": "ok", "db_url": engine.url.render_as_string(hide_password=True), "val": val}
    except Exception as e:
        import traceback
        return {"status": "error", "db_url": engine.url.render_as_string(hide_password=True), "error": str(e), "traceback": traceback.format_exc()}


@router.get(
    "/ping",
    summary="Liveness Probe",
    description="Simple liveness probe — returns 200 if the process is running.",
)
async def ping() -> dict:
    return {"pong": True}
