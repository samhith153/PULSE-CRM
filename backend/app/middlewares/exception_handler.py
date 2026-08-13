"""
Global Exception Handler
Maps domain exceptions ΓåÆ HTTP responses with the standard error envelope.
"""
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

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


def _duplicate_field_from_integrity_error(exc: IntegrityError) -> str | None:
    text = str(getattr(exc, "orig", exc)).lower()
    field_by_constraint = {
        "ux_companies_org_normalized_name": "name",
        "uq_company_name_per_org": "name",
        "ux_companies_org_normalized_email": "email",
        "ux_companies_org_normalized_phone": "phone",
        "ux_contacts_org_normalized_email": "email",
        "uq_contact_email_per_org": "email",
        "ux_contacts_org_normalized_phone": "phone",
        "ux_leads_org_normalized_email": "email",
        "ux_leads_org_normalized_phone": "phone",
    }
    for constraint, field in field_by_constraint.items():
        if constraint in text:
            return field
    return None

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
    """Pydantic V2 validation errors ΓåÆ 422 with field-level details."""
    details = [
        ErrorDetail(
            field=" ΓåÆ ".join(str(loc) for loc in err["loc"]),
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
    """FastAPI HTTPException ΓåÆ standard error envelope."""
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
    if isinstance(exc, IntegrityError):
        field = _duplicate_field_from_integrity_error(exc)
        if field:
            logger.warning("Duplicate resource blocked by database unique index: %s", field)
            return _add_cors_headers(JSONResponse(
                status_code=409,
                content=_error_body(
                    "DUPLICATE_RESOURCE",
                    "A record with this value already exists.",
                    [ErrorDetail(field=field, message="A record with this value already exists.")],
                ),
            ))
    msg = str(exc)
    if "EMAXCONNSESSION" in msg or "pool" in msg.lower() and "exhausted" in msg.lower():
        logger.warning("DB pool exhausted on %s %s: %s", request.method, request.url.path, msg)
        return _add_cors_headers(JSONResponse(
            status_code=503,
            content=_error_body(
                "SERVICE_UNAVAILABLE",
                "Database connection pool is temporarily exhausted. Please try again in a few seconds.",
            ),
        ))
    logger.exception("Unexpected error on %s %s", request.method, request.url.path)
    return _add_cors_headers(JSONResponse(
        status_code=500,
        content=_error_body(
            "INTERNAL_SERVER_ERROR",
            "An unexpected error occurred. Please try again later.",
        ),
    ))
