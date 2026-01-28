"""Generation API endpoints."""
from pathlib import Path
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.models.database import get_db
from app.services.template_service import GenerationService
from app.schemas.chat import GenerationStatus, GenerationStatusEnum
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


@router.get("/{generation_id}", response_model=GenerationStatus)
async def get_generation_status(
    generation_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get the status of a generation request."""
    service = GenerationService(db)
    generation = await service.get_by_id(generation_id)

    if not generation:
        raise HTTPException(status_code=404, detail="Generation not found")

    output_url = None
    if generation.output_path and generation.status == "completed":
        # Extract filename from path
        filename = Path(generation.output_path).name
        output_url = f"/api/outputs/{filename}"

    return GenerationStatus(
        id=generation.id,
        status=GenerationStatusEnum(generation.status),
        output_url=output_url,
        error_message=generation.error_message,
        template_id=generation.template_id,
        created_at=generation.created_at,
    )


@router.get("/outputs/{filename}")
async def get_output_image(filename: str):
    """Get a generated output image."""
    # Sanitize filename to prevent directory traversal
    safe_filename = Path(filename).name
    file_path = settings.outputs_path / safe_filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Output file not found")

    return FileResponse(
        file_path,
        media_type="image/png",
        filename=safe_filename,
    )
