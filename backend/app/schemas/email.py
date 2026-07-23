"""
Email and Gmail Integration Schemas
"""
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class AttachmentMetadata(BaseModel):
    filename: str
    content_type: Optional[str] = None
    size_bytes: Optional[int] = None
    attachment_id: Optional[str] = None
    inline: bool = False


class GmailConnectRequest(BaseModel):
    email_address: EmailStr
    access_token: str = Field(min_length=1)
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    sync_cursor: Optional[str] = None
    scopes_json: Optional[list[str]] = None


class GmailOAuthLoginResponse(BaseModel):
    authorization_url: str
    state: str


class GmailOAuthCallbackRequest(BaseModel):
    code: str = Field(min_length=1)
    state: Optional[str] = None
    email_address: Optional[EmailStr] = None


class GmailTokenRefreshRequest(BaseModel):
    gmail_connection_id: UUID


class GmailWebhookRequest(BaseModel):
    gmail_connection_id: Optional[UUID] = None
    history_id: Optional[str] = None
    email_address: Optional[EmailStr] = None
    message_ids: list[str] = Field(default_factory=list)
    payload: dict[str, Any] = Field(default_factory=dict)


class GmailConnectionResponse(BaseModel):
    id: UUID
    user_id: UUID
    email_address: EmailStr
    sync_status: str
    sync_cursor: Optional[str]
    token_expires_at: Optional[datetime]
    scopes_json: Optional[list[str]]
    organization_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmailSyncMessageRequest(BaseModel):
    gmail_message_id: str = Field(min_length=1, max_length=255)
    thread_id: Optional[str] = Field(default=None, max_length=255)
    direction: str = Field(pattern="^(inbound|outbound)$")
    sender: EmailStr
    receiver: Optional[EmailStr] = None
    subject: str = Field(min_length=1, max_length=500)
    body_preview: Optional[str] = None
    sent_at: datetime
    attachment_metadata: list[AttachmentMetadata] = Field(default_factory=list)
    raw_payload: Optional[dict] = None
    external_entity_type: Optional[str] = Field(default=None, max_length=50)
    external_entity_id: Optional[UUID] = None
    is_read: bool = False


class EmailSyncRequest(BaseModel):
    gmail_connection_id: UUID
    sync_cursor: Optional[str] = None
    count: int = Field(default=25, ge=1, le=200)
    messages: list[EmailSyncMessageRequest] = Field(default_factory=list)


class EmailResponse(BaseModel):
    id: UUID
    gmail_message_id: str
    thread_id: Optional[str]
    direction: str
    sender: str
    receiver: Optional[str]
    subject: str
    body_preview: Optional[str]
    sent_at: datetime
    attachment_metadata: list[AttachmentMetadata] = Field(default_factory=list)
    raw_payload: Optional[dict]
    is_read: bool
    gmail_connection_id: Optional[UUID]
    external_entity_type: Optional[str]
    external_entity_id: Optional[UUID]
    organization_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmailDetailResponse(EmailResponse):
    pass


class EmailSyncResultResponse(BaseModel):
    gmail_connection_id: UUID
    synced_count: int
    skipped_count: int
    next_cursor: Optional[str]
    connection_status: str
    emails: list[EmailResponse] = Field(default_factory=list)


class EmailThreadResponse(BaseModel):
    thread_id: str
    emails: list[EmailResponse] = Field(default_factory=list)


class EmailHistoryResponse(BaseModel):
    total: int
    page: int
    page_size: int
    records: list[EmailResponse] = Field(default_factory=list)
