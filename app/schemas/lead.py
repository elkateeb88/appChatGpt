"""Pydantic schemas for Lead model."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class LeadBase(BaseModel):
    """Base lead schema with common fields."""

    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None


class LeadCreate(LeadBase):
    """Schema for creating a new lead."""

    pass


class LeadUpdate(BaseModel):
    """Schema for updating an existing lead."""

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    score: Optional[int] = Field(None, ge=0, le=10)
    status: Optional[str] = None
    enrichment_data: Optional[Dict[str, Any]] = None


class LeadResponse(LeadBase):
    """Schema for lead response."""

    id: UUID
    score: int
    status: str
    enrichment_data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LeadEnrichmentRequest(BaseModel):
    """Schema for requesting lead enrichment."""

    email: EmailStr
    force_refresh: bool = False


class LeadEnrichmentResponse(BaseModel):
    """Schema for enrichment response."""

    email: EmailStr
    enriched: bool
    data: Dict[str, Any]
    source: str
    message: Optional[str] = None
