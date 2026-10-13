"""Validate uploads by inspecting actual image content, not the filename."""
from io import BytesIO

from PIL import Image, UnidentifiedImageError

from app.config import settings

ALLOWED_FORMATS = {"PNG": "image/png", "JPEG": "image/jpeg", "WEBP": "image/webp"}


class ImageValidationError(ValueError):
    def __init__(self, message: str, status_code: int = 422):
        super().__init__(message)
        self.status_code = status_code


def validate_image(data: bytes) -> Image.Image:
    if not data:
        raise ImageValidationError("The uploaded file is empty.")
    if len(data) > settings.max_upload_bytes:
        raise ImageValidationError(
            f"File exceeds the {settings.max_upload_bytes // (1024 * 1024)} MB upload limit.", 413)
    old_limit = Image.MAX_IMAGE_PIXELS
    Image.MAX_IMAGE_PIXELS = settings.max_image_pixels
    try:
        probe = Image.open(BytesIO(data))
        probe.verify()                       # detects truncation/corruption
        fmt = probe.format
        if fmt not in ALLOWED_FORMATS:
            raise ImageValidationError("Unsupported image type. Use PNG, JPG, JPEG, or WebP.")
        image = Image.open(BytesIO(data))
        image.load()
    except ImageValidationError:
        raise
    except (UnidentifiedImageError, OSError, SyntaxError, Image.DecompressionBombError) as exc:
        raise ImageValidationError("The file is not a valid or readable image.") from exc
    finally:
        Image.MAX_IMAGE_PIXELS = old_limit
    return image.convert("RGB")
