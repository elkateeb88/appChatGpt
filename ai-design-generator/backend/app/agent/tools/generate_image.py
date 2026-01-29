"""Tool for generating images using Freepik API."""
from langchain_core.tools import tool
from typing import Annotated
from pathlib import Path
import httpx
import uuid
import json
import logging

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

FREEPIK_API_URL = "https://api.freepik.com/v1/ai/text-to-image"


@tool
async def generate_image_tool(
    prompt: Annotated[str, "Description of the image to generate"],
    style: Annotated[str, "Image style (photo, illustration, 3d)"] = "photo",
    aspect_ratio: Annotated[str, "Aspect ratio (1:1, 16:9, 9:16)"] = "1:1",
) -> str:
    """Generate an image using AI.

    Use this tool when the design needs a custom image that doesn't exist
    in the template's image layers.

    Args:
        prompt: Detailed description of the desired image
        style: Visual style (photo=realistic, illustration=drawn, 3d=3D render)
        aspect_ratio: Image aspect ratio

    Returns:
        JSON string with image path or error message
    """
    # Check if Freepik API key is configured
    if not settings.freepik_api_key:
        return json.dumps({
            "status": "skipped",
            "message": "Image generation not configured. Freepik API key not set."
        })

    try:
        async with httpx.AsyncClient() as client:
            # Prepare request
            headers = {
                "Authorization": f"Bearer {settings.freepik_api_key}",
                "Content-Type": "application/json",
            }

            # Map style to Freepik model
            model_map = {
                "photo": "realistic",
                "illustration": "artistic",
                "3d": "3d-render",
            }

            payload = {
                "prompt": prompt,
                "style": model_map.get(style, "realistic"),
                "aspect_ratio": aspect_ratio,
            }

            # Make request
            response = await client.post(
                FREEPIK_API_URL,
                headers=headers,
                json=payload,
                timeout=60.0,
            )

            if response.status_code != 200:
                logger.error(f"Freepik API error: {response.text}")
                return json.dumps({
                    "status": "error",
                    "message": f"Image generation failed: {response.status_code}"
                })

            data = response.json()

            # Download the generated image
            if "data" in data and data["data"]:
                image_url = data["data"][0].get("url")
                if image_url:
                    # Download image
                    img_response = await client.get(image_url)
                    if img_response.status_code == 200:
                        # Save to outputs
                        filename = f"generated_{uuid.uuid4().hex[:8]}.png"
                        output_path = settings.outputs_path / filename

                        output_path.write_bytes(img_response.content)

                        return json.dumps({
                            "status": "success",
                            "image_path": str(output_path),
                            "filename": filename
                        })

            return json.dumps({
                "status": "error",
                "message": "No image returned from API"
            })

    except httpx.TimeoutException:
        return json.dumps({
            "status": "error",
            "message": "Image generation timed out"
        })
    except Exception as e:
        logger.error(f"Image generation error: {e}")
        return json.dumps({
            "status": "error",
            "message": str(e)
        })
