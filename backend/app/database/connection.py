"""
Database connection utilities.
"""

import asyncio
import logging
import ssl
from typing import AsyncGenerator
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings

logger = logging.getLogger(__name__)

DATABASE_URL = (
    getattr(settings, "DATABASE_URL", None)
    or getattr(settings, "SQLALCHEMY_DATABASE_URL", None)
    or getattr(settings, "DATABASE_URI", None)
)

if not DATABASE_URL:
    raise RuntimeError("Database URL is not configured")

# ----------------------------------------------------------
# SSL WORKAROUND (needed for local dev against the Supabase
# pooler — without this, asyncpg's handshake fails locally
# even though it works fine on Render).
# ----------------------------------------------------------
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Prefer DIRECT_URL (or fall back to DATABASE_URL).
#
# Supabase exposes three connection paths:
#   - DATABASE_URL  -> transaction-mode pooler (:6543). PgBouncer multiplexes
#                      connections; QueuePool and prepared statements are unsafe.
#   - DIRECT_URL     -> session-mode pooler (:5432) or direct Postgres (:5432).
#                      Session-mode pooler still uses PgBouncer (no prepared
#                      statements). True direct connection supports everything.
#                      NOTE: db.xxx.supabase.co is IPv6-only on free tier and
#                      unreachable from Render, so on Render DIRECT_URL typically
#                      points to the session-mode pooler instead.
engine_url = (
    getattr(settings, "DIRECT_URL", None)
    or DATABASE_URL
)

# ------------------------------------------------------------------
# Strip query params that asyncpg doesn't understand (e.g. sslmode).
# asyncpg uses its own `ssl` connect_arg instead.
# ------------------------------------------------------------------
_parsed = urlparse(engine_url)
_query_params = parse_qs(_parsed.query, keep_blank_values=True)
_asyncpg_rejects = {"sslmode"}
_filtered = {k: v for k, v in _query_params.items() if k.lower() not in _asyncpg_rejects}
engine_url = urlunparse(_parsed._replace(query=urlencode(_filtered, doseq=True)))

connect_args = {}
if "localhost" not in engine_url and "127.0.0.1" not in engine_url:
    connect_args["ssl"] = ssl_context

# Detect the connection path. Three cases:
#
# 1. Transaction-mode pooler (:6543): PgBouncer multiplexes server connections
#    per transaction, so a client-side pool cannot reuse them — use NullPool.
# 2. Session-mode pooler (:5432 with "pooler" in host): PgBouncer pins one
#    server connection per client session, so QueuePool reuse IS safe. Only
#    prepared statements must stay disabled (PgBouncer compatibility). This
#    avoids a fresh TCP+TLS handshake on every connection checkout.
# 3. Direct connection: QueuePool + asyncpg's prepared-statement cache.
#
# Detection is based on the URL hostname/port, not which env var was used —
# DIRECT_URL may point to a session pooler when the direct db host is
# unreachable (e.g. IPv6-only from Render).
_is_transaction_pooler = ":6543" in engine_url
_is_session_pooler = ("pooler" in engine_url) and not _is_transaction_pooler

_pool_kwargs = dict(
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,
)
if _is_transaction_pooler:
    connect_args["statement_cache_size"] = 0
    _pool_kwargs["poolclass"] = NullPool
elif _is_session_pooler:
    connect_args["statement_cache_size"] = 0
    _pool_kwargs.update(
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_recycle=settings.DATABASE_POOL_RECYCLE,
        pool_timeout=settings.DATABASE_POOL_TIMEOUT,
    )
else:
    connect_args["statement_cache_size"] = 256
    _pool_kwargs.update(
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_recycle=settings.DATABASE_POOL_RECYCLE,
        pool_timeout=settings.DATABASE_POOL_TIMEOUT,
    )

engine = create_async_engine(engine_url, **_pool_kwargs)
AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
AsyncSessionLocal = AsyncSessionFactory

_pool_mode = (
    "Null (transaction pooler)" if _is_transaction_pooler
    else "Queue (session pooler)" if _is_session_pooler
    else "Queue (direct)"
)
logger.info(
    "DB engine using %s pool for URL host=%s",
    _pool_mode,
    urlparse(engine_url).hostname,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session with automatic commit/rollback.

    NOTE: Connection-level errors are retried transparently by the engine
    (pool_pre_ping=True + pool_recycle). If the pool is exhausted or the
    database is unreachable, the error propagates to the caller.
    """
    async with AsyncSessionFactory() as session:
        try:
            logger.debug("Session started")
            yield session
            logger.debug("Committing session")
            await session.commit()
            logger.debug("Session committed")
        except Exception as exc:
            logger.warning("Session rollback: %s: %s", type(exc).__name__, exc)
            await session.rollback()
            raise
        finally:
            await session.close()
            logger.debug("Session closed")


async def check_db_connection() -> bool:
    """Quick health check — verifies we can query the database."""
    try:
        async with engine.connect() as conn:
            if engine.url.drivername.startswith("sqlite"):
                result = await conn.execute(text("SELECT 1"))
                user = "sqlite_user"
            else:
                result = await conn.execute(text("SELECT current_user"))
                user = result.scalar()
            logger.info("Database connected - current_user=%s", user)
            print(f"Database Connected!")
            print(f"Current User: {user}")
        return True
    except Exception as exc:
        logger.exception(
            "Database health check failed: %s: %s",
            type(exc).__name__,
            exc,
        )
        logger.error("========== DATABASE ERROR ==========\n%s: %s\n====================================", type(exc).__name__, exc)
        return False
