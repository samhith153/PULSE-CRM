from typing import Any

from pydantic import BaseModel, Field


class SummariseRequest(BaseModel):
    text: str = Field(..., min_length=1)
    metadata: dict[str, Any] | None = None


class SummariseResponse(BaseModel):
    summary: str
    bullets: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] | None = None
