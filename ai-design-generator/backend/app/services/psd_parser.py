"""PSD Parser service for extracting template information."""
from pathlib import Path
from typing import Any
from psd_tools import PSDImage
from PIL import Image
import logging

logger = logging.getLogger(__name__)


class PSDParser:
    """Parse PSD files and extract layer information."""

    def __init__(self, psd_path: str | Path):
        """Initialize parser with PSD file path.

        Args:
            psd_path: Path to the PSD file.
        """
        self.psd_path = Path(psd_path)
        self._psd: PSDImage | None = None

    @property
    def psd(self) -> PSDImage:
        """Lazy load PSD file."""
        if self._psd is None:
            self._psd = PSDImage.open(self.psd_path)
        return self._psd

    def get_dimensions(self) -> dict[str, int]:
        """Get PSD dimensions.

        Returns:
            Dictionary with width and height.
        """
        return {
            "width": self.psd.width,
            "height": self.psd.height
        }

    def get_text_layers(self) -> list[dict[str, Any]]:
        """Extract text layers with their properties.

        Returns:
            List of dictionaries containing text layer information.
        """
        layers = []

        for layer in self.psd.descendants():
            if layer.kind == 'type':
                layer_info = {
                    "name": layer.name,
                    "content": self._extract_text_content(layer),
                    "position": {
                        "x": layer.left,
                        "y": layer.top
                    },
                    "size": {
                        "width": layer.width,
                        "height": layer.height
                    },
                    "layer_type": "text"
                }

                # Try to extract font information
                if hasattr(layer, 'engine_dict') and layer.engine_dict:
                    layer_info["font_info"] = self._extract_font_info(layer)

                layers.append(layer_info)

        return layers

    def get_image_layers(self) -> list[dict[str, Any]]:
        """Extract image/smart object layers.

        Returns:
            List of dictionaries containing image layer information.
        """
        layers = []

        for layer in self.psd.descendants():
            if layer.kind in ('smartobject', 'pixel'):
                # Skip small layers (likely decorations)
                if layer.width < 50 or layer.height < 50:
                    continue

                layers.append({
                    "name": layer.name,
                    "position": {
                        "x": layer.left,
                        "y": layer.top
                    },
                    "size": {
                        "width": layer.width,
                        "height": layer.height
                    },
                    "layer_type": layer.kind
                })

        return layers

    def get_all_layers(self) -> dict[str, list[dict[str, Any]]]:
        """Get all layers organized by type.

        Returns:
            Dictionary with text_layers and image_layers.
        """
        return {
            "text_layers": self.get_text_layers(),
            "image_layers": self.get_image_layers()
        }

    def generate_thumbnail(
        self,
        output_path: str | Path,
        size: tuple[int, int] = (400, 400)
    ) -> Path:
        """Generate thumbnail image from PSD.

        Args:
            output_path: Path to save thumbnail.
            size: Maximum size (width, height) for thumbnail.

        Returns:
            Path to generated thumbnail.
        """
        output_path = Path(output_path)

        # Composite all visible layers
        composite = self.psd.composite()

        # Convert to RGB if necessary
        if composite.mode == 'RGBA':
            # Create white background
            background = Image.new('RGB', composite.size, (255, 255, 255))
            background.paste(composite, mask=composite.split()[3])
            composite = background
        elif composite.mode != 'RGB':
            composite = composite.convert('RGB')

        # Create thumbnail maintaining aspect ratio
        composite.thumbnail(size, Image.Resampling.LANCZOS)

        # Save thumbnail
        composite.save(output_path, "PNG", optimize=True)

        logger.info(f"Generated thumbnail: {output_path}")
        return output_path

    def suggest_category(self) -> str:
        """Suggest category based on dimensions.

        Returns:
            Suggested category string.
        """
        w, h = self.psd.width, self.psd.height

        # Instagram Post
        if w == 1080 and h == 1080:
            return "post"

        # Instagram Story / Reels
        if w == 1080 and h == 1920:
            return "story"

        # Facebook Cover
        if w == 820 and h == 312:
            return "cover"

        # Twitter Header
        if w == 1500 and h == 500:
            return "header"

        # YouTube Thumbnail
        if w == 1280 and h == 720:
            return "youtube"

        # Square variations
        if w == h:
            return "post"

        # Portrait
        if h > w:
            return "story"

        # Landscape
        return "banner"

    def suggest_subcategory(self) -> str | None:
        """Suggest subcategory based on layer names and content.

        Returns:
            Suggested subcategory or None.
        """
        # Keywords to look for in layer names
        offer_keywords = ['price', 'سعر', 'خصم', 'discount', 'offer', 'عرض', '%']
        announcement_keywords = ['new', 'جديد', 'announcement', 'إعلان', 'soon', 'قريبا']
        product_keywords = ['product', 'منتج', 'item']

        layer_names = [layer.name.lower() for layer in self.psd.descendants()]
        all_names = ' '.join(layer_names)

        if any(kw in all_names for kw in offer_keywords):
            return "offer"
        if any(kw in all_names for kw in announcement_keywords):
            return "announcement"
        if any(kw in all_names for kw in product_keywords):
            return "product"

        return None

    def _extract_text_content(self, layer) -> str:
        """Extract text content from a type layer.

        Args:
            layer: PSD type layer.

        Returns:
            Text content string.
        """
        try:
            if hasattr(layer, 'text'):
                return layer.text or ""
        except Exception as e:
            logger.warning(f"Could not extract text from layer {layer.name}: {e}")
        return ""

    def _extract_font_info(self, layer) -> dict[str, Any]:
        """Extract font information from a type layer.

        Args:
            layer: PSD type layer.

        Returns:
            Dictionary with font information.
        """
        font_info = {}

        try:
            engine_dict = layer.engine_dict
            if engine_dict and 'StyleRun' in engine_dict:
                style_run = engine_dict['StyleRun']
                if 'RunArray' in style_run and style_run['RunArray']:
                    style_sheet = style_run['RunArray'][0].get('StyleSheet', {})
                    style_data = style_sheet.get('StyleSheetData', {})

                    font_info['font_size'] = style_data.get('FontSize')
                    font_info['font_name'] = style_data.get('Font')
        except Exception as e:
            logger.debug(f"Could not extract font info: {e}")

        return font_info

    def export_composite(self, output_path: str | Path) -> Path:
        """Export flattened composite image.

        Args:
            output_path: Path to save composite.

        Returns:
            Path to exported image.
        """
        output_path = Path(output_path)
        composite = self.psd.composite()
        composite.save(output_path, "PNG")
        return output_path

    def close(self):
        """Close PSD file and free resources."""
        if self._psd is not None:
            self._psd = None
