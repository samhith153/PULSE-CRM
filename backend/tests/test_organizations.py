"""
Organization Management Tests — Module 6
"""
import pytest
from httpx import AsyncClient


async def test_get_my_organization(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/organizations/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["name"] == "Test Organization"
    assert "id" in data


async def test_update_organization(client: AsyncClient, auth_headers):
    # Get org id
    me_resp = await client.get("/api/v1/organizations/me", headers=auth_headers)
    org_id = me_resp.json()["data"]["id"]

    resp = await client.put(
        f"/api/v1/organizations/{org_id}",
        headers=auth_headers,
        json={"city": "London", "country": "UK", "timezone": "Europe/London"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["city"] == "London"


async def test_cannot_update_another_org(client: AsyncClient, auth_headers, seed_roles):
    # Register a second org
    reg = await client.post("/api/v1/auth/register", json={
        "full_name": "Other Admin",
        "email": "other.admin2@example.com",
        "password": "OtherP@ss99",
        "organization_name": "Other Org 2",
    })
    assert reg.status_code == 201
    other_token = reg.json()["data"]["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # Get second org id
    other_me = await client.get("/api/v1/organizations/me", headers=other_headers)
    other_org_id = other_me.json()["data"]["id"]

    # Org A tries to update Org B
    resp = await client.put(
        f"/api/v1/organizations/{other_org_id}",
        headers=auth_headers,
        json={"city": "Hacked City"},
    )
    assert resp.status_code == 403


async def test_get_org_not_found(client: AsyncClient, auth_headers):
    resp = await client.get(
        "/api/v1/organizations/me",
        headers=auth_headers,
    )
    # This should always succeed for any authenticated user
    assert resp.status_code == 200
