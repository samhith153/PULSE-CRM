"""
Company Schemas (Pydantic V2)
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.company import Company
from app.utils.validators import validate_url, validate_phone


class CompanyCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255, examples=["TechNova Solutions"])
    domain: Optional[str] = Field(default=None, max_length=255)
    website: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=30)
    address: Optional[str] = None
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    country: Optional[str] = Field(default=None, max_length=100)
    zip_code: Optional[str] = Field(default=None, max_length=20)
    industry: Optional[str] = Field(default=None, max_length=100)
    current_crm: Optional[str] = Field(default=None, max_length=100)
    operational_system: Optional[str] = Field(default=None, max_length=100)
    company_type: Optional[str] = Field(default=None, max_length=50)
    employee_count: Optional[int] = Field(default=None, ge=0)
    annual_revenue: Optional[str] = None
    linkedin_url: Optional[str] = Field(default=None, max_length=500)
    twitter_url: Optional[str] = Field(default=None, max_length=500)

    @field_validator("website", "linkedin_url", "twitter_url", mode="before")
    @classmethod
    def _validate_url(cls, v):
        return validate_url(v)

    @field_validator("phone", mode="before")
    @classmethod
    def _validate_phone(cls, v):
        return validate_phone(v)


class CompanyUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    domain: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    zip_code: Optional[str] = None
    industry: Optional[str] = None
    current_crm: Optional[str] = Field(default=None, max_length=100)
    operational_system: Optional[str] = Field(default=None, max_length=100)
    company_type: Optional[str] = None
    employee_count: Optional[int] = Field(default=None, ge=0)
    annual_revenue: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None

    @field_validator("website", "linkedin_url", "twitter_url", mode="before")
    @classmethod
    def _validate_url(cls, v):
        return validate_url(v)

    @field_validator("phone", mode="before")
    @classmethod
    def _validate_phone(cls, v):
        return validate_phone(v)


class CompanyResponse(BaseModel):
    id: UUID
    name: str
    domain: Optional[str]
    website: Optional[str]
    description: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    zip_code: Optional[str]
    industry: Optional[str]
    current_crm: Optional[str]
    operational_system: Optional[str]
    company_type: Optional[str]
    employee_count: Optional[int]
    annual_revenue: Optional[str]
    linkedin_url: Optional[str]
    twitter_url: Optional[str]
    owner_id: Optional[UUID]
    organization_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    owner_name: Optional[str] = None

    model_config = {"from_attributes": True}

    @staticmethod
    def from_company(company: Company) -> "CompanyResponse":
        return CompanyResponse(
            id=company.id,
            name=company.name,
            domain=company.domain,
            website=company.website,
            description=company.description,
            email=company.email,
            phone=company.phone,
            address=company.address,
            city=company.city,
            state=company.state,
            country=company.country,
            zip_code=company.zip_code,
            industry=company.industry,
            current_crm=company.current_crm,
            operational_system=company.operational_system,
            company_type=company.company_type,
            employee_count=company.employee_count,
            annual_revenue=company.annual_revenue,
            linkedin_url=company.linkedin_url,
            twitter_url=company.twitter_url,
            owner_id=company.owner_id,
            organization_id=company.organization_id,
            is_active=company.is_active,
            created_at=company.created_at,
            updated_at=company.updated_at,
            owner_name=company.owner.full_name if company.owner else None,
        )
