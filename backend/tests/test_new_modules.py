"""
Integration tests for new pipeline, timeline, Gmail, and AI endpoints.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models.activity import ActivityTimeline
from app.models.email import Email


async def _create_deal(client: AsyncClient, headers: dict, name: str, amount: str = "1000.00") -> dict:
    response = await client.post("/api/v1/deals", headers=headers, json={"name": name, "amount": amount})
    assert response.status_code == 201, response.text
    return response.json()["data"]


@pytest.mark.asyncio
async def test_pipeline_forecast_and_stats(client: AsyncClient, auth_headers: dict):
    deal = await _create_deal(client, auth_headers, "Forecast Deal", "2500.00")

    forecast_response = await client.get("/api/v1/pipeline/forecast", headers=auth_headers)
    assert forecast_response.status_code == 200, forecast_response.text
    forecast = forecast_response.json()["data"]
    assert forecast["total_pipeline_value"] == "2500.00"
    assert forecast["weighted_pipeline_value"] is not None
    assert len(forecast["stage_wise_forecast"]) >= 1

    stats_response = await client.get("/api/v1/pipeline/stats", headers=auth_headers)
    assert stats_response.status_code == 200, stats_response.text
    stats = stats_response.json()["data"]
    assert stats["total_deals"] >= 1
    assert stats["total_pipeline_value"] == "2500.00"
    assert "forecast" not in stats


@pytest.mark.asyncio
async def test_manual_activity_and_timeline(client: AsyncClient, auth_headers: dict, db_session):
    deal = await _create_deal(client, auth_headers, "Timeline Deal", "900.00")

    activity_response = await client.post(
        "/api/v1/activities",
        headers=auth_headers,
        json={
            "entity_type": "deal",
            "entity_id": deal["id"],
            "action": "note",
            "title": "Discovery note",
            "description": "Customer mentioned a Q4 rollout.",
            "payload": {"source": "manual"},
        },
    )
    assert activity_response.status_code == 201, activity_response.text

    timeline_response = await client.get(f"/api/v1/timeline/{deal['id']}", headers=auth_headers)
    assert timeline_response.status_code == 200, timeline_response.text
    items = timeline_response.json()["data"]["data"]
    assert any(item["title"] == "Discovery note" for item in items)

    row = await db_session.execute(ActivityTimeline.__table__.select())
    assert row.first() is not None


@pytest.mark.asyncio
async def test_gmail_sync_and_email_detail(client: AsyncClient, auth_headers: dict, db_session):
    connect_response = await client.post(
        "/api/v1/gmail/connect",
        headers=auth_headers,
        json={
            "email_address": "sales@example.com",
            "access_token": "token-123",
            "refresh_token": "refresh-123",
            "scopes_json": ["gmail.readonly"],
        },
    )
    assert connect_response.status_code == 201, connect_response.text
    connection = connect_response.json()["data"]

    sync_response = await client.post(
        "/api/v1/gmail/sync",
        headers=auth_headers,
        json={
            "gmail_connection_id": connection["id"],
            "messages": [
                {
                    "gmail_message_id": "msg-1",
                    "thread_id": "thread-1",
                    "direction": "inbound",
                    "sender": "customer@example.com",
                    "receiver": "sales@example.com",
                    "subject": "Project Update",
                    "body_preview": "Can we schedule a call?",
                    "sent_at": "2026-07-13T10:00:00Z",
                    "attachment_metadata": [],
                    "raw_payload": {"source": "gmail"},
                    "external_entity_type": "deal",
                    "external_entity_id": None,
                    "is_read": False,
                }
            ],
        },
    )
    assert sync_response.status_code == 200, sync_response.text
    sync_data = sync_response.json()["data"]
    assert sync_data["synced_count"] == 1

    email_id = sync_data["emails"][0]["id"]
    detail_response = await client.get(f"/api/v1/emails/{email_id}", headers=auth_headers)
    assert detail_response.status_code == 200, detail_response.text
    detail = detail_response.json()["data"]
    assert detail["gmail_message_id"] == "msg-1"

    duplicate_response = await client.post(
        "/api/v1/gmail/sync",
        headers=auth_headers,
        json={
            "gmail_connection_id": connection["id"],
            "messages": [
                {
                    "gmail_message_id": "msg-1",
                    "thread_id": "thread-1",
                    "direction": "inbound",
                    "sender": "customer@example.com",
                    "receiver": "sales@example.com",
                    "subject": "Project Update",
                    "body_preview": "Can we schedule a call?",
                    "sent_at": "2026-07-13T10:00:00Z",
                    "attachment_metadata": [],
                    "raw_payload": {"source": "gmail"},
                    "external_entity_type": "deal",
                    "external_entity_id": None,
                    "is_read": False,
                }
            ],
        },
    )
    assert duplicate_response.status_code == 200, duplicate_response.text
    assert duplicate_response.json()["data"]["skipped_count"] == 1

    email_row = await db_session.execute(Email.__table__.select())
    assert email_row.first() is not None


@pytest.mark.asyncio
async def test_ai_job_and_stream(client: AsyncClient, auth_headers: dict):
    job_response = await client.post(
        "/api/v1/ai/jobs",
        headers=auth_headers,
        json={"job_type": "lead_score", "entity_type": "lead"},
    )
    assert job_response.status_code == 200, job_response.text
    job = job_response.json()
    assert job["job_type"] == "lead_score"

    stream_response = await client.get("/api/v1/ai/stream", headers=auth_headers)
    assert stream_response.status_code == 200, stream_response.text
