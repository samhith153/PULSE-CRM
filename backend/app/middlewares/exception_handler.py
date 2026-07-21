"""
Global Exception Handler
Maps domain exceptions → HTTP responses with the standard error envelope.
"""
from fastapi import Request
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
        request_id=request_id_var.get("system"),
    ).model_dump()



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

    return JSONResponse(
        status_code=status_code,
        content=_error_body(exc.code, exc.message, details),
    )


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
    return JSONResponse(
        status_code=422,
        content=_error_body(
            "VALIDATION_ERROR",
            "Request validation failed. Check the 'details' field.",
            details,
        ),
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for unexpected server errors."""
    logger.exception("Unexpected error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content=_error_body(
            "INTERNAL_SERVER_ERROR",
            "An unexpected error occurred. Please try again later.",
        ),
    )
