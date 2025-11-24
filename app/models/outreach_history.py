"""Outreach history and analytics models."""

from sqlalchemy import Column, String, Boolean, TIMESTAMP, JSON, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.database import Base


class OutreachHistory(Base):
    """Track all outreach activities for leads."""

    __tablename__ = "outreach_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # References
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)
    sequence_id = Column(UUID(as_uuid=True), ForeignKey("email_sequences.id", ondelete="SET NULL"))
    email_account_id = Column(UUID(as_uuid=True), ForeignKey("email_accounts.id", ondelete="SET NULL"))

    # Email tracking
    sent_at = Column(TIMESTAMP(timezone=True))
    opened_at = Column(TIMESTAMP(timezone=True))
    clicked_at = Column(TIMESTAMP(timezone=True))
    replied_at = Column(TIMESTAMP(timezone=True))

    # Bounce tracking
    bounced = Column(Boolean, default=False)
    bounce_reason = Column(Text)

    # Reply tracking
    reply_content = Column(Text)
    reply_sentiment = Column(String(50))  # positive, neutral, negative

    # Metadata
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<OutreachHistory(lead_id='{self.lead_id}', sent={bool(self.sent_at)}, opened={bool(self.opened_at)})>"

    @property
    def was_successful(self) -> bool:
        """Check if outreach was successful (opened or replied)."""
        return bool(self.opened_at or self.replied_at)


class AnalyticsEvent(Base):
    """Time-series analytics events for tracking."""

    __tablename__ = "analytics_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Event type: sent, opened, clicked, replied, bounced, converted
    event_type = Column(String(50), nullable=False, index=True)

    # References
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), index=True)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)

    # Flexible metadata
    metadata = Column(JSON, default={})

    # Timestamp
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)

    def __repr__(self):
        return f"<AnalyticsEvent(type='{self.event_type}', campaign='{self.campaign_id}')>"
