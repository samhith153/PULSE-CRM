"""
Deal CRUD + Lead Conversion Integration Tests
"""
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from uuid import UUID

from app.models.activity import ActivityTimeline
from app.models.lead import Lead


async def _get_me(client: AsyncClient, headers: dict) -> dict:
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()["data"]


async def _create_company(client: AsyncClient, headers: dict, name: str) -> dict:
    response = await client.post("/api/v1/companies", headers=headers, json={"name": name})
    assert response.status_code == 201, response.text
    return response.json()["data"]


async def _create_contact(client: AsyncClient, headers: dict, first_name: str, last_name: str, email: str, company_id: str | None = None) -> dict:
    payload = {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
    }
    if company_id:
        payload["company_id"] = company_id
    response = await client.post("/api/v1/contacts", headers=headers, json=payload)
    assert response.status_code == 201, response.text
    return response.json()["data"]


async def _create_lead(
    client: AsyncClient,
    headers: dict,
    title: str,
    owner_id: str | None = None,
    company_id: str | None = None,
    contact_id: str | None = None,
    estimated_value: str | None = None,
) -> dict:
    payload: dict = {"title": title}
    if owner_id:
        payload["owner_id"] = owner_id
    if company_id:
        payload["company_id"] = company_id
    if contact_id:
        payload["contact_id"] = contact_id
    if estimated_value:
        payload["estimated_value"] = estimated_value
    response = await client.post("/api/v1/leads", headers=headers, json=payload)
    assert response.status_code == 201, response.text
    return response.json()["data"]


async def _create_deal(client: AsyncClient, headers: dict, name: str, amount: str | None = None) -> dict:
    payload: dict = {"name": name}
    if amount:
        payload["amount"] = amount
    response = await client.post("/api/v1/deals", headers=headers, json=payload)
    assert response.status_code == 201, response.text
    return response.json()["data"]


@pytest.mark.asyncio
async def test_create_deal(client: AsyncClient, auth_headers: dict):
    deal = await _create_deal(client, auth_headers, "Enterprise Renewal", "12000.00")
    assert deal["name"] == "Enterprise Renewal"
    assert deal["status"] == "open"
    assert deal["probability"] == 50


@pytest.mark.asyncio
async def test_list_search_and_filter_deals(client: AsyncClient, auth_headers: dict):
    await _create_deal(client, auth_headers, "Alpha Expansion", "1000.00")
    await _create_deal(client, auth_headers, "Beta Expansion", "5000.00")

    response = await client.get("/api/v1/deals?search=Alpha", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()["data"]["data"]
    assert any(item["name"] == "Alpha Expansion" for item in items)

    filtered = await client.get("/api/v1/deals?min_amount=2000", headers=auth_headers)
    assert filtered.status_code == 200
    filtered_items = filtered.json()["data"]["data"]
    assert all(float(item["amount"]) >= 2000 for item in filtered_items if item["amount"] is not None)


@pytest.mark.asyncio
async def test_update_and_delete_deal(client: AsyncClient, auth_headers: dict):
    deal = await _create_deal(client, auth_headers, "Quarterly Close", "4000.00")

    update_response = await client.put(
        f"/api/v1/deals/{deal['id']}",
        headers=auth_headers,
        json={"status": "qualified", "probability": 75, "notes": "Updated for review"},
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["status"] == "qualified"
    assert updated["probability"] == 75

    delete_response = await client.delete(f"/api/v1/deals/{deal['id']}", headers=auth_headers)
    assert delete_response.status_code == 204

    get_response = await client.get(f"/api/v1/deals/{deal['id']}", headers=auth_headers)
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_convert_lead_to_deal_creates_timeline_event(
    client: AsyncClient,
    auth_headers: dict,
    db_session,
):
    me = await _get_me(client, auth_headers)
    company = await _create_company(client, auth_headers, "Conversion Co")
    contact = await _create_contact(
        client,
        auth_headers,
        "Ava",
        "Stone",
        "ava.stone@conversionco.com",
        company_id=company["id"],
    )
    lead = await _create_lead(
        client,
        auth_headers,
        "Conversion Lead",
        owner_id=me["id"],
        company_id=company["id"],
        contact_id=contact["id"],
        estimated_value="9100.00",
    )

    response = await client.post(f"/api/v1/leads/{lead['id']}/convert", headers=auth_headers)
    assert response.status_code == 201, response.text
    deal = response.json()["data"]
    assert deal["name"] == "Conversion Lead"
    assert deal["company_id"] == company["id"]
    assert deal["contact_id"] == contact["id"]
    assert deal["owner_id"] == me["id"]

    lead_row = await db_session.execute(select(Lead).where(Lead.id == UUID(lead["id"])))
    stored_lead = lead_row.scalar_one()
    assert stored_lead.status == "converted"

    event_row = await db_session.execute(
        select(ActivityTimeline).where(ActivityTimeline.entity_id == UUID(deal["id"]))
    )
    activity = event_row.scalar_one()
    assert activity.action == "created_from_lead"
    assert activity.entity_type == "deal"
    assert activity.payload["lead_id"] == lead["id"]
    assert activity.payload["deal_id"] == deal["id"]


@pytest.mark.asyncio
async def test_duplicate_lead_conversion_is_rejected(client: AsyncClient, auth_headers: dict):
    me = await _get_me(client, auth_headers)
    lead = await _create_lead(client, auth_headers, "Duplicate Conversion", owner_id=me["id"])

    first_response = await client.post(f"/api/v1/leads/{lead['id']}/convert", headers=auth_headers)
    assert first_response.status_code == 201, first_response.text

    second_response = await client.post(f"/api/v1/leads/{lead['id']}/convert", headers=auth_headers)
    assert second_response.status_code == 409
    assert second_response.json()["error_code"] == "CONFLICT"


@pytest.mark.asyncio
async def test_list_activity_timeline_api(client: AsyncClient, auth_headers: dict):
    me = await _get_me(client, auth_headers)
    lead = await _create_lead(client, auth_headers, "Timeline Lead", owner_id=me["id"])

    convert_response = await client.post(f"/api/v1/leads/{lead['id']}/convert", headers=auth_headers)
    assert convert_response.status_code == 201, convert_response.text
    deal = convert_response.json()["data"]

    response = await client.get(f"/api/v1/activity?entity_type=deal&entity_id={deal['id']}", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()["data"]["data"]
    assert any(item["entity_id"] == deal["id"] and item["action"] == "created_from_lead" for item in items)
