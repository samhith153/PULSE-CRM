from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime

class Message(BaseModel):
    """Single email message."""
    sender: str
    recipients: List[str]
    subject: str
    body: str
    timestamp: str
    direction: str  # incoming / outgoing
    
    @validator('direction')
    def validate_direction(cls, v):
        if v not in ['incoming', 'outgoing']:
            raise ValueError('direction must be incoming or outgoing')
        return v

class SummariseRequest(BaseModel):
    """Request to summarise an email thread."""
    thread_id: str = Field(..., min_length=3)
    messages: List[Message]
    contact_id: Optional[str] = None
    deal_id: Optional[str] = None
    
    @validator('thread_id')
    def validate_thread_id(cls, v):
        if not v or len(v) < 3:
            raise ValueError('thread_id must be at least 3 characters')
        return v
    
    @validator('messages')
    def validate_messages(cls, v):
        if not v:
            raise ValueError('messages cannot be empty')
        return v

class SummariseResponse(BaseModel):
    """Response from summarisation."""
    thread_id: str
    summary: str
    sentiment: str  # positive / neutral / negative
    intent: str     # demo / buy / negotiate / followup / decline / other
    confidence: float  # 0.0 to 1.0
    key_points: Optional[List[str]] = []
    action_items: Optional[List[str]] = []
    processing_time_ms: Optional[int] = None
    model_version: Optional[str] = Field(default="gemini-1.5-pro-v1", alias="version")

class SummaryDB(BaseModel):
    """Database model for conversation_summaries table."""
    id: str
    thread_id: str
    summary: str
    sentiment: str
    intent: str
    confidence: float
    key_points: List[str]
    action_items: List[str]
    model_version: str
    processing_time_ms: int
    organisation_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True