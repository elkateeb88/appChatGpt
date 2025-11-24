"""Email account model for managing sending accounts."""

from sqlalchemy import Column, String, Integer, Boolean, TIMESTAMP, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.database import Base


class EmailAccount(Base):
    """Email account for sending outreach emails."""

    __tablename__ = "email_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)

    # Provider: 'aws_ses', 'sendgrid'
    provider = Column(String(50), nullable=False)

    # SMTP/API configuration (stored as JSON)
    smtp_config = Column(JSON, default={})

    # Rate limiting
    daily_limit = Column(Integer, default=50)
    daily_sent = Column(Integer, default=0)

    # Warm-up stage: new, warming, warmed, active
    warm_up_stage = Column(String(50), default='new')

    # Health score (0-100)
    health_score = Column(Integer, default=100)

    # Activity tracking
    last_sent_at = Column(TIMESTAMP(timezone=True))

    # Status
    is_active = Column(Boolean, default=True)

    # Metadata
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<EmailAccount(email='{self.email}', provider='{self.provider}', health={self.health_score})>"

    def can_send(self) -> bool:
        """Check if account can send email based on daily limit."""
        from datetime import datetime, timezone

        # Reset daily counter if new day
        if self.last_sent_at:
            last_sent_date = self.last_sent_at.date()
            today = datetime.now(timezone.utc).date()
            if last_sent_date < today:
                self.daily_sent = 0

        return self.is_active and self.daily_sent < self.daily_limit and self.health_score > 30
