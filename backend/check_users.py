import asyncio
from sqlalchemy import text
from app.database.connection import engine

async def main():
    async with engine.connect() as conn:
        result = await conn.execute(
            text("""
                SELECT
                    id,
                    full_name,
                    email,
                    is_active
                FROM users
            """)
        )

        rows = result.fetchall()

        print("\n===== USERS TABLE =====")

        if not rows:
            print("No users found.")
        else:
            for row in rows:
                print(row)

    await engine.dispose()

asyncio.run(main())