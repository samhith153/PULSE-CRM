import asyncio
import ssl
import asyncpg

async def main():
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    try:
        conn = await asyncpg.connect(
            host="aws-1-ap-south-1.pooler.supabase.com",
            port=5432,
            user="postgres.iakhfiybsxsgfmdyxqmi",
            password="pulsecrmteam123",
            database="postgres",
            ssl=ssl_context,
        )

        print("✅ Connected!")
        print(await conn.fetchval("SELECT version()"))
        await conn.close()

    except Exception as e:
        print(type(e).__name__)
        print(e)

asyncio.run(main())