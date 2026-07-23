"""
Deal Schemas (Pydantic V2)
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.utils.enums import DealStatus


class DealCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    status: DealStatus = DealStatus.OPEN
    amount: Optional[Decimal] = Field(default=None, ge=0)
    currency: str = Field(default="USD", max_length=3)
    expected_close_date: Optional[date] = None
    probability: int = Field(default=50, ge=0, le=100)
    notes: Optional[str] = None
    owner_id: Optional[UUID] = None
    pipeline_stage_id: Optional[UUID] = None
    company_id: Optional[UUID] = None
    contact_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None


class DealUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[DealStatus] = None
    amount: Optional[Decimal] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, max_length=3)
    expected_close_date: Optional[date] = None
    probability: Optional[int] = Field(default=None, ge=0, le=100)
    notes: Optional[str] = None
    owner_id: Optional[UUID] = None
    pipeline_stage_id: Optional[UUID] = None
    company_id: Optional[UUID] = None
    contact_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None


class DealResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    status: str
    amount: Optional[Decimal]
    currency: str
    expected_close_date: Optional[date]
    probability: int
    notes: Optional[str]
    close_reason: Optional[str]
    closed_at: Optional[datetime]
    owner_id: Optional[UUID]
    pipeline_stage_id: Optional[UUID]
    company_id: Optional[UUID]
    contact_id: Optional[UUID]
    lead_id: Optional[UUID]
    organization_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}