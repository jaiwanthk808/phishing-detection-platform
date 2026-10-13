"""Configuration loaded from environment variables (see ../.env.example)."""
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./phishing_platform.db")
    cors_origins: tuple[str, ...] = tuple(
        o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()
    )
    max_upload_bytes: int = int(os.getenv("MAX_UPLOAD_MB", "5")) * 1024 * 1024
    max_image_pixels: int = int(os.getenv("MAX_IMAGE_PIXELS", str(25_000_000)))
    retention_days: int = int(os.getenv("SCAN_RETENTION_DAYS", "90"))
    tesseract_cmd: str | None = os.getenv("TESSERACT_CMD") or None


settings = Settings()
