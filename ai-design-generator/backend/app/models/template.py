"""Template and Generation database models."""
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, Text, ForeignKey, ARRAY, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from .database import Base


class Template(Base):
    """Template model for storing PSD template metadata."""

    __tablename__ = "templates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)

    # Category
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    subcategory: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Dimensions
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)

    # Layers (JSON)
    text_layers: Mapped[dict] = mapped_column(JSON, default=list)
    image_layers: Mapped[dict] = mapped_column(JSON, default=list)

    # Paths
    psd_path: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Meta
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    generations: Mapped[list["Generation"]] = relationship(
        "Generation",
        back_populates="template",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Template {self.name} ({self.category})>"


class Generation(Base):
    """Generation model for tracking design generation requests."""

    __tablename__ = "generations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    template_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("templates.id", ondelete="SET NULL"),
        nullable=True
    )

    user_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    replacements: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    output_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Relationships
    template: Mapped[Template | None] = relationship(
        "Template",
        back_populates="generations"
    )

    def __repr__(self) -> str:
        return f"<Generation {self.id} ({self.status})>"
