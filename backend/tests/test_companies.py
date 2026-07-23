"""
Company Management Tests — Module 7
Covers: CRUD, search, pagination, duplicate prevention, URL/phone validation
"""
import pytest
from httpx import AsyncClient


# ── Create ────────────────────────────────────────────────────────────────────

async def test_create_company_minimal(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/companies", headers=auth_headers,
        json={"name": "Minimal Corp"},
    )
    assert resp.status_code == 201
    assert resp.json()["data"]["name"] == "Minimal Corp"


async def test_create_company_full(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/companies", headers=auth_headers,
        json={
            "name": "Full Details Corp",
            "website": "https://fulldetails.com",
            "industry": "Software",
            "phone": "+14155552671",
            "city": "San Francisco",
            "country": "USA",
            "linkedin_url": "https://linkedin.com/company/fulldetails",
        },
    )
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["industry"] == "Software"
    assert data["city"] == "San Francisco"


async def test_create_company_duplicate_name(client: AsyncClient, auth_headers):
    payload = {"name": "Dup Name Corp"}
    await client.post("/api/v1/companies", headers=auth_headers, json=payload)
    resp = await client.post("/api/v1/companies", headers=auth_headers, json=payload)
    assert resp.status_code == 409
    assert resp.json()["error_code"] == "DUPLICATE_RESOURCE"


async def test_create_company_invalid_website(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/companies", headers=auth_headers,
        json={"name": "Bad URL Corp", "website": "not-a-url"},
    )
    assert resp.status_code == 422


async def test_create_company_invalid_phone(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/companies", headers=auth_headers,
        json={"name": "Bad Phone Corp", "phone": "abc-notphone"},
    )
    assert resp.status_code == 422


# ── List & Search ─────────────────────────────────────────────────────────────

async def test_list_companies_empty(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/companies", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert "data" in body["data"]


async def test_list_companies_pagination(client: AsyncClient, auth_headers):
    for i in range(3):
        await client.post(
            "/api/v1/companies", headers=auth_headers,
            json={"name": f"Page Corp {i}"},
        )
    resp = await client.get(
        "/api/v1/companies?page=1&page_size=2", headers=auth_headers
    )
    assert resp.status_code == 200
    meta = resp.json()["data"]["meta"]
    assert meta["page_size"] == 2
    assert meta["total"] >= 3


async def test_search_companies(client: AsyncClient, auth_headers):
    await client.post(
        "/api/v1/companies", headers=auth_headers,
        json={"name": "SearchableXYZ Corp"},
    )
    resp = await client.get(
        "/api/v1/companies?search=SearchableXYZ", headers=auth_headers
    )
    assert resp.status_code == 200
    items = resp.json()["data"]["data"]
    assert any("SearchableXYZ" in c["name"] for c in items)


# ── Get ───────────────────────────────────────────────────────────────────────

async def test_get_company_by_id(client: AsyncClient, auth_headers):
    create_resp = await client.post(
        "/api/v1/companies", headers=auth_headers,
        json={"name": "GetById Corp"},
    )
    company_id = create_resp.json()["data"]["id"]

    resp = await client.get(f"/api/v1/companies/{company_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == company_id


async def test_get_company_not_found(client: AsyncClient, auth_headers):
    resp = await client.get(
        "/api/v1/companies/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert resp.status_code == 404


# ── Update ────────────────────────────────────────────────────────────────────

async def test_update_company(client: AsyncClient, auth_headers):
    create_resp = await client.post(
        "/api/v1/companies", headers=auth_headers,
        json={"name": "Update Corp"},
    )
    company_id = create_resp.json()["data"]["id"]

    resp = await client.put(
        f"/api/v1/companies/{company_id}",
        headers=auth_headers,
        json={"industry": "Finance", "city": "London"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["industry"] == "Finance"


async def test_update_company_duplicate_name(client: AsyncClient, auth_headers):
    await client.post(
        "/api/v1/companies", headers=auth_headers,
        json={"name": "Existing Corp Name"},
    )
    create2 = await client.post(
        "/api/v1/companies", headers=auth_headers,
        json={"name": "Another Corp"},
    )
    company2_id = create2.json()["data"]["id"]

    resp = await client.put(
        f"/api/v1/companies/{company2_id}",
        headers=auth_headers,
        json={"name": "Existing Corp Name"},
    )
    assert resp.status_code == 409


# ── Delete ────────────────────────────────────────────────────────────────────

async def test_delete_company(client: AsyncClient, auth_headers):
    create_resp = await client.post(
        "/api/v1/companies", headers=auth_headers,
        json={"name": "Delete Corp"},
    )
    company_id = create_resp.json()["data"]["id"]

    del_resp = await client.delete(
        f"/api/v1/companies/{company_id}", headers=auth_headers
    )
    assert del_resp.status_code == 204

    get_resp = await client.get(
        f"/api/v1/companies/{company_id}", headers=auth_headers
    )
    assert get_resp.status_code == 404
