"""
Private Network Access (PNA) Middleware

Modern browsers (Chrome 130+) block HTTPS public origins from making
requests to private/localhost addresses unless the private server
explicitly grants permission via the
`Access-Control-Allow-Private-Network: true` header on the preflight
(OPTIONS) request.

This middleware ensures that header is present on every response.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class PrivateNetworkAccessMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        return response

