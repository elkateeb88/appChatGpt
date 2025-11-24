"""Campaign and Email Sequence models."""

from sqlalchemy import Column, String, Integer, TIMESTAMP, JSON, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


class Campaign(Base):
    """Campaign model for managing outreach campaigns."""

    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)

    # User/Organization
    user_id = Column(UUID(as_uuid=True))  # Add User model later if needed

    # Status: draft, active, paused, completed, archived
    status = Column(String(50), default='draft', index=True)

    # Campaign settings (flexible JSONB)
    settings = Column(JSON, default={})

    # Metadata
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    sequences = relationship("EmailSequence", back_populates="campaign", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Campaign(name='{self.name}', status='{self.status}')>"


class EmailSequence(Base):
    """Email sequence steps within a campaign."""

    __tablename__ = "email_sequences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)

    # Sequence details
    step_number = Column(Integer, nullable=False)
    subject_template = Column(Text)
    body_template = Column(Text)
    wait_days = Column(Integer, default=3)  # Days to wait before sending this step

    # Metadata
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    campaign = relationship("Campaign", back_populates="sequences")

    def __repr__(self):
        return f"<EmailSequence(campaign_id='{self.campaign_id}', step={self.step_number})>"
