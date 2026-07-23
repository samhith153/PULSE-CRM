"""
Contact Management Tests — Module 8
Covers: CRUD, company validation, email uniqueness, phone/URL validation, search
"""
import pytest
from httpx import AsyncClient


async def _make_company(client, headers, name="Contact Test Corp") -> str:
    resp = await client.post(
        "/api/v1/companies", headers=headers, json={"name": name}
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]["id"]


# ── Create ────────────────────────────────────────────────────────────────────

async def test_create_contact_minimal(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/contacts", headers=auth_headers,
        json={
            "first_name": "Alice",
            "last_name": "Walker",
            "email": "alice.walker@test.com",
        },
    )
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["full_name"] == "Alice Walker"
    assert data["email"] == "alice.walker@test.com"


async def test_create_contact_with_company(client: AsyncClient, auth_headers):
    company_id = await _make_company(client, auth_headers, "Contact Linked Corp")
    resp = await client.post(
        "/api/v1/contacts", headers=auth_headers,
        json={
            "first_name": "Bob",
            "last_name": "Smith",
            "email": "bob.smith@linked.com",
            "company_id": company_id,
            "job_title": "CTO",
            "department": "Engineering",
        },
    )
    assert resp.status_code == 201
    assert resp.json()["data"]["company_id"] == company_id
    assert resp.json()["data"]["job_title"] == "CTO"


async def test_create_contact_duplicate_email(client: AsyncClient, auth_headers):
    payload = {
        "first_name": "Dup",
        "last_name": "Contact",
        "email": "dup.contact@test.com",
    }
    await client.post("/api/v1/contacts", headers=auth_headers, json=payload)
    resp = await client.post("/api/v1/contacts", headers=auth_headers, json=payload)
    assert resp.status_code == 409
    assert resp.json()["error_code"] == "DUPLICATE_RESOURCE"


async def test_create_contact_invalid_company(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/contacts", headers=auth_headers,
        json={
            "first_name": "Bad",
            "last_name": "Company",
            "email": "bad.company@test.com",
            "company_id": "00000000-0000-0000-0000-000000000000",
        },
    )
    assert resp.status_code == 422


async def test_create_contact_invalid_linkedin(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/contacts", headers=auth_headers,
        json={
            "first_name": "Bad",
            "last_name": "URL",
            "email": "bad.url@test.com",
            "linkedin_url": "linkedin.com/not-valid",
        },
    )
    assert resp.status_code == 422


# ── List & Search ─────────────────────────────────────────────────────────────

async def test_list_contacts(client: AsyncClient, auth_headers):
    for i in range(3):
        await client.post(
            "/api/v1/contacts", headers=auth_headers,
            json={
                "first_name": f"User{i}",
                "last_name": "List",
                "email": f"user{i}.list@contacts.com",
            },
        )
    resp = await client.get("/api/v1/contacts", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["meta"]["total"] >= 3


async def test_filter_contacts_by_company(client: AsyncClient, auth_headers):
    company_id = await _make_company(client, auth_headers, "Filter By Company Corp")
    await client.post(
        "/api/v1/contacts", headers=auth_headers,
        json={
            "first_name": "Filter",
            "last_name": "ByCompany",
            "email": "filter.bycompany@test.com",
            "company_id": company_id,
        },
    )
    resp = await client.get(
        f"/api/v1/contacts?company_id={company_id}", headers=auth_headers
    )
    assert resp.status_code == 200
    items = resp.json()["data"]["data"]
    assert all(c["company_id"] == company_id for c in items)


async def test_search_contacts(client: AsyncClient, auth_headers):
    await client.post(
        "/api/v1/contacts", headers=auth_headers,
        json={
            "first_name": "SearchableZZZ",
            "last_name": "Contact",
            "email": "searchablezzz@test.com",
        },
    )
    resp = await client.get(
        "/api/v1/contacts?search=SearchableZZZ", headers=auth_headers
    )
    assert resp.status_code == 200
    items = resp.json()["data"]["data"]
    assert any("SearchableZZZ" in c["first_name"] for c in items)


# ── Update ────────────────────────────────────────────────────────────────────

async def test_update_contact(client: AsyncClient, auth_headers):
    create_resp = await client.post(
        "/api/v1/contacts", headers=auth_headers,
        json={
            "first_name": "Update",
            "last_name": "Me",
            "email": "update.contact@test.com",
        },
    )
    contact_id = create_resp.json()["data"]["id"]

    resp = await client.put(
        f"/api/v1/contacts/{contact_id}",
        headers=auth_headers,
        json={"job_title": "VP Engineering", "department": "Engineering"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["job_title"] == "VP Engineering"


# ── Delete ────────────────────────────────────────────────────────────────────

async def test_delete_contact(client: AsyncClient, auth_headers):
    create_resp = await client.post(
        "/api/v1/contacts", headers=auth_headers,
        json={
            "first_name": "Delete",
            "last_name": "Me",
            "email": "delete.contact@test.com",
        },
    )
    contact_id = create_resp.json()["data"]["id"]

    del_resp = await client.delete(
        f"/api/v1/contacts/{contact_id}", headers=auth_headers
    )
    assert del_resp.status_code == 204

    get_resp = await client.get(
        f"/api/v1/contacts/{contact_id}", headers=auth_headers
    )
    assert get_resp.status_code == 404
