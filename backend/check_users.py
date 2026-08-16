import asyncio
from sqlalchemy import select
from app.database.connection import AsyncSessionFactory
from app.models.user import User

async def main():
    async with AsyncSessionFactory() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f"Total users found in DB: {len(users)}")
        for u in users:
            print(f"- Email: {u.email}, Active: {u.is_active}, Verified: {u.is_verified}")

if __name__ == "__main__":
    asyncio.run(main())
