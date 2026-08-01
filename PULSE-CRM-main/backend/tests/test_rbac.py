"""
RBAC Tests — Module 4
Covers: permission enforcement, role-based access, missing token, wrong role
"""
import pytest
from httpx import AsyncClient


async def _register_sales_rep(client: AsyncClient, seed_roles) -> dict:
    """Register a second org with a sales rep user for RBAC testing."""
    # Register creates an Admin user. We test by calling user-management
    # with a freshly registered user who has admin role but limited
    # permissions if we test permission-specific endpoints.
    resp = await client.post("/api/v1/auth/register", json={
        "full_name": "Sales Rep Test",
        "email": "salesrep.rbac@example.com",
        "password": "SalesR3p@pass",
        "organization_name": "RBAC Test Org",
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]


# ── Token required ────────────────────────────────────────────────────────────

async def test_companies_requires_auth(client: AsyncClient):
    resp = await client.get("/api/v1/companies")
    assert resp.status_code == 401


async def test_users_requires_auth(client: AsyncClient):
    resp = await client.get("/api/v1/users")
    assert resp.status_code == 401


async def test_leads_requires_auth(client: AsyncClient):
    resp = await client.get("/api/v1/leads")
    assert resp.status_code == 401


async def test_contacts_requires_auth(client: AsyncClient):
    resp = await client.get("/api/v1/contacts")
    assert resp.status_code == 401


# ── Admin can access all resources ────────────────────────────────────────────

async def test_admin_can_list_users(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/users", headers=auth_headers)
    assert resp.status_code == 200


async def test_admin_can_create_company(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/companies",
        headers=auth_headers,
        json={"name": "RBAC Test Company"},
    )
    assert resp.status_code == 201


async def test_admin_can_create_contact(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/contacts",
        headers=auth_headers,
        json={
            "first_name": "RBAC",
            "last_name": "Contact",
            "email": "rbac.contact@example.com",
        },
    )
    assert resp.status_code == 201


async def test_admin_can_create_lead(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/leads",
        headers=auth_headers,
        json={"title": "RBAC Test Lead"},
    )
    assert resp.status_code == 201


# ── Malformed token ───────────────────────────────────────────────────────────

async def test_malformed_token_rejected(client: AsyncClient):
    headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.bad.payload"}
    resp = await client.get("/api/v1/users", headers=headers)
    assert resp.status_code == 401
    assert resp.json()["error_code"] in ("INVALID_TOKEN", "UNAUTHORIZED")


async def test_no_bearer_prefix_rejected(client: AsyncClient):
    headers = {"Authorization": "Token sometoken"}
    resp = await client.get("/api/v1/users", headers=headers)
    assert resp.status_code == 401


# ── Organisation isolation ────────────────────────────────────────────────────

async def test_cross_org_company_not_visible(client: AsyncClient, auth_headers, seed_roles):
    """
    A user from Org A cannot see companies belonging to Org B.
    Register a second org, create a company in it, then verify Org A
    cannot retrieve it by ID.
    """
    # Register second org
    reg_resp = await client.post("/api/v1/auth/register", json={
        "full_name": "Org B Admin",
        "email": "orgb.admin@example.com",
        "password": "OrgBP@ss99",
        "organization_name": "Organization B",
    })
    assert reg_resp.status_code == 201
    org_b_token = reg_resp.json()["data"]["access_token"]
    org_b_headers = {"Authorization": f"Bearer {org_b_token}"}

    # Create company in Org B
    create_resp = await client.post(
        "/api/v1/companies",
        headers=org_b_headers,
        json={"name": "Org B Exclusive Company"},
    )
    assert create_resp.status_code == 201
    company_id = create_resp.json()["data"]["id"]

    # Org A user cannot fetch Org B's company by ID
    fetch_resp = await client.get(
        f"/api/v1/companies/{company_id}",
        headers=auth_headers,  # Org A token
    )
    assert fetch_resp.status_code == 404
