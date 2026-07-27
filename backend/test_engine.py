import asyncio
import ssl

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = (
    "postgresql+asyncpg://"
    "postgres.iakhfiybsxsgfmdyxqmi:"
    "pulsecrmteam123@"
    "aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
)

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

engine = create_async_engine(
    DATABASE_URL,
    connect_args={
        "ssl": ssl_context,
    },
    echo=True,
)

print(engine)
print(engine.url)


async def main():
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT current_user"))
            print("Current User:", result.scalar())

            result = await conn.execute(text("SELECT version()"))
            print(result.scalar())

    except Exception as e:
        print(type(e).__name__)
        print(e)

    finally:
        await engine.dispose()


asyncio.run(main())