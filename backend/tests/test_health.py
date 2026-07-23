"""
Health Check Tests
"""
import pytest
from httpx import AsyncClient


async def test_ping(client: AsyncClient):
    resp = await client.get("/api/v1/health/ping")
    assert resp.status_code == 200
    assert resp.json()["pong"] is True


async def test_health_check(client: AsyncClient):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "version" in data
    assert data["version"] == "1.0.0"


async def test_root_endpoint(client: AsyncClient):
    resp = await client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert "name" in data
    assert "version" in data
