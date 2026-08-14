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
    _CLEANUP_INTERVAL = 300  # seconds
    _BUCKET_IDLE_TTL = 300   # evict buckets idle > 5 min

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
        self._last_cleanup = time.monotonic()

    def _cleanup_stale_buckets(self) -> None:
        now = time.monotonic()
        if now - self._last_cleanup < self._CLEANUP_INTERVAL:
            return
        self._last_cleanup = now
        stale = [k for k, b in self._buckets.items()
                 if now - b.last_refill > self._BUCKET_IDLE_TTL]
        for k in stale:
            del self._buckets[k]

    def _client_key(self, request: Request) -> str:
        """Client identity for rate limiting.

        X-Forwarded-For is only honored when the direct peer is a trusted
        proxy; otherwise the header can be spoofed per-request to bypass
        the limit.
        """
        direct_peer = request.client.host if request.client else None
        if direct_peer in settings.trusted_proxy_ips_list:
            forwarded_for = request.headers.get("x-forwarded-for")
            if forwarded_for:
                return forwarded_for.split(",", 1)[0].strip()
        if direct_peer:
            return direct_peer
        return "unknown"

    async def dispatch(self, request: Request, call_next) -> Response:
        if not self.enabled:
            return await call_next(request)
        if request.url.path in {"/", settings.DOCS_URL, settings.REDOC_URL, settings.OPENAPI_URL}:
            return await call_next(request)

        self._cleanup_stale_buckets()
        key = self._client_key(request)
        bucket = self._buckets[key]

        if not bucket.take():
            content = ErrorResponse(
                error_code="RATE_LIMIT_EXCEEDED",
                message="Too many requests. Please slow down.",
                details=[],
                request_id=request.headers.get("x-request-id", "system"),
            ).model_dump()
            # CORS headers are applied by CORSMiddleware (registered outermost),
            # matching the configured origins/credentials — never a bare "*"
            # combined with credentials, which browsers reject and is unsafe.
            return JSONResponse(status_code=429, content=content)

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.burst)
        response.headers["X-RateLimit-Remaining"] = str(bucket.remaining)
        return response


# ── Strict auth rate limiter ──────────────────────────────────────────────────

# Paths that receive brute-force protection (stricter limits).
_AUTH_PATHS: frozenset[str] = frozenset({
    "/api/v1/auth/login",
    "/api/v1/auth/refresh",
    "/api/v1/auth/google",
})

_PASSWORD_RESET_PATHS: frozenset[str] = frozenset({
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
})


class AuthRateLimitMiddleware(BaseHTTPMiddleware):
    """Separate, stricter token-bucket for auth endpoints (login, refresh, password reset).

    Prevents credential-stuffing / brute-force attacks independently of the
    global rate limit applied to all other routes.
    """

    _CLEANUP_INTERVAL = 300
    _BUCKET_IDLE_TTL = 300

    def __init__(self, app) -> None:
        super().__init__(app)
        self.enabled = settings.ENABLE_RATE_LIMIT
        self._buckets: dict[str, _TokenBucket] = defaultdict(
            lambda: _TokenBucket(settings.AUTH_RATE_LIMIT_BURST,
                                 settings.AUTH_RATE_LIMIT_PER_MINUTE / 60.0)
        )
        self._pw_buckets: dict[str, _TokenBucket] = defaultdict(
            lambda: _TokenBucket(settings.PASSWORD_RESET_RATE_LIMIT_BURST,
                                 settings.PASSWORD_RESET_RATE_LIMIT_PER_MINUTE / 60.0)
        )
        self._last_cleanup = time.monotonic()

    def _cleanup_stale_buckets(self) -> None:
        now = time.monotonic()
        if now - self._last_cleanup < self._CLEANUP_INTERVAL:
            return
        self._last_cleanup = now
        stale = [k for k, b in self._buckets.items()
                 if now - b.last_refill > self._BUCKET_IDLE_TTL]
        for k in stale:
            del self._buckets[k]
        stale_pw = [k for k, b in self._pw_buckets.items()
                    if now - b.last_refill > self._BUCKET_IDLE_TTL]
        for k in stale_pw:
            del self._pw_buckets[k]

    def _client_key(self, request: Request) -> str:
        """Client identity for rate limiting.

        X-Forwarded-For is only honored when the direct peer is a trusted
        proxy; otherwise the header can be spoofed per-request to bypass
        the limit.
        """
        direct_peer = request.client.host if request.client else None
        if direct_peer in settings.trusted_proxy_ips_list:
            forwarded_for = request.headers.get("x-forwarded-for")
            if forwarded_for:
                return forwarded_for.split(",", 1)[0].strip()
        if direct_peer:
            return direct_peer
        return "unknown"

    async def dispatch(self, request: Request, call_next) -> Response:
        if not self.enabled:
            return await call_next(request)

        self._cleanup_stale_buckets()
        path = request.url.path.rstrip("/")
        key = self._client_key(request)

        bucket: _TokenBucket | None = None
        if path in _AUTH_PATHS:
            bucket = self._buckets[key]
        elif path in _PASSWORD_RESET_PATHS:
            bucket = self._pw_buckets[key]

        if bucket is not None and not bucket.take():
            content = ErrorResponse(
                error_code="AUTH_RATE_LIMIT_EXCEEDED",
                message="Too many authentication attempts. Please wait before retrying.",
                details=[],
                request_id=request.headers.get("x-request-id", "system"),
            ).model_dump()
            response = JSONResponse(status_code=429, content=content)
            response.headers["Retry-After"] = "60"
            return response

        return await call_next(request)


# ── Security headers ──────────────────────────────────────────────────────────

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds hardened security response headers to every response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        if not settings.SECURITY_HEADERS_ENABLED:
            return response

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        response.headers["Pragma"] = "no-cache"

        # HSTS only over HTTPS (skip localhost / http dev servers)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                f"max-age={settings.HSTS_MAX_AGE}; includeSubDomains"
            )

        # Content-Security-Policy — applied to API responses (JSON) for defense-in-depth
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'"
        )

        return response
