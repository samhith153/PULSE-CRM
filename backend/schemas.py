from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional

# --- Base Schemas ---
class TokenSchema(BaseModel):
    access_token: str
    token_type: str

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: Optional[str] = None
    initial_role: Optional[str] = "Sales Representative"

class UserResponse(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# --- Authentication ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    user: UserResponse

# --- Role & Permissions ---
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleResponse(RoleBase):
    id: UUID

    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role_id: UUID

class UserRoleUpdateResponse(BaseModel):
    user_id: UUID
    updated_role: str
    timestamp: datetime

# --- Companies ---
class CompanyBase(BaseModel):
    name: str
    domain: Optional[str] = None
    industry: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    industry: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: UUID
    owner_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Contacts ---
class ContactBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    job_title: Optional[str] = None

class ContactCreate(ContactBase):
    company_id: UUID

class ContactResponse(ContactBase):
    id: UUID
    company_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# --- Leads ---
class LeadBase(BaseModel):
    title: str
    description: Optional[str] = None
    value: Optional[float] = None
    source: Optional[str] = None

class LeadCreate(LeadBase):
    contact_id: UUID

class LeadResponse(LeadBase):
    id: UUID
    contact_id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class LeadConvertRequest(BaseModel):
    name: str
    initial_stage_order: int = 1

class LeadConvertResponse(BaseModel):
    deal_id: UUID
    lead_id: UUID
    company_id: UUID
    value: float
    status: str
    stage_id: UUID

# --- Deals ---
class DealResponse(BaseModel):
    id: UUID
    name: str
    value: float
    stage_id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class DealStageUpdate(BaseModel):
    stage_id: UUID

# --- Timeline ---
class TimelineItemResponse(BaseModel):
    id: str
    type: str  # 'activity' or 'email'
    action_type: Optional[str] = None  # e.g., 'Call', 'Meeting' (for activities) or sender's email (for emails)
    subject: str
    date: datetime
    is_incoming: Optional[bool] = None

# --- Gmail Sync ---
class SyncJobResponse(BaseModel):
    status: str
    sync_job_id: str
    message: str
