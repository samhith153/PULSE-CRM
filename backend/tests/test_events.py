from __future__ import annotations

from httpx import AsyncClient

from app.models.event_outbox import EventOutbox
from app.services.email_service import EmailService


async def test_forgot_password_invokes_email_send(client: AsyncClient, seed_roles, monkeypatch):
    called = {}

    async def fake_send_password_reset_email(self, user, reset_token, expires_at):
        called["email"] = user.email
        called["token"] = reset_token
        called["expires_at"] = expires_at
        return True

    monkeypatch.setattr(EmailService, "send_password_reset_email", fake_send_password_reset_email)

    await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Reset User",
            "email": "reset.user@example.com",
            "password": "Secur3P@ss",
            "organization_name": "Reset Org",
        },
    )

    response = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "reset.user@example.com"},
    )

    assert response.status_code == 200
    assert called["email"] == "reset.user@example.com"
    assert called["token"]
    assert called["expires_at"] is not None


async def test_forgot_password_unknown_email_still_200(client: AsyncClient, seed_roles, monkeypatch):
    async def fail_if_called(*args, **kwargs):
        raise AssertionError("email should not be sent for unknown users")

    monkeypatch.setattr(EmailService, "send_password_reset_email", fail_if_called)

    response = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "missing@example.com"},
    )

    assert response.status_code == 200


async def test_events_list_and_detail(client: AsyncClient, seed_roles, monkeypatch, db_session):
    async def noop_email(*args, **kwargs):
        return True

    monkeypatch.setattr(EmailService, "send_welcome_email", noop_email)

    register = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Event User",
            "email": "events.user@example.com",
            "password": "Secur3P@ss",
            "organization_name": "Event Org",
        },
    )
    assert register.status_code == 201, register.text

    list_response = await client.get("/api/v1/events")
    assert list_response.status_code == 200, list_response.text
    data = list_response.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1

    event_id = data["items"][0]["id"]
    detail_response = await client.get(f"/api/v1/events/{event_id}")
    assert detail_response.status_code == 200, detail_response.text
    detail = detail_response.json()
    assert detail["id"] == event_id
    assert detail["event_type"]

    row = await db_session.execute(EventOutbox.__table__.select())
    assert row.first() is not None
