"""Lead model for storing prospect information."""

from sqlalchemy import Column, String, Integer, TIMESTAMP, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.database import Base


class Lead(Base):
    """Lead model representing a potential customer."""

    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    company = Column(String(255))
    title = Column(String(255))
    phone = Column(String(50))
    linkedin_url = Column(Text)

    # Scoring and status
    score = Column(Integer, default=0, index=True)
    status = Column(String(50), default='new', index=True)  # new, qualified, contacted, replied, converted, nurture

    # Enrichment data (flexible JSONB field)
    enrichment_data = Column(JSON, default={})

    # Metadata
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Lead(email='{self.email}', company='{self.company}', score={self.score})>"

    @property
    def full_name(self):
        """Get full name of lead."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or "Unknown"

    def to_dict(self):
        """Convert lead to dictionary."""
        return {
            "id": str(self.id),
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "company": self.company,
            "title": self.title,
            "phone": self.phone,
            "linkedin_url": self.linkedin_url,
            "score": self.score,
            "status": self.status,
            "enrichment_data": self.enrichment_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
