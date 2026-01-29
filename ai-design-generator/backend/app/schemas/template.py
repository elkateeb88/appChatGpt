"""Template-related Pydantic schemas."""
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class LayerInfo(BaseModel):
    """Information about a PSD layer."""
    name: str
    content: str | None = None
    position: dict[str, int] = Field(default_factory=lambda: {"x": 0, "y": 0})
    size: dict[str, int] = Field(default_factory=lambda: {"width": 0, "height": 0})
    layer_type: str = "text"


class TemplateCreate(BaseModel):
    """Schema for creating a new template."""
    name: str = Field(..., min_length=1, max_length=255)
    category: str | None = None
    subcategory: str | None = None
    tags: list[str] | None = None


class TemplateUpdate(BaseModel):
    """Schema for updating a template."""
    name: str | None = Field(None, min_length=1, max_length=255)
    category: str | None = None
    subcategory: str | None = None
    tags: list[str] | None = None
    is_active: bool | None = None


class TemplateResponse(BaseModel):
    """Schema for template response."""
    id: UUID
    name: str
    filename: str
    category: str | None
    subcategory: str | None
    width: int
    height: int
    text_layers: list[LayerInfo]
    image_layers: list[LayerInfo]
    psd_path: str
    thumbnail_path: str | None
    tags: list[str] | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TemplateListResponse(BaseModel):
    """Schema for template list response."""
    templates: list[TemplateResponse]
    total: int
    page: int = 1
    per_page: int = 20


class TemplateUploadResponse(BaseModel):
    """Schema for template upload response with parsed info."""
    id: UUID
    name: str
    filename: str
    width: int
    height: int
    text_layers: list[LayerInfo]
    image_layers: list[LayerInfo]
    suggested_category: str | None
    thumbnail_url: str | None
