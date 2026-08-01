"""
Global Exception Handler
Maps domain exceptions → HTTP responses with the standard error envelope.
"""
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from app.core.exceptions import (
    PulseCRMException,
    ValidationException,
    DuplicateException,
    InvalidCredentialsException,
    WeakPasswordException,
    UnauthorizedException,
    TokenExpiredException,
    InvalidTokenException,
    ForbiddenException,
    NotFoundException,
    ConflictException,
    BusinessRuleException,
    RateLimitException,
    ServiceUnavailableException,
)
from app.core.logging import get_logger, request_id_var
from app.schemas.common import ErrorResponse, ErrorDetail


logger = get_logger("exception_handler")


def _error_body(code: str, message: str, details: list = None) -> dict:
    return ErrorResponse(
        error_code=code,
        message=message,
        details=details or [],
        request_id=request_id_var.get() or "system",
    ).model_dump()


def _add_cors_headers(response: JSONResponse) -> JSONResponse:
    """Add CORS headers to error responses so the browser doesn't block them."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response


async def pulse_exception_handler(request: Request, exc: PulseCRMException) -> JSONResponse:
    """Maps every custom domain exception to an HTTP status code."""
    status_map = {
        ValidationException: 400,
        DuplicateException: 409,
        WeakPasswordException: 400,
        InvalidCredentialsException: 401,
        UnauthorizedException: 401,
        TokenExpiredException: 401,
        InvalidTokenException: 401,
        ForbiddenException: 403,
        NotFoundException: 404,
        ConflictException: 409,
        BusinessRuleException: 422,
        RateLimitException: 429,
        ServiceUnavailableException: 503,
    }

    status_code = status_map.get(type(exc), 500)

    if status_code >= 500:
        logger.exception("Unhandled server error: %s", exc.message)
    else:
        logger.warning("Domain exception: %s | code=%s", exc.message, exc.code)

    details = [
        ErrorDetail(field=k, message=str(v))
        for k, v in (exc.details or {}).items()
    ]

    return _add_cors_headers(JSONResponse(
        status_code=status_code,
        content=_error_body(exc.code, exc.message, details),
    ))


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Pydantic V2 validation errors → 422 with field-level details."""
    details = [
        ErrorDetail(
            field=" → ".join(str(loc) for loc in err["loc"]),
            message=err["msg"],
        )
        for err in exc.errors()
    ]
    return _add_cors_headers(JSONResponse(
        status_code=422,
        content=_error_body(
            "VALIDATION_ERROR",
            "Request validation failed. Check the 'details' field.",
            details,
        ),
    ))


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """FastAPI HTTPException → standard error envelope."""
    logger.warning("HTTPException: %s | detail=%s", exc.status_code, exc.detail)
    detail = exc.detail
    details = []
    if isinstance(detail, list):
        details = [ErrorDetail(message=str(d)) for d in detail]
        detail = "Request validation failed."
    elif isinstance(detail, dict):
        details = [ErrorDetail(field=k, message=str(v)) for k, v in detail.items()]
        detail = detail.get("message", str(detail))
    return _add_cors_headers(JSONResponse(
        status_code=exc.status_code,
        content=_error_body(
            "HTTP_ERROR",
            str(detail) if detail else "An error occurred.",
            details,
        ),
    ))


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for unexpected server errors."""
    logger.exception("Unexpected error on %s %s", request.method, request.url.path)
    return _add_cors_headers(JSONResponse(
        status_code=500,
        content=_error_body(
            "INTERNAL_SERVER_ERROR",
            "An unexpected error occurred. Please try again later.",
        ),
    ))
