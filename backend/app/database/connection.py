"""
Database connection utilities.
"""

import logging

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

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionFactory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
AsyncSessionLocal = AsyncSessionFactory


async def get_db():
    async with AsyncSessionFactory() as session:
        try:
            print(">>> SESSION START")
            yield session
            print(">>> COMMIT")
            await session.commit()
            print(">>> COMMIT DONE")
        except Exception as e:
            print(">>> ROLLBACK:", e)
            await session.rollback()
            raise
        finally:
            print(">>> SESSION CLOSED")
            await session.close()


async def check_db_connection() -> bool:
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT current_user"))
            print("✅ Database Connected!")
            print("Current User:", result.scalar())
        return True

    except Exception as exc:
        print("\n========== DATABASE ERROR ==========")
        print(type(exc).__name__)
        print(exc)
        print("====================================\n")
        logger.exception("Database health check failed")
        return False