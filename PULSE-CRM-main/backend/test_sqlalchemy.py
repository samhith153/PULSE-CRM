import asyncio
import os
import ssl

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL environment variable is required")

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

engine = create_async_engine(
    database_url,
    connect_args={
        "ssl": ssl_context,
    },
    echo=True,
)

async def main():
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version()"))
            print(result.scalar())
    finally:
        await engine.dispose()

asyncio.run(main())
