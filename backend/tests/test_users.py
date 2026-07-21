"""
User Management Tests — Module 5
Covers: list, create, get, update, activate/deactivate, assign roles, delete
"""
import pytest
from httpx import AsyncClient


# ── List ──────────────────────────────────────────────────────────────────────

async def test_list_users(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/users", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert "data" in body["data"]   # paginated
    assert body["data"]["meta"]["total"] >= 1


async def test_list_users_search(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/users?search=admin", headers=auth_headers)
    assert resp.status_code == 200
    items = resp.json()["data"]["data"]
    assert all("admin" in u["email"].lower() or "admin" in u["full_name"].lower()
               for u in items)


async def test_list_users_pagination(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/users?page=1&page_size=5", headers=auth_headers)
    assert resp.status_code == 200
    meta = resp.json()["data"]["meta"]
    assert meta["page"] == 1
    assert meta["page_size"] == 5


# ── Create ────────────────────────────────────────────────────────────────────

async def test_create_user(client: AsyncClient, auth_headers, seed_roles):
    resp = await client.post("/api/v1/users", headers=auth_headers, json={
        "full_name": "New Employee",
        "email": "new.employee@company.com",
        "password": "Emp10yee@Pass",
    })
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["email"] == "new.employee@company.com"
    assert data["is_active"] is True


async def test_create_user_duplicate_email(client: AsyncClient, auth_headers, seed_roles):
    payload = {
        "full_name": "Dup Employee",
        "email": "dup.employee@company.com",
        "password": "Dup1@Employee",
    }
    await client.post("/api/v1/users", headers=auth_headers, json=payload)
    resp = await client.post("/api/v1/users", headers=auth_headers, json=payload)
    assert resp.status_code == 409


async def test_create_user_weak_password(client: AsyncClient, auth_headers):
    resp = await client.post("/api/v1/users", headers=auth_headers, json={
        "full_name": "Weak Emp",
        "email": "weak.emp@company.com",
        "password": "weakpass",
    })
    assert resp.status_code == 422


# ── Get ───────────────────────────────────────────────────────────────────────

async def test_get_user_by_id(client: AsyncClient, auth_headers):
    # First get current user id via /me
    me_resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    user_id = me_resp.json()["data"]["id"]

    resp = await client.get(f"/api/v1/users/{user_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == user_id


async def test_get_user_not_found(client: AsyncClient, auth_headers):
    fake_id = "00000000-0000-0000-0000-000000000000"
    resp = await client.get(f"/api/v1/users/{fake_id}", headers=auth_headers)
    assert resp.status_code == 404


# ── Update ────────────────────────────────────────────────────────────────────

async def test_update_user(client: AsyncClient, auth_headers, seed_roles):
    create_resp = await client.post("/api/v1/users", headers=auth_headers, json={
        "full_name": "Update Me",
        "email": "update.me@company.com",
        "password": "Upd@te1Pass",
    })
    user_id = create_resp.json()["data"]["id"]

    resp = await client.put(
        f"/api/v1/users/{user_id}",
        headers=auth_headers,
        json={"job_title": "Senior Engineer", "phone": "+1234567890"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["job_title"] == "Senior Engineer"


# ── Activate / Deactivate ─────────────────────────────────────────────────────

async def test_deactivate_and_activate_user(client: AsyncClient, auth_headers, seed_roles):
    create_resp = await client.post("/api/v1/users", headers=auth_headers, json={
        "full_name": "Toggle User",
        "email": "toggle@company.com",
        "password": "T0ggle@User",
    })
    user_id = create_resp.json()["data"]["id"]

    deact_resp = await client.post(
        f"/api/v1/users/{user_id}/deactivate", headers=auth_headers
    )
    assert deact_resp.status_code == 200
    assert deact_resp.json()["data"]["is_active"] is False

    act_resp = await client.post(
        f"/api/v1/users/{user_id}/activate", headers=auth_headers
    )
    assert act_resp.status_code == 200
    assert act_resp.json()["data"]["is_active"] is True


async def test_cannot_deactivate_self(client: AsyncClient, auth_headers):
    me_resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    user_id = me_resp.json()["data"]["id"]

    resp = await client.post(
        f"/api/v1/users/{user_id}/deactivate", headers=auth_headers
    )
    assert resp.status_code == 403


# ── Delete ────────────────────────────────────────────────────────────────────

async def test_delete_user(client: AsyncClient, auth_headers, seed_roles):
    create_resp = await client.post("/api/v1/users", headers=auth_headers, json={
        "full_name": "Delete User",
        "email": "delete.user@company.com",
        "password": "D3lete@User",
    })
    user_id = create_resp.json()["data"]["id"]

    del_resp = await client.delete(f"/api/v1/users/{user_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    get_resp = await client.get(f"/api/v1/users/{user_id}", headers=auth_headers)
    assert get_resp.status_code == 404


async def test_create_user_invalid_role_id_rejected(client: AsyncClient, auth_headers, seed_roles):
    resp = await client.post("/api/v1/users", headers=auth_headers, json={
        "full_name": "Bad Role",
        "email": "bad.role@company.com",
        "password": "BadR0le@Pass",
        "role_ids": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    })
    assert resp.status_code == 404


async def test_assign_roles_invalid_role_id_rejected(client: AsyncClient, auth_headers, seed_roles):
    create_resp = await client.post("/api/v1/users", headers=auth_headers, json={
        "full_name": "Role Target",
        "email": "role.target@company.com",
        "password": "R0leTarg@t1",
    })
    user_id = create_resp.json()["data"]["id"]

    resp = await client.post(
        f"/api/v1/users/{user_id}/roles",
        headers=auth_headers,
        json={"role_ids": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"]},
    )
    assert resp.status_code == 404
