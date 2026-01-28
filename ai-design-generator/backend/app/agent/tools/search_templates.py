"""Tool for searching templates."""
from langchain_core.tools import tool
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from typing import Annotated
import json

from app.models.template import Template
from app.config import get_settings

settings = get_settings()


# Create engine for tool usage (outside of request context)
_engine = create_async_engine(settings.database_url)
_async_session = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


@tool
async def search_templates_tool(
    query: Annotated[str, "Search query describing the type of template needed"],
    category: Annotated[str | None, "Optional category filter (post, story, cover, etc.)"] = None,
) -> str:
    """Search for templates in the library.

    Use this tool to find suitable templates based on user's request.
    Returns a list of matching templates with their details.

    Args:
        query: Search query (e.g., "coffee offer", "product announcement")
        category: Optional category filter

    Returns:
        JSON string with list of matching templates
    """
    async with _async_session() as db:
        # Build query
        search_pattern = f"%{query}%"

        stmt = select(Template).where(
            Template.is_active == True
        )

        # Apply category filter if specified
        if category:
            stmt = stmt.where(Template.category == category)

        # Search in name, tags, subcategory
        stmt = stmt.where(
            Template.name.ilike(search_pattern) |
            Template.subcategory.ilike(search_pattern) |
            Template.tags.any(query)
        )

        stmt = stmt.limit(5)

        result = await db.execute(stmt)
        templates = list(result.scalars().all())

        # If no results with search, get all templates in category
        if not templates:
            stmt = select(Template).where(Template.is_active == True)
            if category:
                stmt = stmt.where(Template.category == category)
            stmt = stmt.limit(5)
            result = await db.execute(stmt)
            templates = list(result.scalars().all())

        # Format results
        results = []
        for t in templates:
            results.append({
                "id": str(t.id),
                "name": t.name,
                "category": t.category,
                "subcategory": t.subcategory,
                "dimensions": f"{t.width}x{t.height}",
                "text_layers": [layer.get("name") for layer in t.text_layers],
                "image_layers": [layer.get("name") for layer in t.image_layers],
                "tags": t.tags,
            })

        if not results:
            return json.dumps({
                "status": "no_templates",
                "message": "No templates found. Please upload templates first."
            })

        return json.dumps({
            "status": "success",
            "count": len(results),
            "templates": results
        })
