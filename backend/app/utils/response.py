"""
Response Builder Utilities
Central helpers for constructing standardised API responses.
"""
from typing import Any, List, Optional, TypeVar
from fastapi.responses import JSONResponse

from app.schemas.common import (
    StandardResponse,
    ErrorResponse,
    ErrorDetail,
    PaginatedResponse,
    PaginationMeta,
)

DataT = TypeVar("DataT")


def success_response(
    data: Any = None,
    message: str = "OK",
    status_code: int = 200,
) -> dict:
    """Build a success envelope dict (suitable for FastAPI response_model)."""
    return {"success": True, "message": message, "data": data}


def created_response(data: Any = None, message: str = "Created successfully.") -> dict:
    return success_response(data=data, message=message, status_code=201)


def error_response(
    error_code: str,
    message: str,
    status_code: int = 400,
    details: Optional[List[ErrorDetail]] = None,
    request_id: Optional[str] = None,
) -> JSONResponse:
    """Build and return a JSONResponse with the error envelope."""
    body = ErrorResponse(
        error_code=error_code,
        message=message,
        details=details or [],
        request_id=request_id,
    )
    return JSONResponse(status_code=status_code, content=body.model_dump())
