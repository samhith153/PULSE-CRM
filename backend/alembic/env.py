from __future__ import annotations

import asyncio
import ssl
from logging.config import fileConfig

import app.models
from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.database.base import Base

config = context.config
target_metadata = Base.metadata

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_offline():
    url = getattr(settings, "DIRECT_URL", None) or settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run():
    migration_url = getattr(settings, "DIRECT_URL", None) or settings.DATABASE_URL
    connect_args = {}
    connect_args["statement_cache_size"] = 0
    if migration_url.startswith("postgresql") and "localhost" not in migration_url and "127.0.0.1" not in migration_url:
        connect_args["ssl"] = ssl_context

    engine = create_async_engine(
        migration_url,
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    try:
        async with engine.connect() as conn:
            print("CONNECTED")
            await conn.run_sync(do_run_migrations)

    except Exception:
        import traceback

        traceback.print_exc()
        raise

    finally:
        await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run())
