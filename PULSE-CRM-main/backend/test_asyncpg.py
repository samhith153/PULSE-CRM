import asyncio
import os
import ssl
import asyncpg

async def main():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is required")

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    try:
        conn = await asyncpg.connect(
            database_url,
            ssl=ssl_context,
        )

        print("Connected!")
        print(await conn.fetchval("SELECT current_database()"))
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(main())
