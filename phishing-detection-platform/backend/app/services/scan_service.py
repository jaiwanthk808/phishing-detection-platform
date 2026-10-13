"""Runs a detection pipeline, persists the result, and converts it for the API."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.detection.image_validation import validate_image
from app.detection.qr_analyzer import analyze_qr
from app.detection.screenshot_analyzer import analyze_screenshot
from app.detection.url_analyzer import analyze_url
from app.explainability.scoring import Classification, ScoreResult
from app.models.scan import Scan

MAX_EXTRACTED = 2000


def _finding_out(f) -> dict:
    return {
        "indicator_id": f.indicator_id, "name": f.name, "evidence": f.evidence,
        "severity": f.severity, "weight": f.weight, "contribution": round(f.contribution(), 3),
        "explanation": f.explanation, "recommendation": f.recommendation,
        "source": f.source, "benign": f.benign,
    }


def _persist(db: Session, *, scan_type: str, label: str, value: str | None, extracted: str | None,
             result: ScoreResult, features: dict | None = None) -> Scan:
    scan = Scan(
        scan_type=scan_type,
        input_label=label[:512],
        input_value=value,
        extracted=(extracted or None) and extracted[:MAX_EXTRACTED],
        risk_score=result.score,
        classification=result.classification.value,
        findings=[_finding_out(f) for f in result.findings],
        checks=[{"name": c.name, "status": c.status, "note": c.note} for c in result.checks],
        limitations=result.limitations,
        features=features or {},
        coverage=result.coverage,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


def scan_url(db: Session, url: str) -> Scan:
    result = analyze_url(url)
    return _persist(db, scan_type="url", label=url, value=url, extracted=None,
                    result=result, features=result.features)  # type: ignore[attr-defined]


def scan_qr(db: Session, image_bytes: bytes, filename: str) -> tuple[Scan, list[dict]]:
    image = validate_image(image_bytes)
    decoded, url_results, result = analyze_qr(image)
    extracted = "\n".join(decoded.contents) if decoded.contents else None
    scan = _persist(db, scan_type="qr", label=filename or "qr-image", value=None,
                    extracted=extracted, result=result,
                    features={"decoded_count": len(decoded.contents), "url_count": len(url_results)})
    return scan, url_results


def scan_screenshot(db: Session, image_bytes: bytes, filename: str) -> Scan:
    image = validate_image(image_bytes)
    text, result = analyze_screenshot(image)
    return _persist(db, scan_type="screenshot", label=filename or "screenshot", value=None,
                    extracted=text or None, result=result,
                    features={"ocr_characters": len(text)})


def purge_expired(db: Session) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.retention_days)
    rows = db.execute(select(Scan).where(Scan.created_at < cutoff)).scalars().all()
    for row in rows:
        db.delete(row)
    db.commit()
    return len(rows)


def stats(db: Session) -> dict:
    rows = db.execute(select(Scan.classification, func.count()).group_by(Scan.classification)).all()
    counts = {c.value: 0 for c in Classification}
    for cls, n in rows:
        counts[cls] = n
    total = sum(counts.values())
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today = db.execute(select(func.count()).select_from(Scan).where(Scan.created_at >= today_start)).scalar_one()
    by_type_rows = db.execute(select(Scan.scan_type, func.count()).group_by(Scan.scan_type)).all()
    by_type = {"url": 0, "qr": 0, "screenshot": 0}
    for t, n in by_type_rows:
        by_type[t] = n
    since = today_start - timedelta(days=13)
    recent = db.execute(select(Scan.created_at).where(Scan.created_at >= since)).scalars().all()
    buckets = {(since + timedelta(days=i)).date().isoformat(): 0 for i in range(14)}
    for ts in recent:
        key = ts.astimezone(timezone.utc).date().isoformat()
        if key in buckets:
            buckets[key] += 1
    return {
        "total": total,
        "low": counts[Classification.LOW.value],
        "caution": counts[Classification.CAUTION.value],
        "suspicious": counts[Classification.SUSPICIOUS.value],
        "high": counts[Classification.HIGH.value],
        "today": today,
        "by_type": by_type,
        "activity": [{"date": d, "count": n} for d, n in buckets.items()],
    }
