"""Pydantic schemas for request/response validation."""

from app.schemas.lead import LeadCreate, LeadUpdate, LeadResponse
from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    EmailSequenceCreate,
    EmailSequenceResponse,
)
from app.schemas.email_account import EmailAccountCreate, EmailAccountResponse

__all__ = [
    "LeadCreate",
    "LeadUpdate",
    "LeadResponse",
    "CampaignCreate",
    "CampaignUpdate",
    "CampaignResponse",
    "EmailSequenceCreate",
    "EmailSequenceResponse",
    "EmailAccountCreate",
    "EmailAccountResponse",
]
