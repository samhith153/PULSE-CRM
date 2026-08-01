"""
Shared Pydantic schemas used across all domains:
  - PaginationParams  — query param model for list endpoints
  - PaginatedResponse — generic paginated wrapper
  - StandardResponse  — standardised success envelope
  - ErrorResponse     — standardised error envelope
"""
from typing import Generic, List, Optional, TypeVar
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

DataT = TypeVar("DataT")


# ── Pagination ────────────────────────────────────────────────────────────────

class PaginationParams(BaseModel):
    """Parsed from query string: ?page=1&page_size=20&search=acme"""
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    search: Optional[str] = Field(default=None, description="Free-text search term")
    sort_by: Optional[str] = Field(default=None, description="Field to sort by")
    sort_order: str = Field(default="asc", pattern="^(asc|desc)$")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    model_config = ConfigDict(populate_by_name=True)


class PaginationMeta(BaseModel):
    """Pagination metadata embedded inside PaginatedResponse."""
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel, Generic[DataT]):
    """Generic paginated list wrapper."""
    data: List[DataT]
    meta: PaginationMeta

    @classmethod
    def create(
        cls,
        data: List[DataT],
        total: int,
        page: int,
        page_size: int,
    ) -> "PaginatedResponse[DataT]":
        total_pages = max(1, (total + page_size - 1) // page_size)
        return cls(
            data=data,
            meta=PaginationMeta(
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
                has_next=page < total_pages,
                has_prev=page > 1,
            ),
        )


# ── Standard Response Envelope ────────────────────────────────────────────────

class StandardResponse(BaseModel, Generic[DataT]):
    """
    Every successful API response is wrapped in this envelope.
    {
        "success": true,
        "message": "...",
        "data": { ... }
    }
    """
    success: bool = True
    message: str = "OK"
    data: Optional[DataT] = None

    model_config = ConfigDict(populate_by_name=True)


class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str


class ErrorResponse(BaseModel):
    """
    Standard error envelope returned for all 4xx/5xx responses.
    {
        "success": false,
        "error_code": "NOT_FOUND",
        "message": "...",
        "details": []
    }
    """
    success: bool = False
    error_code: str
    message: str
    details: List[ErrorDetail] = []
    request_id: Optional[str] = None
