"""
Recommendation feature schemas.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.utils.enums import MeetingAttendanceStatus


class RecommendationFeatureCreateRequest(BaseModel):
    lead_id: UUID
    current_score: Optional[float] = None
    current_stage: Optional[str] = Field(default=None, max_length=50)
    days_since_last_activity: Optional[int] = Field(default=None, ge=0)
    reply_received_flag: bool = False
    deal_value: Optional[Decimal] = Field(default=None, ge=0)
    email_open_count: int = Field(default=0, ge=0)
    email_opened_no_reply_flag: bool = False
    meeting_attendance_status: Optional[MeetingAttendanceStatus] = None
    rep_active_action_count: int = Field(default=0, ge=0)
    best_contact_time_slot: Optional[str] = Field(default=None, max_length=50)
    has_upcoming_activity: bool = False
    stage_dwell_time: Optional[int] = Field(default=None, ge=0)


class RecommendationFeatureUpdateRequest(BaseModel):
    current_score: Optional[float] = None
    current_stage: Optional[str] = Field(default=None, max_length=50)
    days_since_last_activity: Optional[int] = Field(default=None, ge=0)
    reply_received_flag: Optional[bool] = None
    deal_value: Optional[Decimal] = Field(default=None, ge=0)
    email_open_count: Optional[int] = Field(default=None, ge=0)
    email_opened_no_reply_flag: Optional[bool] = None
    meeting_attendance_status: Optional[MeetingAttendanceStatus] = None
    rep_active_action_count: Optional[int] = Field(default=None, ge=0)
    best_contact_time_slot: Optional[str] = Field(default=None, max_length=50)
    has_upcoming_activity: Optional[bool] = None
    stage_dwell_time: Optional[int] = Field(default=None, ge=0)


class RecommendationFeatureResponse(BaseModel):
    id: UUID
    lead_id: UUID
    organization_id: UUID
    current_score: Optional[float]
    current_stage: Optional[str]
    days_since_last_activity: Optional[int]
    reply_received_flag: bool
    deal_value: Optional[Decimal]
    email_open_count: int
    email_opened_no_reply_flag: bool
    meeting_attendance_status: Optional[MeetingAttendanceStatus]
    rep_active_action_count: int
    best_contact_time_slot: Optional[str]
    has_upcoming_activity: bool
    stage_dwell_time: Optional[int]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
