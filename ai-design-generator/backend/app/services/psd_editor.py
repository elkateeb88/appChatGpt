"""PSD Editor service for modifying templates and generating outputs."""
from pathlib import Path
from typing import Any
from psd_tools import PSDImage
from psd_tools.api.layers import TypeLayer
from PIL import Image, ImageDraw, ImageFont
import logging
import os

logger = logging.getLogger(__name__)

# Default fonts directory
FONTS_DIR = Path(__file__).parent.parent.parent / "fonts"


class PSDEditor:
    """Edit PSD templates and generate output images."""

    # Default fonts for Arabic and English text
    DEFAULT_FONTS = {
        "arabic": "Cairo-Regular.ttf",
        "english": "Roboto-Regular.ttf",
        "default": "Cairo-Regular.ttf"
    }

    def __init__(self, psd_path: str | Path):
        """Initialize editor with PSD file path.

        Args:
            psd_path: Path to the PSD file.
        """
        self.psd_path = Path(psd_path)
        self.psd = PSDImage.open(self.psd_path)
        self._text_replacements: dict[str, str] = {}
        self._image_replacements: dict[str, str | Path] = {}

    def set_text(self, layer_name: str, new_text: str) -> "PSDEditor":
        """Set replacement text for a layer.

        Args:
            layer_name: Name of the text layer.
            new_text: New text content.

        Returns:
            Self for method chaining.
        """
        self._text_replacements[layer_name] = new_text
        return self

    def set_image(self, layer_name: str, image_path: str | Path) -> "PSDEditor":
        """Set replacement image for a layer.

        Args:
            layer_name: Name of the image layer.
            image_path: Path to the new image.

        Returns:
            Self for method chaining.
        """
        self._image_replacements[layer_name] = Path(image_path)
        return self

    def set_replacements(
        self,
        text_replacements: dict[str, str] | None = None,
        image_replacements: dict[str, str | Path] | None = None
    ) -> "PSDEditor":
        """Set all replacements at once.

        Args:
            text_replacements: Dictionary of layer_name -> new_text.
            image_replacements: Dictionary of layer_name -> image_path.

        Returns:
            Self for method chaining.
        """
        if text_replacements:
            self._text_replacements.update(text_replacements)
        if image_replacements:
            self._image_replacements.update(
                {k: Path(v) for k, v in image_replacements.items()}
            )
        return self

    def render(self, output_path: str | Path) -> Path:
        """Render the modified PSD to an image file.

        Args:
            output_path: Path for the output image.

        Returns:
            Path to the generated image.
        """
        output_path = Path(output_path)

        # Start with composite image
        result = self.psd.composite()

        # If RGBA, convert for processing
        if result.mode != 'RGBA':
            result = result.convert('RGBA')

        # Apply text replacements by rendering on top
        if self._text_replacements:
            result = self._apply_text_replacements(result)

        # Apply image replacements
        if self._image_replacements:
            result = self._apply_image_replacements(result)

        # Save result
        result.save(output_path, "PNG")
        logger.info(f"Rendered output: {output_path}")

        return output_path

    def _apply_text_replacements(self, base_image: Image.Image) -> Image.Image:
        """Apply text replacements to the image.

        Args:
            base_image: Base PIL Image.

        Returns:
            Modified PIL Image.
        """
        draw = ImageDraw.Draw(base_image)

        for layer in self.psd.descendants():
            if layer.kind != 'type':
                continue

            if layer.name not in self._text_replacements:
                continue

            new_text = self._text_replacements[layer.name]

            # Get layer position and size
            x, y = layer.left, layer.top
            width, height = layer.width, layer.height

            # Clear the original text area (optional, for clean replacement)
            # Create a patch from the area below if needed

            # Get font
            font = self._get_font_for_layer(layer)

            # Detect text direction (RTL for Arabic)
            is_rtl = self._is_arabic(new_text)

            # Draw text
            self._draw_text(
                draw=draw,
                text=new_text,
                position=(x, y),
                font=font,
                area_size=(width, height),
                rtl=is_rtl
            )

        return base_image

    def _apply_image_replacements(self, base_image: Image.Image) -> Image.Image:
        """Apply image replacements to the image.

        Args:
            base_image: Base PIL Image.

        Returns:
            Modified PIL Image.
        """
        for layer in self.psd.descendants():
            if layer.name not in self._image_replacements:
                continue

            image_path = self._image_replacements[layer.name]

            if not image_path.exists():
                logger.warning(f"Replacement image not found: {image_path}")
                continue

            try:
                # Open replacement image
                replacement = Image.open(image_path)

                # Resize to fit layer dimensions
                layer_size = (layer.width, layer.height)
                replacement = self._fit_image(replacement, layer_size)

                # Convert to RGBA if needed
                if replacement.mode != 'RGBA':
                    replacement = replacement.convert('RGBA')

                # Paste at layer position
                base_image.paste(
                    replacement,
                    (layer.left, layer.top),
                    replacement
                )

            except Exception as e:
                logger.error(f"Failed to apply image replacement: {e}")

        return base_image

    def _get_font_for_layer(self, layer: TypeLayer) -> ImageFont.FreeTypeFont:
        """Get appropriate font for a text layer.

        Args:
            layer: PSD type layer.

        Returns:
            PIL ImageFont.
        """
        # Try to extract font size from layer
        font_size = 24  # Default size

        try:
            if hasattr(layer, 'engine_dict') and layer.engine_dict:
                style_run = layer.engine_dict.get('StyleRun', {})
                run_array = style_run.get('RunArray', [])
                if run_array:
                    style_data = run_array[0].get('StyleSheet', {}).get('StyleSheetData', {})
                    if 'FontSize' in style_data:
                        font_size = int(style_data['FontSize'])
        except Exception:
            pass

        # Scale font size based on layer height as fallback
        if font_size < 10:
            font_size = max(12, layer.height // 2)

        # Try to load font
        font_path = FONTS_DIR / self.DEFAULT_FONTS["arabic"]

        try:
            if font_path.exists():
                return ImageFont.truetype(str(font_path), font_size)
        except Exception as e:
            logger.warning(f"Could not load font: {e}")

        # Fallback to default font
        try:
            return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size)
        except Exception:
            return ImageFont.load_default()

    def _draw_text(
        self,
        draw: ImageDraw.ImageDraw,
        text: str,
        position: tuple[int, int],
        font: ImageFont.FreeTypeFont,
        area_size: tuple[int, int],
        rtl: bool = False,
        color: tuple[int, ...] = (0, 0, 0, 255)
    ):
        """Draw text on image with proper alignment.

        Args:
            draw: PIL ImageDraw object.
            text: Text to draw.
            position: (x, y) position.
            font: Font to use.
            area_size: (width, height) of text area.
            rtl: Right-to-left text direction.
            color: Text color (RGBA).
        """
        x, y = position
        area_width, area_height = area_size

        # Get text bounding box
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        # Calculate position
        if rtl:
            # Right align for RTL
            text_x = x + area_width - text_width
        else:
            text_x = x

        # Vertical center
        text_y = y + (area_height - text_height) // 2

        # Draw text
        draw.text((text_x, text_y), text, font=font, fill=color)

    def _fit_image(
        self,
        image: Image.Image,
        target_size: tuple[int, int]
    ) -> Image.Image:
        """Fit image to target size maintaining aspect ratio.

        Args:
            image: PIL Image to resize.
            target_size: Target (width, height).

        Returns:
            Resized PIL Image.
        """
        target_w, target_h = target_size
        img_w, img_h = image.size

        # Calculate scale to cover the target area
        scale = max(target_w / img_w, target_h / img_h)

        # Resize
        new_size = (int(img_w * scale), int(img_h * scale))
        image = image.resize(new_size, Image.Resampling.LANCZOS)

        # Crop to target size (center crop)
        left = (image.width - target_w) // 2
        top = (image.height - target_h) // 2
        right = left + target_w
        bottom = top + target_h

        return image.crop((left, top, right, bottom))

    @staticmethod
    def _is_arabic(text: str) -> bool:
        """Check if text contains Arabic characters.

        Args:
            text: Text to check.

        Returns:
            True if text contains Arabic.
        """
        for char in text:
            if '\u0600' <= char <= '\u06FF':
                return True
        return False

    def close(self):
        """Close PSD file and free resources."""
        self.psd = None
