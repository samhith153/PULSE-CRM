"""
Lead Management Tests — Module 9
Covers: CRUD, FSM status transitions, assignment, validation rules
"""
import pytest
from httpx import AsyncClient


async def _create_lead(client, headers, title="Test Lead", **kwargs) -> dict:
    resp = await client.post(
        "/api/v1/leads", headers=headers,
        json={"title": title, **kwargs},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]


# ── Create ────────────────────────────────────────────────────────────────────

async def test_create_lead_minimal(client: AsyncClient, auth_headers):
    lead = await _create_lead(client, auth_headers, title="Minimal Lead")
    assert lead["title"] == "Minimal Lead"
    assert lead["status"] == "new"
    assert lead["currency"] == "USD"


async def test_create_lead_full(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/leads", headers=auth_headers,
        json={
            "title": "Full Lead",
            "source": "website",
            "interest": "Enterprise License",
            "estimated_value": "50000.00",
            "notes": "High priority",
        },
    )
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["source"] == "website"
    assert float(data["estimated_value"]) == 50000.0


async def test_create_lead_invalid_company(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/leads", headers=auth_headers,
        json={
            "title": "Bad Company Lead",
            "company_id": "00000000-0000-0000-0000-000000000000",
        },
    )
    assert resp.status_code == 422


# ── List & Filter ─────────────────────────────────────────────────────────────

async def test_list_leads(client: AsyncClient, auth_headers):
    await _create_lead(client, auth_headers, "Lead A")
    await _create_lead(client, auth_headers, "Lead B")
    resp = await client.get("/api/v1/leads", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["meta"]["total"] >= 2


async def test_filter_leads_by_status(client: AsyncClient, auth_headers):
    await _create_lead(client, auth_headers, "New Status Lead")
    resp = await client.get("/api/v1/leads?status=new", headers=auth_headers)
    assert resp.status_code == 200
    items = resp.json()["data"]["data"]
    assert all(l["status"] == "new" for l in items)


async def test_search_leads(client: AsyncClient, auth_headers):
    await _create_lead(client, auth_headers, "SearchableQQQ Lead")
    resp = await client.get("/api/v1/leads?search=SearchableQQQ", headers=auth_headers)
    items = resp.json()["data"]["data"]
    assert any("SearchableQQQ" in l["title"] for l in items)


# ── Status FSM ────────────────────────────────────────────────────────────────

async def test_valid_status_transition_new_to_contacted(client: AsyncClient, auth_headers):
    lead = await _create_lead(client, auth_headers, "FSM Lead 1")
    resp = await client.patch(
        f"/api/v1/leads/{lead['id']}/status",
        headers=auth_headers,
        json={"status": "contacted"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "contacted"


async def test_invalid_status_transition_new_to_won(client: AsyncClient, auth_headers):
    lead = await _create_lead(client, auth_headers, "FSM Invalid Lead")
    resp = await client.patch(
        f"/api/v1/leads/{lead['id']}/status",
        headers=auth_headers,
        json={"status": "won"},
    )
    assert resp.status_code == 422
    assert resp.json()["error_code"] == "BUSINESS_RULE_VIOLATION"


async def test_won_requires_close_reason(client: AsyncClient, auth_headers):
    lead = await _create_lead(client, auth_headers, "Won No Reason")
    lead_id = lead["id"]

    # Walk through valid FSM path
    for status in ["contacted", "qualified", "proposal_sent", "negotiation"]:
        r = await client.patch(
            f"/api/v1/leads/{lead_id}/status",
            headers=auth_headers,
            json={"status": status},
        )
        assert r.status_code == 200, f"Failed at {status}: {r.text}"

    # Won without close_reason → 422
    resp = await client.patch(
        f"/api/v1/leads/{lead_id}/status",
        headers=auth_headers,
        json={"status": "won"},
    )
    assert resp.status_code == 422


async def test_won_with_close_reason_succeeds(client: AsyncClient, auth_headers):
    lead = await _create_lead(client, auth_headers, "Won With Reason")
    lead_id = lead["id"]

    for status in ["contacted", "qualified", "proposal_sent", "negotiation"]:
        await client.patch(
            f"/api/v1/leads/{lead_id}/status",
            headers=auth_headers,
            json={"status": status},
        )

    resp = await client.patch(
        f"/api/v1/leads/{lead_id}/status",
        headers=auth_headers,
        json={"status": "won", "close_reason": "Signed 2-year contract"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "won"
    assert resp.json()["data"]["close_reason"] == "Signed 2-year contract"


async def test_lost_requires_close_reason(client: AsyncClient, auth_headers):
    lead = await _create_lead(client, auth_headers, "Lost No Reason")
    resp = await client.patch(
        f"/api/v1/leads/{lead['id']}/status",
        headers=auth_headers,
        json={"status": "lost"},
    )
    assert resp.status_code == 422


async def test_terminal_state_no_further_transition(client: AsyncClient, auth_headers):
    lead = await _create_lead(client, auth_headers, "Terminal Lead")
    lead_id = lead["id"]
    for status in ["contacted", "qualified", "proposal_sent", "negotiation"]:
        await client.patch(
            f"/api/v1/leads/{lead_id}/status",
            headers=auth_headers,
            json={"status": status},
        )
    await client.patch(
        f"/api/v1/leads/{lead_id}/status",
        headers=auth_headers,
        json={"status": "won", "close_reason": "Done"},
    )
    # Try to move won lead to contacted
    resp = await client.patch(
        f"/api/v1/leads/{lead_id}/status",
        headers=auth_headers,
        json={"status": "contacted"},
    )
    assert resp.status_code == 422


# ── Assign ────────────────────────────────────────────────────────────────────

async def test_assign_lead_to_invalid_user(client: AsyncClient, auth_headers):
    lead = await _create_lead(client, auth_headers, "Assign Lead")
    resp = await client.post(
        f"/api/v1/leads/{lead['id']}/assign",
        headers=auth_headers,
        json={"owner_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert resp.status_code == 404


# ── Delete ────────────────────────────────────────────────────────────────────

async def test_delete_lead(client: AsyncClient, auth_headers):
    lead = await _create_lead(client, auth_headers, "Delete Lead")
    del_resp = await client.delete(
        f"/api/v1/leads/{lead['id']}", headers=auth_headers
    )
    assert del_resp.status_code == 204

    get_resp = await client.get(
        f"/api/v1/leads/{lead['id']}", headers=auth_headers
    )
    assert get_resp.status_code == 404
