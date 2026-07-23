"""
Pytest Configuration & Shared Fixtures
Uses an in-memory SQLite database (via aiosqlite) for fast, isolated tests.
Every test gets a fresh rolled-back transaction.
"""
import pytest
import pytest_asyncio
from typing import AsyncGenerator

from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.connection import get_db
from app.main import app

# ─────────────────────────────────────────────────────────────────────────────
# In-memory SQLite engine — no external DB required
# ─────────────────────────────────────────────────────────────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False,
)

TestSessionFactory = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# ─────────────────────────────────────────────────────────────────────────────
# Create tables once per session, drop after
# ─────────────────────────────────────────────────────────────────────────────
@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ─────────────────────────────────────────────────────────────────────────────
# Per-test DB session — rolls back after each test
# ─────────────────────────────────────────────────────────────────────────────
@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionFactory() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()


# ─────────────────────────────────────────────────────────────────────────────
# HTTP test client with DB override
# ─────────────────────────────────────────────────────────────────────────────
@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


# ─────────────────────────────────────────────────────────────────────────────
# Seed roles + permissions into test DB
# ─────────────────────────────────────────────────────────────────────────────
@pytest_asyncio.fixture
async def seed_roles(db_session: AsyncSession):
    from scripts.seed import seed_permissions, seed_roles as _seed_roles
    perm_map = await seed_permissions(db_session)
    role_map = await _seed_roles(db_session, perm_map)
    await db_session.commit()
    return role_map


# ─────────────────────────────────────────────────────────────────────────────
# Register a test user and return token data
# ─────────────────────────────────────────────────────────────────────────────
@pytest_asyncio.fixture
async def registered_user(client: AsyncClient, seed_roles):
    resp = await client.post("/api/v1/auth/register", json={
        "full_name": "Test Admin",
        "email": "test.admin@example.com",
        "password": "Test@123456",
        "organization_name": "Test Organization",
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]


@pytest_asyncio.fixture
async def auth_headers(registered_user: dict) -> dict:
    return {"Authorization": f"Bearer {registered_user['access_token']}"}
