"""
Reset admin password to a known value:
  admin@kalnet-pulse.com / Admin@123456

Run from the backend directory:
  python -m scripts.reset_admin
"""
import asyncio
from sqlalchemy import select
from app.core.logging import setup_logging, get_logger
from app.core.security import hash_password
from app.database.connection import AsyncSessionFactory
from app.models.user import User

setup_logging()
logger = get_logger("reset_admin")

async def run():
    async with AsyncSessionFactory() as db:
        try:
            # Find the admin user
            result = await db.execute(
                select(User).where(User.email == "admin@kalnet-pulse.com")
            )
            admin = result.scalar_one_or_none()
            if not admin:
                logger.error("Admin user admin@kalnet-pulse.com not found in DB.")
                return

            # Update password
            admin.hashed_password = hash_password("Admin@123456")
            db.add(admin)
            await db.commit()
            logger.info("Successfully reset password for admin@kalnet-pulse.com to 'Admin@123456'")

        except Exception as exc:
            await db.rollback()
            logger.exception("Failed to reset admin password: %s", exc)
            raise

if __name__ == "__main__":
    asyncio.run(run())
