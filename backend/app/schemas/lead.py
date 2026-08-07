"""
Lead Schemas (Pydantic V2)
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.lead import Lead
from app.utils.enums import LeadStatus, LeadSource


class LeadCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    source: LeadSource
    interest: Optional[str] = Field(default=None, max_length=100)
    industry: Optional[str] = Field(default=None, max_length=100)
    employee_count: Optional[int] = None
    current_crm: Optional[str] = Field(default=None, max_length=100)
    location: Optional[str] = Field(default=None, max_length=150)
    operational_systems: Optional[str] = Field(default=None, max_length=255)
    estimated_value: Optional[Decimal] = Field(default=None, ge=0)
    currency: str = Field(default="USD", max_length=3)
    notes: Optional[str] = None
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=30)
    company_name: Optional[str] = Field(default=None, max_length=255)
    job_title: Optional[str] = Field(default=None, max_length=100)
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
    employee_count: Optional[int] = None
    current_crm: Optional[str] = Field(default=None, max_length=100)
    location: Optional[str] = Field(default=None, max_length=150)
    operational_systems: Optional[str] = Field(default=None, max_length=255)
    estimated_value: Optional[Decimal] = Field(default=None, ge=0)
    currency: Optional[str] = None
    notes: Optional[str] = None
    close_reason: Optional[str] = None
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=30)
    company_name: Optional[str] = Field(default=None, max_length=255)
    job_title: Optional[str] = Field(default=None, max_length=100)
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


class LeadConvertRequest(BaseModel):
    industry: Optional[str] = Field(default=None, max_length=100)
    revenue: Optional[float] = Field(default=None, ge=0)
    employee_count: Optional[int] = Field(default=None, ge=0)
    pipeline_stage_id: Optional[str] = Field(default=None, description="Pipeline stage ID for the new deal")


class LeadResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    status: str
    source: Optional[str]
    interest: Optional[str]
    industry: Optional[str]
    employee_count: Optional[int]
    current_crm: Optional[str]
    location: Optional[str]
    operational_systems: Optional[str]
    estimated_value: Optional[Decimal]
    currency: str
    notes: Optional[str]
    close_reason: Optional[str]
    company_id: Optional[UUID]
    contact_id: Optional[UUID]
    owner_id: Optional[UUID]
    organization_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    owner_name: Optional[str] = None
    owner_avatar_url: Optional[str] = None
    score: Optional[int] = None
    fit_score: Optional[int] = None
    engagement_score: Optional[int] = None
    fit_reasons: Optional[list[str]] = None
    engagement_reasons: Optional[list[str]] = None
    top_reasons: Optional[list[str]] = None
    priority: Optional[str] = None

    model_config = {"from_attributes": True}

    @staticmethod
    def from_lead(lead: Lead) -> "LeadResponse":
        return LeadResponse(
            id=lead.id,
            title=lead.title,
            description=lead.description,
            status=lead.status,
            source=lead.source,
            interest=lead.interest,
            industry=lead.industry,
            employee_count=lead.employee_count,
            current_crm=lead.current_crm,
            location=lead.location,
            operational_systems=lead.operational_systems,
            estimated_value=lead.estimated_value,
            currency=lead.currency,
            score=lead.lead_score.overall_score if lead.lead_score else None,
            fit_score=lead.lead_score.fit_score if lead.lead_score else None,
            engagement_score=lead.lead_score.engagement_score if lead.lead_score else None,
            fit_reasons=lead.lead_score.fit_reasons if lead.lead_score else None,
            engagement_reasons=lead.lead_score.engagement_reasons if lead.lead_score else None,
            top_reasons=lead.lead_score.top_reasons if lead.lead_score else None,
            priority=lead.lead_score.priority_tier if lead.lead_score else None,
            notes=lead.notes,
            close_reason=lead.close_reason,
            company_id=lead.company_id,
            contact_id=lead.contact_id,
            owner_id=lead.owner_id,
            organization_id=lead.organization_id,
            is_active=lead.is_active,
            created_at=lead.created_at,
            updated_at=lead.updated_at,
            company_name=lead.company_name or (lead.company.name if lead.company else None),
            job_title=lead.job_title,
            contact_name=(
                f"{lead.contact.first_name} {lead.contact.last_name}".strip()
                if lead.contact else None
            ),
            contact_email=lead.email or (lead.contact.email if lead.contact else None),
            contact_phone=lead.phone or (lead.contact.phone if lead.contact else None),
            owner_name=lead.owner.full_name if lead.owner else None,
            owner_avatar_url=lead.owner.avatar_url if lead.owner else None,
        )
