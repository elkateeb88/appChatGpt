"""Pydantic schemas for Campaign model."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID


class EmailSequenceBase(BaseModel):
    """Base email sequence schema."""

    step_number: int = Field(ge=1, description="Sequence step number (1-indexed)")
    subject_template: str = Field(min_length=1, description="Email subject template")
    body_template: str = Field(min_length=10, description="Email body template")
    wait_days: int = Field(default=3, ge=0, description="Days to wait before sending")


class EmailSequenceCreate(EmailSequenceBase):
    """Schema for creating email sequence."""

    pass


class EmailSequenceResponse(EmailSequenceBase):
    """Schema for email sequence response."""

    id: UUID
    campaign_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class CampaignBase(BaseModel):
    """Base campaign schema."""

    name: str = Field(min_length=1, max_length=255, description="Campaign name")
    settings: Optional[Dict[str, Any]] = Field(default_factory=dict)


class CampaignCreate(CampaignBase):
    """Schema for creating campaign."""

    sequences: Optional[List[EmailSequenceCreate]] = Field(
        default_factory=list,
        description="Email sequences for this campaign"
    )


class CampaignUpdate(BaseModel):
    """Schema for updating campaign."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[str] = Field(None, pattern="^(draft|active|paused|completed|archived)$")
    settings: Optional[Dict[str, Any]] = None


class CampaignResponse(CampaignBase):
    """Schema for campaign response."""

    id: UUID
    user_id: Optional[UUID]
    status: str
    sequences: List[EmailSequenceResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CampaignAnalytics(BaseModel):
    """Schema for campaign analytics."""

    campaign_id: UUID
    total_sent: int
    open_rate: float
    click_rate: float
    reply_rate: float
    bounce_rate: float
    conversion_rate: float
