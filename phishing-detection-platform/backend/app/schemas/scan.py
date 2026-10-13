from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, HttpUrl


class UrlScanRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)


class FindingOut(BaseModel):
    indicator_id: str
    name: str
    evidence: str
    severity: Literal["info", "low", "medium", "high"]
    weight: float
    contribution: float
    explanation: str
    recommendation: str
    source: str
    benign: bool


class CheckOut(BaseModel):
    name: str
    status: Literal["completed", "unavailable", "not_applicable"]
    note: str = ""


class CoverageOut(BaseModel):
    applicable: int
    completed: int
    unavailable: int
    percent: int


class ScanOut(BaseModel):
    id: str
    scan_type: Literal["url", "qr", "screenshot"]
    input_label: str
    input_value: str | None
    extracted: str | None
    risk_score: int
    classification: str
    findings: list[FindingOut]
    checks: list[CheckOut]
    limitations: list[str]
    features: dict[str, Any]
    coverage: CoverageOut
    created_at: datetime
    qr_urls: list[dict[str, Any]] | None = None


class ScanSummaryOut(BaseModel):
    id: str
    scan_type: str
    input_label: str
    risk_score: int
    classification: str
    created_at: datetime


class ScanPage(BaseModel):
    items: list[ScanSummaryOut]
    total: int
    page: int
    page_size: int


class StatsOut(BaseModel):
    total: int
    low: int
    caution: int
    suspicious: int
    high: int
    today: int
    by_type: dict[str, int]
    activity: list[dict[str, Any]]


class SettingsOut(BaseModel):
    risk_thresholds: dict[str, int]
    max_upload_mb: int
    retention_days: int
    detection_engine: str
    providers: list[dict[str, Any]]
