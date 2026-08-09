"""
Deal Schemas (Pydantic V2)
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.deal import Deal
from app.utils.enums import DealStatus


class DealCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    status: DealStatus = DealStatus.OPEN
    amount: Optional[Decimal] = Field(default=None, ge=0)
    currency: str = Field(default="USD", max_length=3)
    expected_close_date: Optional[date] = None
    probability: int = Field(default=50, ge=0, le=100)
    priority: Optional[str] = Field(default=None, max_length=20)
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
    priority: Optional[str] = Field(default=None, max_length=20)
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
    priority: Optional[str] = None
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
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    stage_slug: Optional[str] = None
    stage_name: Optional[str] = None

    model_config = {"from_attributes": True}

    @staticmethod
    def from_deal(deal: Deal) -> "DealResponse":
        return DealResponse(
            id=deal.id,
            name=deal.name,
            description=deal.description,
            status=deal.status,
            amount=deal.amount,
            currency=deal.currency,
            expected_close_date=deal.expected_close_date,
            probability=deal.probability,
            priority=deal.priority,
            notes=deal.notes,
            close_reason=deal.close_reason,
            closed_at=deal.closed_at,
            owner_id=deal.owner_id,
            pipeline_stage_id=deal.pipeline_stage_id,
            company_id=deal.company_id,
            contact_id=deal.contact_id,
            lead_id=deal.lead_id,
            organization_id=deal.organization_id,
            is_active=deal.is_active,
            created_at=deal.created_at,
            updated_at=deal.updated_at,
            company_name=deal.company.name if deal.company else None,
            contact_name=(
                f"{deal.contact.first_name} {deal.contact.last_name}".strip()
                if deal.contact else None
            ),
            owner_name=deal.owner.full_name if deal.owner else None,
            owner_email=deal.owner.email if deal.owner else None,
            stage_slug=deal.pipeline_stage.slug if deal.pipeline_stage else None,
            stage_name=deal.pipeline_stage.name if deal.pipeline_stage else None,
        )