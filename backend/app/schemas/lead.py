"""
Lead Schemas (Pydantic V2)
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.utils.enums import LeadStatus, LeadSource


class LeadCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    source: Optional[LeadSource] = None
    interest: Optional[str] = Field(default=None, max_length=100)
    industry: Optional[str] = Field(default=None, max_length=100)
    current_crm: Optional[str] = Field(default=None, max_length=100)
    location: Optional[str] = Field(default=None, max_length=150)
    operational_systems: Optional[str] = Field(default=None, max_length=255)
    estimated_value: Optional[Decimal] = Field(default=None, ge=0)
    currency: str = Field(default="USD", max_length=3)
    notes: Optional[str] = None
    company_id: Optional[UUID] = None
    contact_id: Optional[UUID] = None
    owner_id: Optional[UUID] = None


class LeadUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[LeadStatus] = None
    source: Optional[LeadSource] = None
    interest: Optional[str] = None
    industry: Optional[str] = Field(default=None, max_length=100)
    current_crm: Optional[str] = Field(default=None, max_length=100)
    location: Optional[str] = Field(default=None, max_length=150)
    operational_systems: Optional[str] = Field(default=None, max_length=255)
    estimated_value: Optional[Decimal] = Field(default=None, ge=0)
    currency: Optional[str] = None
    notes: Optional[str] = None
    close_reason: Optional[str] = None
    company_id: Optional[UUID] = None
    contact_id: Optional[UUID] = None
    owner_id: Optional[UUID] = None


class LeadAssignRequest(BaseModel):
    owner_id: UUID


class LeadStatusUpdateRequest(BaseModel):
    status: LeadStatus
    close_reason: Optional[str] = Field(
        default=None,
        description="Required when status is 'won' or 'lost'",
    )


class LeadResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    status: str
    source: Optional[str]
    interest: Optional[str]
    industry: Optional[str]
    current_crm: Optional[str]
    location: Optional[str]
    operational_systems: Optional[str]
    estimated_value: Optional[Decimal]
    currency: str
    score: Optional[int]
    notes: Optional[str]
    close_reason: Optional[str]
    company_id: Optional[UUID]
    contact_id: Optional[UUID]
    owner_id: Optional[UUID]
    organization_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
