"""
Database connection utilities.
"""

import asyncio
import logging
import ssl
from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

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

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"ssl": ssl_context},
    echo=False,
    pool_pre_ping=True,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_recycle=settings.DATABASE_POOL_RECYCLE,
    pool_timeout=settings.DATABASE_POOL_TIMEOUT,
)
AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
AsyncSessionLocal = AsyncSessionFactory


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
        print("\n========== DATABASE ERROR ==========")
        print(type(exc).__name__)
        print(str(exc))
        print("====================================\n")
        return False
