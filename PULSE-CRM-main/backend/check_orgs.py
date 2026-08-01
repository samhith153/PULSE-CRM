import asyncio
from sqlalchemy import text
from app.database.connection import engine

async def main():
    async with engine.connect() as conn:
        result = await conn.execute(
            text("SELECT id, name FROM organizations")
        )

        rows = result.fetchall()

        print(rows)

    await engine.dispose()

asyncio.run(main())