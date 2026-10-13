from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.config import settings
from app.database.session import get_db
from app.detection.image_validation import ImageValidationError
from app.detection.url_analyzer import UrlValidationError
from app.models.scan import Scan
from app.schemas.scan import ScanOut, ScanPage, ScanSummaryOut, StatsOut, SettingsOut, UrlScanRequest
from app.services import scan_service
from app.services.report import scan_to_pdf

router = APIRouter(prefix="/api")

SORTS = {
    "newest": (Scan.created_at.desc(), ),
    "oldest": (Scan.created_at.asc(), ),
    "score_high": (Scan.risk_score.desc(), Scan.created_at.desc()),
    "score_low": (Scan.risk_score.asc(), Scan.created_at.desc()),
}


def _to_out(scan: Scan, qr_urls: list[dict] | None = None) -> dict:
    return {
        "id": scan.id, "scan_type": scan.scan_type, "input_label": scan.input_label,
        "input_value": scan.input_value, "extracted": scan.extracted,
        "risk_score": scan.risk_score, "classification": scan.classification,
        "findings": scan.findings, "checks": scan.checks, "limitations": scan.limitations,
        "features": scan.features, "coverage": scan.coverage, "created_at": scan.created_at,
        "qr_urls": qr_urls,
    }


def _image_error(exc: ImageValidationError):
    raise HTTPException(status_code=exc.status_code, detail=str(exc))


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/scan/url", response_model=ScanOut)
def scan_url(body: UrlScanRequest, db: Session = Depends(get_db)):
    try:
        scan = scan_service.scan_url(db, body.url)
    except UrlValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return _to_out(scan)


@router.post("/scan/qr", response_model=ScanOut)
async def scan_qr(file: UploadFile = File(...), db: Session = Depends(get_db)):
    data = await file.read(settings.max_upload_bytes + 1)
    try:
        scan, url_results = scan_service.scan_qr(db, data, file.filename or "")
    except ImageValidationError as exc:
        _image_error(exc)
    return _to_out(scan, url_results)


@router.post("/scan/screenshot", response_model=ScanOut)
async def scan_screenshot(file: UploadFile = File(...), db: Session = Depends(get_db)):
    data = await file.read(settings.max_upload_bytes + 1)
    try:
        scan = scan_service.scan_screenshot(db, data, file.filename or "")
    except ImageValidationError as exc:
        _image_error(exc)
    return _to_out(scan)


@router.get("/scans", response_model=ScanPage)
def list_scans(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, max_length=200),
    scan_type: str | None = Query(None, pattern="^(url|qr|screenshot)$"),
    classification: str | None = Query(None, max_length=32),
    sort: str = Query("newest", pattern="^(newest|oldest|score_high|score_low)$"),
    db: Session = Depends(get_db),
):
    stmt = select(Scan)
    if q:
        stmt = stmt.where(or_(Scan.input_label.ilike(f"%{q}%"), Scan.input_value.ilike(f"%{q}%")))
    if scan_type:
        stmt = stmt.where(Scan.scan_type == scan_type)
    if classification:
        stmt = stmt.where(Scan.classification == classification)
    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    rows = db.execute(stmt.order_by(*SORTS[sort]).offset((page - 1) * page_size).limit(page_size)).scalars().all()
    items = [ScanSummaryOut(id=r.id, scan_type=r.scan_type, input_label=r.input_label,
                            risk_score=r.risk_score, classification=r.classification,
                            created_at=r.created_at) for r in rows]
    return ScanPage(items=items, total=total, page=page, page_size=page_size)


def _get_or_404(db: Session, scan_id: str) -> Scan:
    scan = db.get(Scan, scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found.")
    return scan


@router.get("/scans/{scan_id}", response_model=ScanOut)
def get_scan(scan_id: str, db: Session = Depends(get_db)):
    return _to_out(_get_or_404(db, scan_id))


@router.delete("/scans/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = _get_or_404(db, scan_id)
    db.delete(scan)
    db.commit()
    return Response(status_code=204)


@router.get("/scans/{scan_id}/report.json")
def report_json(scan_id: str, db: Session = Depends(get_db)):
    scan = _get_or_404(db, scan_id)
    return _to_out(scan)


@router.get("/scans/{scan_id}/report.pdf")
def report_pdf(scan_id: str, db: Session = Depends(get_db)):
    scan = _get_or_404(db, scan_id)
    pdf = scan_to_pdf(scan)
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="scan-{scan.id}.pdf"'})


@router.get("/stats", response_model=StatsOut)
def stats(db: Session = Depends(get_db)):
    return scan_service.stats(db)


@router.get("/settings", response_model=SettingsOut)
def get_settings():
    from app.explainability.scoring import ScoringConfig
    cfg = ScoringConfig()
    return SettingsOut(
        risk_thresholds={"caution_min": cfg.caution_min, "suspicious_min": cfg.suspicious_min,
                         "high_min": cfg.high_min},
        max_upload_mb=settings.max_upload_bytes // (1024 * 1024),
        retention_days=settings.retention_days,
        detection_engine="Rule-based URL and text heuristics with noisy-OR explainable scoring. "
                         "No trained ML model is loaded.",
        providers=[
            {"name": "Google Safe Browsing", "configured": False, "status": "Not configured",
             "setup": "Set GOOGLE_SAFE_BROWSING_KEY in backend/.env (not yet integrated)."},
            {"name": "VirusTotal", "configured": False, "status": "Not configured",
             "setup": "Set VIRUSTOTAL_API_KEY in backend/.env (not yet integrated)."},
        ],
    )


@router.get("/docs")
def api_index():
    return {"endpoints": [
        {"method": "GET", "path": "/api/health"},
        {"method": "POST", "path": "/api/scan/url", "body": {"url": "string"}},
        {"method": "POST", "path": "/api/scan/qr", "body": "multipart file"},
        {"method": "POST", "path": "/api/scan/screenshot", "body": "multipart file"},
        {"method": "GET", "path": "/api/scans"},
        {"method": "GET", "path": "/api/scans/{scan_id}"},
        {"method": "DELETE", "path": "/api/scans/{scan_id}"},
        {"method": "GET", "path": "/api/scans/{scan_id}/report.json"},
        {"method": "GET", "path": "/api/scans/{scan_id}/report.pdf"},
        {"method": "GET", "path": "/api/stats"},
        {"method": "GET", "path": "/api/settings"},
    ]}
