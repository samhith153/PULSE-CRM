from __future__ import annotations

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.middlewares.rate_limit import RateLimitMiddleware
from app.models.ai import AIConversationSummary, AIRecommendation, AIScore
from app.models.webhook import WebhookDelivery, WebhookEndpoint


async def _create_lead(client: AsyncClient, headers: dict, title: str = "AI Lead") -> dict:
    response = await client.post(
        "/api/v1/leads",
        headers=headers,
        json={
            "title": title,
            "status": "qualified",
            "source": "website",
            "estimated_value": "75000.00",
            "current_crm": "legacy-crm",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["data"]


async def test_ai_lead_score_generates_explanation_and_persists(client: AsyncClient, auth_headers: dict, db_session):
    lead = await _create_lead(client, auth_headers)

    response = await client.post("/api/v1/ai/lead-score", headers=auth_headers, json={"lead_id": lead["id"]})

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "generated"
    assert isinstance(data["score"], int)
    assert data["explanation"]
    assert data["next_best_actions"]

    rows = await db_session.execute(AIScore.__table__.select())
    assert rows.first() is not None


async def test_ai_recommendations_and_conversation_summary_persist(client: AsyncClient, auth_headers: dict, db_session):
    lead = await _create_lead(client, auth_headers, "Recommendation Lead")

    recommendation = await client.post(
        "/api/v1/ai/recommendations",
        headers=auth_headers,
        json={"entity_type": "lead", "entity_id": lead["id"]},
    )
    assert recommendation.status_code == 200, recommendation.text
    assert recommendation.json()["recommendations"]
    assert recommendation.json()["reasoning"]

    summary = await client.post(
        "/api/v1/ai/conversation-summary",
        headers=auth_headers,
        json={"thread_id": "thread-ai-test"},
    )
    assert summary.status_code == 200, summary.text
    assert summary.json()["status"] == "generated"

    recommendation_rows = await db_session.execute(AIRecommendation.__table__.select())
    summary_rows = await db_session.execute(AIConversationSummary.__table__.select())
    assert recommendation_rows.first() is not None
    assert summary_rows.first() is not None


async def test_webhook_registration_and_enqueue(client: AsyncClient, auth_headers: dict, db_session):
    create_response = await client.post(
        "/api/v1/webhooks/endpoints",
        headers=auth_headers,
        json={
            "name": "CRM Audit Listener",
            "target_url": "https://example.com/webhook",
            "event_types": ["LEAD_CREATED"],
            "secret": "super-secret-webhook-token",
        },
    )
    assert create_response.status_code == 201, create_response.text

    enqueue_response = await client.post(
        "/api/v1/webhooks/deliveries",
        headers=auth_headers,
        json={"event_type": "LEAD_CREATED", "payload": {"lead_id": "123"}},
    )
    assert enqueue_response.status_code == 202, enqueue_response.text
    assert len(enqueue_response.json()) == 1

    endpoint_rows = await db_session.execute(WebhookEndpoint.__table__.select())
    delivery_rows = await db_session.execute(WebhookDelivery.__table__.select())
    assert endpoint_rows.first() is not None
    assert delivery_rows.first() is not None


async def test_upload_attachment_validates_and_stores(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/uploads/attachments",
        headers=auth_headers,
        files={"file": ("note.txt", b"hello pulse", "text/plain")},
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["filename"] == "note.txt"
    assert data["content_type"] == "text/plain"
    assert data["size_bytes"] == 11


async def test_upload_rejects_unsupported_content_type(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/uploads/attachments",
        headers=auth_headers,
        files={"file": ("payload.exe", b"bad", "application/x-msdownload")},
    )
    assert response.status_code == 400
    assert response.json()["error_code"] == "VALIDATION_ERROR"


async def test_rate_limit_middleware_rejects_after_limit():
    app = FastAPI()
    app.add_middleware(RateLimitMiddleware, requests_per_minute=1, burst=1, enabled=True)

    @app.get("/ping")
    async def ping():
        return {"ok": True}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        first = await client.get("/ping")
        second = await client.get("/ping")

    assert first.status_code == 200
    assert second.status_code == 429

