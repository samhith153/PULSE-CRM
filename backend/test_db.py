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
    connect_args={"ssl": ssl_context},
    echo=True,
)

print(engine)
print(engine.url)


async def main():
    async with engine.connect() as conn:
        print(await conn.scalar(text("SELECT current_user")))
        print(await conn.scalar(text("SELECT version()")))

    await engine.dispose()


asyncio.run(main())