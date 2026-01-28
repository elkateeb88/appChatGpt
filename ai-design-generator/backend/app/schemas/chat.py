"""Chat-related Pydantic schemas."""
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from enum import Enum


class MessageRole(str, Enum):
    """Chat message role."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class GenerationStatusEnum(str, Enum):
    """Generation status values."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ChatMessage(BaseModel):
    """A single chat message."""
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    """Request to send a message to the agent."""
    message: str = Field(..., min_length=1)
    conversation_id: str | None = None
    language: str = "ar"  # Default to Arabic


class ChatResponse(BaseModel):
    """Response from the agent."""
    message: str
    conversation_id: str
    generation_id: UUID | None = None
    output_url: str | None = None
    template_used: dict | None = None
    status: GenerationStatusEnum = GenerationStatusEnum.COMPLETED


class GenerationStatus(BaseModel):
    """Status of a generation request."""
    id: UUID
    status: GenerationStatusEnum
    output_url: str | None = None
    error_message: str | None = None
    template_id: UUID | None = None
    created_at: datetime

    class Config:
        from_attributes = True
