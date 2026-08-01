"""
Validation Rule Tests — Module 10
Tests all the business-rule and input validation scenarios explicitly.
"""
import pytest
from httpx import AsyncClient


# ── Duplicate Prevention ──────────────────────────────────────────────────────

async def test_duplicate_company_name_blocked(client: AsyncClient, auth_headers):
    await client.post(
        "/api/v1/companies", headers=auth_headers, json={"name": "Dup Validation Corp"}
    )
    resp = await client.post(
        "/api/v1/companies", headers=auth_headers, json={"name": "Dup Validation Corp"}
    )
    assert resp.status_code == 409


async def test_duplicate_contact_email_blocked(client: AsyncClient, auth_headers):
    payload = {
        "first_name": "Dup", "last_name": "Email",
        "email": "dup.validation@test.com"
    }
    await client.post("/api/v1/contacts", headers=auth_headers, json=payload)
    resp = await client.post("/api/v1/contacts", headers=auth_headers, json=payload)
    assert resp.status_code == 409


async def test_duplicate_user_email_blocked(client: AsyncClient, auth_headers, seed_roles):
    payload = {
        "full_name": "Dup User",
        "email": "dup.user.val@test.com",
        "password": "DupUser@99",
    }
    await client.post("/api/v1/users", headers=auth_headers, json=payload)
    resp = await client.post("/api/v1/users", headers=auth_headers, json=payload)
    assert resp.status_code == 409


# ── URL Validation ────────────────────────────────────────────────────────────

async def test_company_website_requires_https(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/companies", headers=auth_headers,
        json={"name": "No Protocol Corp", "website": "www.noprotocol.com"},
    )
    assert resp.status_code == 422


async def test_company_linkedin_requires_https(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/companies", headers=auth_headers,
        json={"name": "Bad LinkedIn Corp", "linkedin_url": "linkedin.com/company/bad"},
    )
    assert resp.status_code == 422


async def test_contact_linkedin_requires_https(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/contacts", headers=auth_headers,
        json={
            "first_name": "Bad", "last_name": "LinkedIn",
            "email": "bad.linkedin@test.com",
            "linkedin_url": "linkedin.com/in/bad",
        },
    )
    assert resp.status_code == 422


# ── Phone Validation ──────────────────────────────────────────────────────────

async def test_company_phone_must_be_numeric(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/companies", headers=auth_headers,
        json={"name": "Bad Phone Corp", "phone": "call-me-maybe"},
    )
    assert resp.status_code == 422


async def test_contact_phone_must_be_valid(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/contacts", headers=auth_headers,
        json={
            "first_name": "Bad", "last_name": "Phone",
            "email": "bad.phone@test.com",
            "phone": "not-a-number",
        },
    )
    assert resp.status_code == 422


# ── Password Strength ─────────────────────────────────────────────────────────

async def test_password_too_short(client: AsyncClient, seed_roles):
    resp = await client.post("/api/v1/auth/register", json={
        "full_name": "Short Pwd",
        "email": "short.pwd@test.com",
        "password": "Ab1@",  # too short
        "organization_name": "ShortOrg",
    })
    assert resp.status_code == 422


async def test_password_no_uppercase(client: AsyncClient, seed_roles):
    resp = await client.post("/api/v1/auth/register", json={
        "full_name": "No Upper",
        "email": "no.upper@test.com",
        "password": "nouppercase1@",
        "organization_name": "NoUpper Org",
    })
    assert resp.status_code == 422


async def test_password_no_special_char(client: AsyncClient, seed_roles):
    resp = await client.post("/api/v1/auth/register", json={
        "full_name": "No Special",
        "email": "no.special@test.com",
        "password": "NoSpecialChar1",
        "organization_name": "NoSpecial Org",
    })
    assert resp.status_code == 422


# ── Email Format ──────────────────────────────────────────────────────────────

async def test_invalid_email_format_register(client: AsyncClient, seed_roles):
    resp = await client.post("/api/v1/auth/register", json={
        "full_name": "Bad Email",
        "email": "not-an-email",
        "password": "ValidP@ss1",
        "organization_name": "Bad Email Org",
    })
    assert resp.status_code == 422


async def test_invalid_email_format_contact(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/contacts", headers=auth_headers,
        json={
            "first_name": "Bad", "last_name": "Email",
            "email": "not-an-email",
        },
    )
    assert resp.status_code == 422


# ── UUID Validation ───────────────────────────────────────────────────────────

async def test_invalid_uuid_returns_422(client: AsyncClient, auth_headers):
    resp = await client.get(
        "/api/v1/companies/not-a-valid-uuid", headers=auth_headers
    )
    assert resp.status_code == 422


# ── Empty Required Fields ─────────────────────────────────────────────────────

async def test_company_name_required(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/companies", headers=auth_headers, json={}
    )
    assert resp.status_code == 422


async def test_contact_email_required(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/contacts", headers=auth_headers,
        json={"first_name": "No", "last_name": "Email"},
    )
    assert resp.status_code == 422


async def test_lead_title_required(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/leads", headers=auth_headers, json={}
    )
    assert resp.status_code == 422
