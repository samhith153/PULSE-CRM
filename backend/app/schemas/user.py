"""
User Schemas (Pydantic V2)
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.security import check_password_strength


class UserBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=30)
    job_title: Optional[str] = Field(default=None, max_length=100)
    sales_quota: Optional[Decimal] = Field(default=None, ge=0)
    timezone: str = Field(default="UTC", max_length=50)
    locale: str = Field(default="en", max_length=10)


class UserCreateRequest(UserBase):
    password: str = Field(min_length=8)
    role_id: Optional[UUID] = Field(default=None)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        is_valid, reason = check_password_strength(v)
        if not is_valid:
            raise ValueError(f"Password {reason}")
        return v


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=30)
    job_title: Optional[str] = Field(default=None, max_length=100)
    sales_quota: Optional[Decimal] = Field(default=None, ge=0)
    timezone: Optional[str] = Field(default=None, max_length=50)
    locale: Optional[str] = Field(default=None, max_length=10)
    avatar_url: Optional[str] = Field(default=None, max_length=500)


class UserRoleAssignRequest(BaseModel):
    role_id: UUID


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    phone: Optional[str]
    job_title: Optional[str]
    sales_quota: Optional[Decimal]
    avatar_url: Optional[str]
    organization_id: UUID
    is_active: bool
    is_verified: bool
    is_deleted: bool = False
    roles: List[str] = []
    last_login_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_roles(cls, user) -> "UserResponse":
        role_names = [ur.role.name for ur in user.user_roles if ur.role]
        return cls(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            job_title=user.job_title,
            sales_quota=user.sales_quota,
            avatar_url=user.avatar_url,
            organization_id=user.organization_id,
            is_active=user.is_active,
            is_verified=user.is_verified,
            is_deleted=getattr(user, 'is_deleted', False),
            roles=role_names,
            last_login_at=user.last_login_at,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )


