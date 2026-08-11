"""HTTP client for the PULSE AI Service.

The AI service is a stateless compute service: the backend gathers data from
its database, sends raw lead data over HTTP, and persists the returned results.
The AI service never touches the database directly.

Optimizations:
- Uses a shared httpx.AsyncClient singleton for connection pooling (avoids
  reconnecting on every request).
"""
from __future__ import annotations

import logging
from typing import Any, Optional
from urllib.parse import urlparse

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── SSRF protection: allowed AI service URL patterns ────────────────────────
# Only these hostnames/IPs are permitted as AI_SERVICE_URL targets.
_ALLOWED_AI_HOSTS: frozenset[str] = frozenset({
    "localhost",
    "127.0.0.1",
    "::1",
    "pulse-crm-backend.onrender.com",
    # Add your AI microservice hostname here when deploying
})

_BLOCKED_NETWORKS: frozenset[str] = frozenset({
    "169.254.169.254",  # AWS metadata
    "metadata.google.internal",  # GCP metadata
    "169.254.170.2",  # AWS ECS container metadata
})


def _validate_ai_url(url: str) -> None:
    """Raise ValueError if the URL points to a disallowed or dangerous host.

    Prevents SSRF if AI_SERVICE_URL is ever influenced by user input or
    a misconfigured environment.
    """
    parsed = urlparse(url)
    host = parsed.hostname or ""

    if host in _BLOCKED_NETWORKS:
        raise ValueError(f"AI_SERVICE_URL指向被阻止的网络端点: {host}")

    # Block private / link-local IPs (10.x, 172.16-31.x, 192.168.x, 169.254.x)
    if host:
        parts = host.split(".")
        if len(parts) == 4:
            try:
                first = int(parts[0])
                second = int(parts[1])
                # 10.0.0.0/8
                if first == 10:
                    raise ValueError(f"AI_SERVICE_URL指向私有网络: {host}")
                # 172.16.0.0/12
                if first == 172 and 16 <= second <= 31:
                    raise ValueError(f"AI_SERVICE_URL指向私有网络: {host}")
                # 192.168.0.0/16
                if first == 192 and second == 168:
                    raise ValueError(f"AI_SERVICE_URL指向私有网络: {host}")
                # 169.254.0.0/16 (link-local)
                if first == 169 and second == 254:
                    raise ValueError(f"AI_SERVICE_URL指向链路本地地址: {host}")
                # 127.0.0.0/8 (loopback — allowed via _ALLOWED_AI_HOSTS check above)
                if first == 127:
                    pass  # allowed
            except ValueError:
                raise
            except (ValueError, IndexError):
                pass

    if host not in _ALLOWED_AI_HOSTS and not settings.is_development:
        raise ValueError(
            f"AI_SERVICE_URL主机 '{host}' 不在允许列表中。"
            f"允许的主机: {', '.join(sorted(_ALLOWED_AI_HOSTS))}"
        )

# ── Shared HTTP client (connection-pooled) ─────────────────────────────────
_shared_client: Optional[httpx.AsyncClient] = None


def _get_shared_client() -> httpx.AsyncClient:
    """Return a process-level shared httpx.AsyncClient.

    The client reuses TCP connections via httpx's built-in connection pool,
    eliminating the overhead of re-establishing TLS handshakes on every
    request to the AI service.
    """
    global _shared_client
    if _shared_client is None or _shared_client.is_closed:
        _shared_client = httpx.AsyncClient(
            timeout=settings.AI_SERVICE_TIMEOUT,
            limits=httpx.Limits(
                max_connections=20,
                max_keepalive_connections=10,
                keepalive_expiry=30,
            ),
        )
    return _shared_client


class AIClient:
    """Thin HTTP client wrapping the AI service endpoints."""

    def __init__(self, base_url: Optional[str] = None, timeout: Optional[float] = None) -> None:
        self.base_url = (base_url or settings.AI_SERVICE_URL).rstrip("/")
        _validate_ai_url(self.base_url)
        self.timeout = timeout or settings.AI_SERVICE_TIMEOUT
        self._client = _get_shared_client()

    async def close(self) -> None:
        # No-op: shared client lives for the process lifetime.
        # Individual requests are cleaned up by the connection pool.
        pass

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