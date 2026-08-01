"""Simple per-client rate limiting middleware."""
from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int | None = None, burst: int | None = None, enabled: bool | None = None) -> None:
        super().__init__(app)
        self.enabled = settings.ENABLE_RATE_LIMIT if enabled is None else enabled
        self.requests_per_minute = requests_per_minute or settings.RATE_LIMIT_PER_MINUTE
        self.burst = burst or settings.RATE_LIMIT_BURST
        self.window_seconds = 60.0
        self._requests: dict[str, Deque[float]] = defaultdict(deque)

    def _client_key(self, request: Request) -> str:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",", 1)[0].strip()
        if request.client:
            return request.client.host
        return "unknown"

    async def dispatch(self, request: Request, call_next) -> Response:
        if not self.enabled:
            return await call_next(request)
        if request.url.path in {"/", settings.DOCS_URL, settings.REDOC_URL, settings.OPENAPI_URL}:
            return await call_next(request)

        now = time.monotonic()
        cutoff = now - self.window_seconds
        key = self._client_key(request)
        bucket = self._requests[key]
        while bucket and bucket[0] <= cutoff:
            bucket.popleft()

        limit = max(self.requests_per_minute, self.burst)
        if len(bucket) >= limit:
            return JSONResponse(
                status_code=429,
                content={
                    "error_code": "RATE_LIMIT_EXCEEDED",
                    "message": "Too many requests. Please slow down.",
                    "details": [],
                    "request_id": request.headers.get("x-request-id", "system"),
                },
            )

        bucket.append(now)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - len(bucket)))
        return response



