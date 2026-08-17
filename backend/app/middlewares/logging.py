"""
HTTP Request/Response Logging Middleware
Logs method, path, status code, and latency for every request.
"""
import re
import time
from urllib.parse import parse_qs

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import get_logger

logger = get_logger("http.access")

_SENSITIVE_PARAM_RE = re.compile(r"(token|password|secret|key|access_token)", re.IGNORECASE)

# Render probes its healthCheckPath every few seconds; skip logging those
# requests so the platform's liveness pings don't clutter the logs.
_HEALTH_PATHS = {"/api/v1/health", "/health", "/api/health"}


def _redact_query(query: str) -> str:
    """Redact sensitive query parameters (e.g. JWT tokens) before logging."""
    if not query:
        return query
    parsed = parse_qs(query, keep_blank_values=True)
    parts = []
    for k, vals in parsed.items():
        for val in vals:
            if _SENSITIVE_PARAM_RE.search(k):
                parts.append(f"{k}=***")
            else:
                parts.append(f"{k}={val}")
    return "&".join(parts)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()

        response = await call_next(request)

        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        if request.url.path in _HEALTH_PATHS:
            response.headers["X-Response-Time"] = f"{duration_ms}ms"
            return response

        logger.info(
            "%s %s %s",
            request.method,
            request.url.path,
            response.status_code,
            extra={
                "method": request.method,
                "path": request.url.path,
                "query": _redact_query(str(request.url.query)),
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "client_ip": request.client.host if request.client else "unknown",
            },
        )

        response.headers["X-Response-Time"] = f"{duration_ms}ms"
        return response
