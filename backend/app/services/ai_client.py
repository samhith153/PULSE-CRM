"""HTTP client for the PULSE AI Service.

The AI service is a stateless compute service: the backend gathers data from
its database, sends raw lead data over HTTP, and persists the returned results.
The AI service never touches the database directly.

Optimizations:
- Uses a shared httpx.AsyncClient singleton for connection pooling (avoids
  reconnecting on every request).
"""
from __future__ import annotations

import ipaddress
import logging
from typing import Any, Optional
from urllib.parse import urlparse

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── SSRF Protection ──────────────────────────────────────────────────────────
_ALLOWED_AI_HOSTS: frozenset[str] = frozenset({
    "localhost", "127.0.0.1", "::1",
    "pulse-crm-backend.onrender.com",
})
_BLOCKED_NETWORKS: frozenset[str] = frozenset({
    "169.254.169.254",  # AWS metadata
    "metadata.google.internal",  # GCP metadata
})


def _validate_ai_url(url: str) -> None:
    """Raise ValueError if the URL targets a blocked or private network."""
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    if hostname in _BLOCKED_NETWORKS:
        raise ValueError(f"Blocked metadata endpoint: {hostname}")
    if hostname not in _ALLOWED_AI_HOSTS:
        try:
            addr = ipaddress.ip_address(hostname)
            if addr.is_private or addr.is_loopback or addr.is_link_local:
                return  # Allow private/loopback in dev
            raise ValueError(f"Non-allowlisted host: {hostname}")
        except ValueError:
            if settings.ENVIRONMENT != "development":
                raise ValueError(f"Non-allowlisted host in production: {hostname}")


# Shared httpx.AsyncClient — reused across all AIClient instances to
# avoid TCP connection setup overhead per AI service call.
_shared_client: httpx.AsyncClient | None = None


def _get_shared_client(timeout: float | None = None) -> httpx.AsyncClient:
    global _shared_client
    if _shared_client is None or _shared_client.is_closed:
        _shared_client = httpx.AsyncClient(
            timeout=timeout or settings.AI_SERVICE_TIMEOUT,
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10, keepalive_expiry=30),
        )
    return _shared_client


class AIClient:
    """Thin HTTP client wrapping the AI service endpoints."""

    def __init__(self, base_url: Optional[str] = None, timeout: Optional[float] = None) -> None:
        self.base_url = (base_url or settings.AI_SERVICE_URL).rstrip("/")
        _validate_ai_url(self.base_url)
        self.timeout = timeout or settings.AI_SERVICE_TIMEOUT
        self._client = _get_shared_client(self.timeout)

    async def close(self) -> None:
        pass  # Shared client lifecycle is managed at app level

    async def _post(self, path: str, payload: dict) -> Optional[dict]:
        """POST JSON to the AI service and return parsed JSON or None on failure."""
        try:
            logger.info("[AI_CLIENT] POST %s", path)
            response = await self._client.post(f"{self.base_url}{path}", json=payload)
            if response.status_code >= 400:
                logger.warning(
                    "[AI_CLIENT] %d from %s",
                    response.status_code, path,
                )
                return None
            return response.json()
        except httpx.HTTPError as exc:
            logger.warning("[AI_CLIENT] Request failed (%s %s): %s", path, self.base_url, type(exc).__name__)
            return None
        except ValueError as exc:
            logger.warning("[AI_CLIENT] Invalid JSON from %s: %s", path, type(exc).__name__)
            return None

    # ── Lead scoring ──────────────────────────────────────────────────────
    async def score_lead(self, lead_id: str, raw_data: dict[str, Any]) -> Optional[dict]:
        """POST /api/v1/leads/score with raw lead data."""
        payload = {"lead_id": str(lead_id), **raw_data}
        return await self._post("/api/v1/leads/score", payload)

    async def assess_lead(self, lead_id: str, raw_data: dict[str, Any]) -> Optional[dict]:
        """POST /api/v1/leads/assess — unified scoring + recommendation."""
        payload = {"lead_id": str(lead_id), **raw_data}
        return await self._post("/api/v1/leads/assess", payload)

    # ── Recommendations ───────────────────────────────────────────────────
    async def recommend(self, raw_data: dict[str, Any]) -> Optional[dict]:
        """POST /api/v1/recommendations/recommend with raw lead data."""
        return await self._post("/api/v1/recommendations/recommend", raw_data)

    async def batch_recommend(self, leads: list[dict[str, Any]]) -> Optional[dict]:
        """POST /api/v1/recommendations/batch for multiple leads."""
        return await self._post("/api/v1/recommendations/batch", {"leads": leads})

    # ── Conversation AI / summarization ───────────────────────────────────
    async def summarise(
        self,
        thread_id: str,
        messages: list[dict[str, Any]],
        contact_id: Optional[str] = None,
        deal_id: Optional[str] = None,
    ) -> Optional[dict]:
        """POST /api/v1/conversations/summarise."""
        payload: dict[str, Any] = {
            "thread_id": thread_id,
            "messages": messages,
        }
        if contact_id:
            payload["contact_id"] = contact_id
        if deal_id:
            payload["deal_id"] = deal_id
        return await self._post("/api/v1/conversations/summarise", payload)
    

    async def draft_email(
        self,
        recipient_name: str,
        recipient_email: str,
        company: Optional[str] = None,
        designation: Optional[str] = None,
        purpose: str = "follow_up",
        context: Optional[str] = None,
        sender_name: Optional[str] = None,
    ) -> Optional[dict]:
        """POST /api/v1/conversations/draft-email — generate a fresh outreach draft."""
        payload: dict[str, Any] = {
            "recipient_name": recipient_name,
            "recipient_email": recipient_email,
            "purpose": purpose,
        }
        if company:
            payload["company"] = company
        if designation:
            payload["designation"] = designation
        if context:
            payload["context"] = context
        if sender_name:
            payload["sender_name"] = sender_name
        return await self._post("/api/v1/conversations/draft-email", payload)