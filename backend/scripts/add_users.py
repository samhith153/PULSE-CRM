"""
Add specific login users:
  manager@gmail.com / Manager@123456  → role: manager
  sales@gmail.com   / Sales@123456    → role: sales_rep

Run from the backend directory:
  python -m scripts.add_users
"""
import asyncio
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.security import hash_password
from app.database.connection import AsyncSessionFactory
from app.models.organization import Organization
from app.models.role import Role as RoleModel
from app.models.user import User, UserRole

setup_logging()
logger = get_logger("add_users")

NEW_USERS = [
    {"full_name": "Manager User",    "email": "manager@gmail.com", "password": "Manager@123456", "role": "manager"},
    {"full_name": "Sales Rep User",  "email": "sales@gmail.com",   "password": "Sales@123456",   "role": "sales_rep"},
]


async def run():
    async with AsyncSessionFactory() as db:
        try:
            # Get the first (or any) organization to attach users to
            result = await db.execute(select(Organization).limit(1))
            org = result.scalar_one_or_none()
            if not org:
                logger.error("No organization found in DB. Please run the main seed first.")
                return

            logger.info("Using organization: %s (id=%s)", org.name, org.id)

            for u_data in NEW_USERS:
                # Check if user already exists
                existing = (await db.execute(
                    select(User).where(User.email == u_data["email"])
                )).scalar_one_or_none()

                if existing:
                    logger.warning("User %s already exists — skipping.", u_data["email"])
                    continue

                # Resolve the role model
                role_model = (await db.execute(
                    select(RoleModel).where(RoleModel.name == u_data["role"])
                )).scalar_one_or_none()

                if not role_model:
                    logger.error("Role '%s' not found. Run the main seed first.", u_data["role"])
                    continue

                # Create user
                user = User(
                    email=u_data["email"],
                    full_name=u_data["full_name"],
                    hashed_password=hash_password(u_data["password"]),
                    organization_id=org.id,
                    is_verified=True,
                    is_active=True,
                )
                db.add(user)
                await db.flush()

                # Assign role
                db.add(UserRole(
                    user_id=user.id,
                    role_id=role_model.id,
                    assigned_by=user.id,
                    assigned_at=datetime.now(timezone.utc),
                ))
                await db.flush()
                logger.info("✅ Created %s: %s (password: %s)", u_data["role"], u_data["email"], u_data["password"])

            await db.commit()
            logger.info("Done!")

        except Exception as exc:
            await db.rollback()
            logger.exception("Failed: %s", exc)
            raise


if __name__ == "__main__":
    asyncio.run(run())
