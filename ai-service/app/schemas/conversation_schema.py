"""Conversation AI (email summarization) request/response schemas."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class Message(BaseModel):
    """A single email message."""

    sender: str
    recipients: List[str] = Field(default_factory=list)
    subject: str = ""
    body: str
    timestamp: Optional[str] = None
    direction: str = "incoming"

    @field_validator("direction")
    @classmethod
    def validate_direction(cls, v: str) -> str:
        if v not in {"incoming", "outgoing"}:
            raise ValueError("direction must be incoming or outgoing")
        return v


class ConversationRequest(BaseModel):
    thread_id: str = Field(..., min_length=3)
    messages: List[Message]
    contact_id: Optional[str] = None
    deal_id: Optional[str] = None

    @field_validator("thread_id")
    @classmethod
    def validate_thread_id(cls, v: str) -> str:
        if not v or len(v) < 3:
            raise ValueError("thread_id must be at least 3 characters")
        return v

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, v: List[Message]) -> List[Message]:
        if not v:
            raise ValueError("messages cannot be empty")
        return v


class ConversationResponse(BaseModel):
    thread_id: str
    summary: str
    summary_word: str = "neutral"
    sentiment: str = "neutral"
    intent: str = "other"
    confidence: float = 0.0
    key_points: List[str] = Field(default_factory=list)
    action_items: List[str] = Field(default_factory=list)
    category: Optional[str] = None
    draft_reply: Optional[str] = None
    follow_up_suggestion: Optional[str] = None
    follow_up_timing: Optional[str] = None
    processing_time_ms: Optional[int] = None
    model_version: Optional[str] = None
