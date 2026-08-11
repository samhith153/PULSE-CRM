"""
SalesTarget Schemas
Pydantic models for request/response validation.
"""
from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class SalesTargetCreate(BaseModel):
    rep_id: UUID
    target_type: str = Field(default="revenue", pattern="^(revenue|deals|activities)$")
    target_amount: Decimal = Field(ge=0)
    period_type: str = Field(default="monthly", pattern="^(monthly|quarterly|yearly)$")
    period_start: date
    period_end: date
    notes: Optional[str] = None


class SalesTargetUpdate(BaseModel):
    target_amount: Optional[Decimal] = Field(default=None, ge=0)
    notes: Optional[str] = None


class SalesTargetResponse(BaseModel):
    id: UUID
    rep_id: UUID
    rep_name: str
    rep_email: str
    target_type: str
    target_amount: Decimal
    period_type: str
    period_start: date
    period_end: date
    notes: Optional[str] = None
    actual_amount: Decimal = Decimal("0")
    achievement_pct: Decimal = Decimal("0")
    remaining: Decimal = Decimal("0")
    status: str = "not_started"  # not_started | on_track | behind | achieved | exceeded
    created_at: str

    model_config = {"from_attributes": True}


class SalesTargetListResponse(BaseModel):
    targets: list[SalesTargetResponse]
    total: int
