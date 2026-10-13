import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Scan(Base):
    """A saved scan. Uploaded image bytes are never stored; only extracted results."""
    __tablename__ = "scans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_type: Mapped[str] = mapped_column(String(16), index=True)          # url | qr | screenshot
    input_label: Mapped[str] = mapped_column(String(512))                    # URL or filename
    input_value: Mapped[str | None] = mapped_column(Text, nullable=True)     # analyzed URL, if any
    extracted: Mapped[str | None] = mapped_column(Text, nullable=True)       # decoded QR / OCR text (truncated)
    risk_score: Mapped[int] = mapped_column(Integer, index=True)
    classification: Mapped[str] = mapped_column(String(32), index=True)
    findings: Mapped[list] = mapped_column(JSON, default=list)
    checks: Mapped[list] = mapped_column(JSON, default=list)
    limitations: Mapped[list] = mapped_column(JSON, default=list)
    features: Mapped[dict] = mapped_column(JSON, default=dict)
    coverage: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)
