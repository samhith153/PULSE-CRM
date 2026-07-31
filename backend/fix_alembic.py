import asyncio
from sqlalchemy import text
from app.database.connection import engine

async def clear_version():
    async with engine.begin() as conn:
        await conn.execute(text("DELETE FROM alembic_version;"))
        print("✅ Successfully cleared old Alembic memory!")

if __name__ == "__main__":
    asyncio.run(clear_version())