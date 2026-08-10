"""Per-client token-bucket rate limiting middleware.

* `burst` controls the maximum burst size (bucket capacity).
* `requests_per_minute` controls the sustained refill rate (tokens/sec = rpm / 60).

A client can consume up to `burst` tokens in a single burst, then is limited to
the sustained rate.  Tokens refill continuously between requests.
"""
from __future__ import annotations

import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import settings
from app.schemas.common import ErrorResponse


class _TokenBucket:
    """Thread-safe (single-threaded event loop) per-client token bucket."""
    __slots__ = ("capacity", "tokens", "refill_rate", "last_refill")

    def __init__(self, capacity: float, refill_rate: float) -> None:
        self.capacity = capacity
        self.tokens = capacity
        self.refill_rate = refill_rate   # tokens per second
        self.last_refill = time.monotonic()

    def take(self) -> bool:
        """Refill and attempt to consume one token. Returns True if allowed."""
        now = time.monotonic()
        elapsed = now - self.last_refill
        if elapsed > 0:
            self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
            self.last_refill = now

        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False

    @property
    def remaining(self) -> int:
        return max(0, int(self.tokens))


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        requests_per_minute: int | None = None,
        burst: int | None = None,
        enabled: bool | None = None,
    ) -> None:
        super().__init__(app)
        self.enabled = settings.ENABLE_RATE_LIMIT if enabled is None else enabled
        self.rpm = requests_per_minute or settings.RATE_LIMIT_PER_MINUTE
        self.burst = burst or settings.RATE_LIMIT_BURST
        self._refill_rate = self.rpm / 60.0  # tokens per second
        self._buckets: dict[str, _TokenBucket] = defaultdict(
            lambda: _TokenBucket(self.burst, self._refill_rate)
        )

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

        key = self._client_key(request)
        bucket = self._buckets[key]

        if not bucket.take():
            content = ErrorResponse(
                error_code="RATE_LIMIT_EXCEEDED",
                message="Too many requests. Please slow down.",
                details=[],
                request_id=request.headers.get("x-request-id", "system"),
            ).model_dump()
            response = JSONResponse(status_code=429, content=content)
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
            return response

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.burst)
        response.headers["X-RateLimit-Remaining"] = str(bucket.remaining)
        return response
