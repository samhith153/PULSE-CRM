"""Assistant chat schemas."""
from typing import Any, Optional

from pydantic import BaseModel, Field


class AssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000, description="User's question or message")
    user_role: str = Field(default="sales_rep", description="User's role: admin, manager, or sales_rep")
    context: dict[str, Any] = Field(default_factory=dict, description="Optional context: current page, entity info")


class AssistantChatResponse(BaseModel):
    response: str = Field(description="Assistant's answer")
    suggestions: list[str] = Field(default_factory=list, description="Follow-up question suggestions")
