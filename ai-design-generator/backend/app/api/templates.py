"""Template API endpoints."""
from pathlib import Path
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import aiofiles
import logging

from app.models.database import get_db
from app.services.template_service import TemplateService
from app.schemas.template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateListResponse,
    TemplateUploadResponse,
    LayerInfo,
)
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


@router.post("/upload", response_model=TemplateUploadResponse)
async def upload_template(
    file: UploadFile = File(...),
    name: str = Form(...),
    category: str | None = Form(None),
    subcategory: str | None = Form(None),
    tags: str | None = Form(None),  # Comma-separated tags
    db: AsyncSession = Depends(get_db),
):
    """Upload a new PSD template.

    - **file**: PSD file to upload
    - **name**: Template name
    - **category**: Template category (optional, will be auto-detected)
    - **subcategory**: Template subcategory (optional)
    - **tags**: Comma-separated tags (optional)
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.psd'):
        raise HTTPException(
            status_code=400,
            detail="Only PSD files are allowed"
        )

    # Save file
    file_path = settings.templates_path / file.filename
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
    except Exception as e:
        logger.error(f"Failed to save uploaded file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save file")

    # Parse tags
    tag_list = [t.strip() for t in tags.split(',')] if tags else None

    # Create template data
    template_data = TemplateCreate(
        name=name,
        category=category,
        subcategory=subcategory,
        tags=tag_list,
    )

    # Create template
    try:
        service = TemplateService(db)
        template = await service.create_from_upload(
            file_path=file_path,
            filename=file.filename,
            data=template_data,
        )

        # Get suggested category from parser (already applied in service)
        from app.services.psd_parser import PSDParser
        parser = PSDParser(file_path)
        suggested_category = parser.suggest_category()
        parser.close()

        return TemplateUploadResponse(
            id=template.id,
            name=template.name,
            filename=template.filename,
            width=template.width,
            height=template.height,
            text_layers=[LayerInfo(**layer) for layer in template.text_layers],
            image_layers=[LayerInfo(**layer) for layer in template.image_layers],
            suggested_category=suggested_category,
            thumbnail_url=f"/api/templates/{template.id}/thumbnail",
        )

    except Exception as e:
        # Clean up file on error
        file_path.unlink(missing_ok=True)
        logger.error(f"Failed to create template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=TemplateListResponse)
async def list_templates(
    category: str | None = Query(None, description="Filter by category"),
    search: str | None = Query(None, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
):
    """List all templates with optional filtering."""
    service = TemplateService(db)
    templates, total = await service.get_all(
        category=category,
        search=search,
        page=page,
        per_page=per_page,
    )

    return TemplateListResponse(
        templates=[
            TemplateResponse(
                id=t.id,
                name=t.name,
                filename=t.filename,
                category=t.category,
                subcategory=t.subcategory,
                width=t.width,
                height=t.height,
                text_layers=[LayerInfo(**layer) for layer in t.text_layers],
                image_layers=[LayerInfo(**layer) for layer in t.image_layers],
                psd_path=t.psd_path,
                thumbnail_path=t.thumbnail_path,
                tags=t.tags,
                is_active=t.is_active,
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
            for t in templates
        ],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get all unique template categories."""
    service = TemplateService(db)
    categories = await service.get_categories()
    return {"categories": categories}


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get template by ID."""
    service = TemplateService(db)
    template = await service.get_by_id(template_id)

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return TemplateResponse(
        id=template.id,
        name=template.name,
        filename=template.filename,
        category=template.category,
        subcategory=template.subcategory,
        width=template.width,
        height=template.height,
        text_layers=[LayerInfo(**layer) for layer in template.text_layers],
        image_layers=[LayerInfo(**layer) for layer in template.image_layers],
        psd_path=template.psd_path,
        thumbnail_path=template.thumbnail_path,
        tags=template.tags,
        is_active=template.is_active,
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


@router.get("/{template_id}/thumbnail")
async def get_template_thumbnail(
    template_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get template thumbnail image."""
    service = TemplateService(db)
    template = await service.get_by_id(template_id)

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if not template.thumbnail_path:
        raise HTTPException(status_code=404, detail="Thumbnail not available")

    thumbnail_path = Path(template.thumbnail_path)
    if not thumbnail_path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail file not found")

    return FileResponse(
        thumbnail_path,
        media_type="image/png",
        filename=f"{template.name}_thumbnail.png",
    )


@router.patch("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: UUID,
    data: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update template metadata."""
    service = TemplateService(db)
    template = await service.update(template_id, data)

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return TemplateResponse(
        id=template.id,
        name=template.name,
        filename=template.filename,
        category=template.category,
        subcategory=template.subcategory,
        width=template.width,
        height=template.height,
        text_layers=[LayerInfo(**layer) for layer in template.text_layers],
        image_layers=[LayerInfo(**layer) for layer in template.image_layers],
        psd_path=template.psd_path,
        thumbnail_path=template.thumbnail_path,
        tags=template.tags,
        is_active=template.is_active,
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


@router.delete("/{template_id}")
async def delete_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete template."""
    service = TemplateService(db)
    deleted = await service.delete(template_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Template not found")

    return {"message": "Template deleted successfully"}
