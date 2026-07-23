"""
Authentication Tests — Module 3
Covers: register, login, logout, refresh, forgot/reset/change password, /me
"""
import pytest
from httpx import AsyncClient


# ── Register ──────────────────────────────────────────────────────────────────

async def test_register_success(client: AsyncClient, seed_roles):
    resp = await client.post("/api/v1/auth/register", json={
        "full_name": "Jane Smith",
        "email": "jane@acme.com",
        "password": "Secur3P@ss",
        "organization_name": "Acme Corp",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["token_type"] == "bearer"


async def test_register_weak_password(client: AsyncClient, seed_roles):
    resp = await client.post("/api/v1/auth/register", json={
        "full_name": "Weak User",
        "email": "weak@test.com",
        "password": "password",   # no uppercase / special char
        "organization_name": "Weak Org",
    })
    assert resp.status_code == 422


async def test_register_duplicate_email(client: AsyncClient, seed_roles):
    payload = {
        "full_name": "Dup User",
        "email": "dup@org.com",
        "password": "Secur3P@ss",
        "organization_name": "Dup Org 1",
    }
    await client.post("/api/v1/auth/register", json=payload)
    payload["organization_name"] = "Dup Org 2"
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409
    assert resp.json()["error_code"] == "DUPLICATE_RESOURCE"


async def test_register_invalid_email(client: AsyncClient, seed_roles):
    resp = await client.post("/api/v1/auth/register", json={
        "full_name": "Bad Email",
        "email": "not-an-email",
        "password": "Secur3P@ss",
        "organization_name": "Bad Org",
    })
    assert resp.status_code == 422


# ── Login ─────────────────────────────────────────────────────────────────────

async def test_login_success(client: AsyncClient, registered_user):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "test.admin@example.com",
        "password": "Test@123456",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()["data"]


async def test_login_wrong_password(client: AsyncClient, registered_user):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "test.admin@example.com",
        "password": "WrongP@ss99",
    })
    assert resp.status_code == 401
    assert resp.json()["error_code"] == "INVALID_CREDENTIALS"


async def test_login_unknown_email(client: AsyncClient, seed_roles):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "nobody@nowhere.com",
        "password": "Any@12345",
    })
    assert resp.status_code == 401


# ── /me ───────────────────────────────────────────────────────────────────────

async def test_get_me(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["email"] == "test.admin@example.com"
    assert "admin" in data["roles"]
    assert isinstance(data["permissions"], list)
    assert len(data["permissions"]) > 0


async def test_get_me_no_token(client: AsyncClient):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


async def test_get_me_invalid_token(client: AsyncClient):
    resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not.a.real.token"},
    )
    assert resp.status_code == 401


# ── Refresh ───────────────────────────────────────────────────────────────────

async def test_refresh_token(client: AsyncClient, registered_user):
    resp = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": registered_user["refresh_token"]
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()["data"]


async def test_refresh_with_bad_token(client: AsyncClient):
    resp = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": "garbage.token.here"
    })
    assert resp.status_code == 401


# ── Change Password ───────────────────────────────────────────────────────────

async def test_change_password_success(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/auth/change-password",
        headers=auth_headers,
        json={
            "current_password": "Test@123456",
            "new_password": "NewP@ssw0rd",
        },
    )
    assert resp.status_code == 200


async def test_change_password_wrong_current(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/auth/change-password",
        headers=auth_headers,
        json={
            "current_password": "WrongCurrent!1",
            "new_password": "NewP@ssw0rd",
        },
    )
    assert resp.status_code == 401


# ── Forgot / Reset password ───────────────────────────────────────────────────

async def test_forgot_password_always_200(client: AsyncClient, seed_roles):
    """Forgot-password endpoint never reveals whether email exists."""
    resp = await client.post("/api/v1/auth/forgot-password", json={
        "email": "nonexistent@nowhere.com"
    })
    assert resp.status_code == 200


async def test_logout(client: AsyncClient, auth_headers):
    resp = await client.post("/api/v1/auth/logout", headers=auth_headers)
    assert resp.status_code == 204
