"""
Contact Schemas (Pydantic V2)
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.utils.validators import validate_url, validate_phone


class ContactCreateRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100, examples=["Alice"])
    last_name: str = Field(min_length=1, max_length=100, examples=["Walker"])
    email: EmailStr = Field(examples=["alice@example.com"])
    phone: Optional[str] = Field(default=None, max_length=30)
    mobile: Optional[str] = Field(default=None, max_length=30)
    job_title: Optional[str] = Field(default=None, max_length=100)
    department: Optional[str] = Field(default=None, max_length=100)
    linkedin_url: Optional[str] = Field(default=None, max_length=500)
    twitter_url: Optional[str] = Field(default=None, max_length=500)
    address: Optional[str] = None
    city: Optional[str] = Field(default=None, max_length=100)
    country: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = None
    company_id: Optional[UUID] = None

    @field_validator("linkedin_url", "twitter_url", mode="before")
    @classmethod
    def _validate_url(cls, v):
        return validate_url(v)

    @field_validator("phone", "mobile", mode="before")
    @classmethod
    def _validate_phone(cls, v):
        return validate_phone(v)


class ContactUpdateRequest(BaseModel):
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    notes: Optional[str] = None
    company_id: Optional[UUID] = None

    @field_validator("linkedin_url", "twitter_url", mode="before")
    @classmethod
    def _validate_url(cls, v):
        return validate_url(v)

    @field_validator("phone", "mobile", mode="before")
    @classmethod
    def _validate_phone(cls, v):
        return validate_phone(v)


class ContactResponse(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: Optional[str]
    mobile: Optional[str]
    job_title: Optional[str]
    department: Optional[str]
    linkedin_url: Optional[str]
    twitter_url: Optional[str]
    address: Optional[str]
    city: Optional[str]
    country: Optional[str]
    notes: Optional[str]
    company_id: Optional[UUID]
    owner_id: Optional[UUID]
    organization_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
