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

# Prefer the direct (session-mode) URL for the app engine.
#
# Supabase exposes two endpoints:
#   - DATABASE_URL  -> the pooler (transaction mode on :6543, or a "pooler"
#                      hostname). PgBouncer multiplexes one backend connection
#                      across many clients, so SQLAlchemy's QueuePool cannot
#                      safely reuse connections here (transaction state leaks
#                      between requests) — that is why the old code used
#                      NullPool and opened a brand-new connection per request.
#   - DIRECT_URL     -> a direct connection to the Postgres instance. QueuePool
#                      works correctly here and reuses physical connections,
#                      eliminating the 30-80ms connect tax on every request.
engine_url = (
    DATABASE_URL
    or getattr(settings, "DIRECT_URL", None)
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

# Detect the transaction-mode pooler. Only that path is incompatible with a
# pooled engine; a direct connection (or session-mode pooler) is not.
_is_pooler = "pooler" in engine_url or ":6543" in engine_url

_pool_kwargs = dict(
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,
)
if _is_pooler:
    # Transaction-mode pooler: disable asyncpg's prepared-statement cache and
    # connection reuse (NullPool) — the pooler multiplexes connections for us.
    connect_args["statement_cache_size"] = 0
    _pool_kwargs["poolclass"] = NullPool
else:
    # Direct/session-mode connection: QueuePool reuses physical connections and
    # asyncpg's prepared-statement cache (default 256) avoids re-parsing
    # repeated queries. pool_recycle guards against stale connections.
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

logger.info(
    "DB engine using %s pool for URL host=%s",
    "Null" if _is_pooler else "Queue",
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
