"""Tool for editing PSD templates and generating output images."""
from langchain_core.tools import tool
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from typing import Annotated
from pathlib import Path
import json
import uuid
import logging

from app.models.template import Template
from app.services.psd_editor import PSDEditor
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Create engine for tool usage
_engine = create_async_engine(settings.database_url)
_async_session = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


@tool
async def edit_psd_tool(
    template_id: Annotated[str, "UUID of the template to edit"],
    text_replacements: Annotated[str, "JSON string of layer_name: new_text mappings"],
    image_replacements: Annotated[str | None, "JSON string of layer_name: image_path mappings"] = None,
) -> str:
    """Edit a PSD template and generate output PNG.

    Use this tool as the final step to create the actual design.
    It replaces text layers with new content and exports as PNG.

    Args:
        template_id: ID of the template to use
        text_replacements: JSON mapping of layer names to new text
        image_replacements: Optional JSON mapping of layer names to image paths

    Returns:
        JSON string with output path or error message
    """
    try:
        # Parse replacements
        try:
            text_map = json.loads(text_replacements) if isinstance(text_replacements, str) else text_replacements
        except json.JSONDecodeError:
            return json.dumps({
                "status": "error",
                "message": "Invalid text_replacements JSON"
            })

        image_map = None
        if image_replacements:
            try:
                image_map = json.loads(image_replacements) if isinstance(image_replacements, str) else image_replacements
            except json.JSONDecodeError:
                pass  # Ignore invalid image replacements

        # Get template from database
        async with _async_session() as db:
            result = await db.execute(
                select(Template).where(Template.id == template_id)
            )
            template = result.scalar_one_or_none()

            if not template:
                return json.dumps({
                    "status": "error",
                    "message": f"Template not found: {template_id}"
                })

            psd_path = Path(template.psd_path)
            if not psd_path.exists():
                return json.dumps({
                    "status": "error",
                    "message": "Template PSD file not found"
                })

            # Create editor
            editor = PSDEditor(psd_path)

            # Set text replacements
            editor.set_replacements(
                text_replacements=text_map,
                image_replacements=image_map,
            )

            # Generate output
            output_filename = f"output_{uuid.uuid4().hex[:8]}.png"
            output_path = settings.outputs_path / output_filename

            editor.render(output_path)
            editor.close()

            logger.info(f"Generated output: {output_path}")

            return json.dumps({
                "status": "success",
                "output_path": str(output_path),
                "filename": output_filename,
                "download_url": f"/api/outputs/{output_filename}",
                "template_used": {
                    "id": str(template.id),
                    "name": template.name,
                }
            })

    except Exception as e:
        logger.error(f"PSD editing error: {e}")
        return json.dumps({
            "status": "error",
            "message": str(e)
        })
