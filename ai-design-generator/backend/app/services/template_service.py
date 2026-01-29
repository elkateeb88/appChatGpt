"""Template service for CRUD operations."""
from pathlib import Path
from uuid import UUID
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
import shutil
import logging

from app.models.template import Template, Generation
from app.schemas.template import TemplateCreate, TemplateUpdate, LayerInfo
from app.services.psd_parser import PSDParser
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class TemplateService:
    """Service for template CRUD operations."""

    def __init__(self, db: AsyncSession):
        """Initialize service with database session.

        Args:
            db: Async database session.
        """
        self.db = db

    async def create_from_upload(
        self,
        file_path: Path,
        filename: str,
        data: TemplateCreate
    ) -> Template:
        """Create template from uploaded PSD file.

        Args:
            file_path: Path to uploaded PSD file.
            filename: Original filename.
            data: Template creation data.

        Returns:
            Created Template instance.
        """
        # Parse PSD
        parser = PSDParser(file_path)

        # Get dimensions
        dimensions = parser.get_dimensions()

        # Get layers
        layers = parser.get_all_layers()

        # Generate thumbnail
        thumbnail_filename = f"{file_path.stem}_thumb.png"
        thumbnail_path = settings.thumbnails_path / thumbnail_filename
        parser.generate_thumbnail(thumbnail_path)

        # Suggest category if not provided
        category = data.category or parser.suggest_category()
        subcategory = data.subcategory or parser.suggest_subcategory()

        # Create template record
        template = Template(
            name=data.name,
            filename=filename,
            category=category,
            subcategory=subcategory,
            width=dimensions["width"],
            height=dimensions["height"],
            text_layers=layers["text_layers"],
            image_layers=layers["image_layers"],
            psd_path=str(file_path),
            thumbnail_path=str(thumbnail_path),
            tags=data.tags or [],
        )

        self.db.add(template)
        await self.db.flush()
        await self.db.refresh(template)

        parser.close()

        logger.info(f"Created template: {template.id} - {template.name}")
        return template

    async def get_by_id(self, template_id: UUID) -> Template | None:
        """Get template by ID.

        Args:
            template_id: Template UUID.

        Returns:
            Template or None if not found.
        """
        result = await self.db.execute(
            select(Template).where(Template.id == template_id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        category: str | None = None,
        is_active: bool = True,
        page: int = 1,
        per_page: int = 20,
        search: str | None = None
    ) -> tuple[list[Template], int]:
        """Get all templates with filtering.

        Args:
            category: Filter by category.
            is_active: Filter by active status.
            page: Page number (1-indexed).
            per_page: Items per page.
            search: Search query for name/tags.

        Returns:
            Tuple of (templates list, total count).
        """
        # Base query
        query = select(Template).where(Template.is_active == is_active)

        # Apply category filter
        if category:
            query = query.where(Template.category == category)

        # Apply search filter
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                Template.name.ilike(search_pattern) |
                Template.tags.any(search)
            )

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0

        # Apply pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)

        # Order by created date (newest first)
        query = query.order_by(Template.created_at.desc())

        # Execute query
        result = await self.db.execute(query)
        templates = list(result.scalars().all())

        return templates, total

    async def update(
        self,
        template_id: UUID,
        data: TemplateUpdate
    ) -> Template | None:
        """Update template.

        Args:
            template_id: Template UUID.
            data: Update data.

        Returns:
            Updated Template or None if not found.
        """
        template = await self.get_by_id(template_id)

        if not template:
            return None

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)

        await self.db.flush()
        await self.db.refresh(template)

        logger.info(f"Updated template: {template_id}")
        return template

    async def delete(self, template_id: UUID) -> bool:
        """Delete template and associated files.

        Args:
            template_id: Template UUID.

        Returns:
            True if deleted, False if not found.
        """
        template = await self.get_by_id(template_id)

        if not template:
            return False

        # Delete files
        try:
            if template.psd_path:
                Path(template.psd_path).unlink(missing_ok=True)
            if template.thumbnail_path:
                Path(template.thumbnail_path).unlink(missing_ok=True)
        except Exception as e:
            logger.error(f"Error deleting template files: {e}")

        # Delete from database
        await self.db.delete(template)

        logger.info(f"Deleted template: {template_id}")
        return True

    async def search(
        self,
        query: str,
        category: str | None = None,
        limit: int = 10
    ) -> list[Template]:
        """Search templates by query.

        Args:
            query: Search query.
            category: Optional category filter.
            limit: Maximum results.

        Returns:
            List of matching templates.
        """
        search_pattern = f"%{query}%"

        stmt = select(Template).where(
            Template.is_active == True,
            (
                Template.name.ilike(search_pattern) |
                Template.tags.any(query) |
                Template.category.ilike(search_pattern) |
                Template.subcategory.ilike(search_pattern)
            )
        )

        if category:
            stmt = stmt.where(Template.category == category)

        stmt = stmt.limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_categories(self) -> list[str]:
        """Get all unique categories.

        Returns:
            List of category names.
        """
        result = await self.db.execute(
            select(Template.category)
            .where(Template.is_active == True)
            .distinct()
        )
        return [r for r in result.scalars().all() if r]


class GenerationService:
    """Service for generation tracking."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        template_id: UUID | None,
        user_prompt: str,
        replacements: dict | None = None
    ) -> Generation:
        """Create a new generation record.

        Args:
            template_id: ID of template used.
            user_prompt: User's original prompt.
            replacements: Applied replacements.

        Returns:
            Created Generation instance.
        """
        generation = Generation(
            template_id=template_id,
            user_prompt=user_prompt,
            replacements=replacements,
            status="pending"
        )

        self.db.add(generation)
        await self.db.flush()
        await self.db.refresh(generation)

        return generation

    async def update_status(
        self,
        generation_id: UUID,
        status: str,
        output_path: str | None = None,
        error_message: str | None = None
    ) -> Generation | None:
        """Update generation status.

        Args:
            generation_id: Generation UUID.
            status: New status.
            output_path: Path to output file (if completed).
            error_message: Error message (if failed).

        Returns:
            Updated Generation or None.
        """
        result = await self.db.execute(
            select(Generation).where(Generation.id == generation_id)
        )
        generation = result.scalar_one_or_none()

        if not generation:
            return None

        generation.status = status
        if output_path:
            generation.output_path = output_path
        if error_message:
            generation.error_message = error_message

        await self.db.flush()
        await self.db.refresh(generation)

        return generation

    async def get_by_id(self, generation_id: UUID) -> Generation | None:
        """Get generation by ID."""
        result = await self.db.execute(
            select(Generation)
            .options(selectinload(Generation.template))
            .where(Generation.id == generation_id)
        )
        return result.scalar_one_or_none()
