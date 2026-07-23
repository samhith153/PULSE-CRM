"""
Auth Schemas (Pydantic V2)
"""
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.security import check_password_strength


# ── Register ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=255, examples=["Jane Smith"])
    email: EmailStr = Field(examples=["jane@example.com"])
    password: str = Field(min_length=8, examples=["Secur3P@ss"])
    organization_name: str = Field(
        min_length=2, max_length=255, examples=["Acme Corp"]
    )

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        is_valid, reason = check_password_strength(v)
        if not is_valid:
            raise ValueError(f"Password {reason}")
        return v


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr = Field(examples=["jane@example.com"])
    password: str = Field(examples=["Secur3P@ss"])


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ── Forgot / Reset Password ───────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=10)
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        is_valid, reason = check_password_strength(v)
        if not is_valid:
            raise ValueError(f"Password {reason}")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        is_valid, reason = check_password_strength(v)
        if not is_valid:
            raise ValueError(f"Password {reason}")
        return v


# ── Current User ──────────────────────────────────────────────────────────────

class CurrentUserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    organization_id: UUID
    roles: List[str]
    permissions: List[str]
    is_verified: bool
    is_superuser: bool

    model_config = {"from_attributes": True}
