"""Pydantic schemas for Email Account model."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class EmailAccountBase(BaseModel):
    """Base email account schema."""

    email: EmailStr
    provider: str = Field(pattern="^(aws_ses|sendgrid)$", description="Email service provider")
    daily_limit: int = Field(default=50, ge=1, le=1000, description="Maximum emails per day")


class EmailAccountCreate(EmailAccountBase):
    """Schema for creating email account."""

    smtp_config: Dict[str, Any] = Field(
        default_factory=dict,
        description="SMTP/API configuration"
    )


class EmailAccountUpdate(BaseModel):
    """Schema for updating email account."""

    daily_limit: Optional[int] = Field(None, ge=1, le=1000)
    warm_up_stage: Optional[str] = Field(None, pattern="^(new|warming|warmed|active)$")
    health_score: Optional[int] = Field(None, ge=0, le=100)
    is_active: Optional[bool] = None


class EmailAccountResponse(EmailAccountBase):
    """Schema for email account response."""

    id: UUID
    smtp_config: Dict[str, Any]
    daily_sent: int
    warm_up_stage: str
    health_score: int
    last_sent_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
