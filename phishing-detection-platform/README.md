# Phishing & Scam Detection Platform

An explainable web platform that analyzes suspicious **URLs**, **QR codes**, and **website screenshots**.
Every result lists the evidence behind each indicator, how it contributes to the risk score, and what to do next.

> Prototype for a B.Tech cybersecurity design project. Detection is rule-based. Scores are estimates, not
> calibrated probabilities, and a low score does not guarantee that a site is safe.

## Features
- **URL analysis**: parses the link and checks IP hosts, `@` tricks, punycode/Unicode hosts, brand names in
  non-brand domains, deep subdomains, shorteners, unusual ports, credential keywords, and HTTP. Never fetched or opened.
- **QR analysis**: decodes QR images with OpenCV, then runs URL analysis on any link. Decoded links are never opened.
- **Screenshot analysis**: OCR with Tesseract, then phrase heuristics (password/OTP/payment requests, suspension
  threats, urgency). The visual model stage is reported as *unavailable*.
- **Explainable scoring**: one shared noisy-OR engine (`backend/app/explainability/scoring.py`), bounded 0–100, with
  duplicate evidence counted once and unavailable checks never lowering the score.
- **History, dashboard, reports**: SQLite persistence, search/filter/sort/pagination, delete, JSON and PDF export.

## Project structure
```
phishing-detection-platform/
├── backend/
│   ├── app/
│   │   ├── api/routes.py            REST endpoints
│   │   ├── detection/               url_analyzer, qr_analyzer, screenshot_analyzer, image_validation
│   │   ├── explainability/scoring.py
│   │   ├── models/scan.py           SQLAlchemy Scan table
│   │   ├── schemas/scan.py          Pydantic response models
│   │   ├── services/                scan_service (orchestration + stats), report (PDF)
│   │   ├── database/session.py      engine, session, init
│   │   ├── config.py                environment-driven settings
│   │   └── main.py                  FastAPI app
│   ├── tests/                       pytest suite (URL, QR, screenshot, API)
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/              Layout, RiskGauge, ScanResult, FileDropzone
│       ├── pages/                   Dashboard, scanners, History, ScanDetail, ThreatIntel, ...
│       ├── services/api.ts          typed API client
│       ├── hooks/                   useAsync, theme context
│       └── types/api.ts
├── .env.example
└── README.md
```

## Requirements
- Python 3.10+ and Node.js 18+
- **Tesseract OCR** for screenshot analysis:
  - Ubuntu/Debian: `sudo apt install tesseract-ocr`
  - macOS: `brew install tesseract`
  - Windows: install from the UB Mannheim build, then set `TESSERACT_CMD` in `.env` if it is not on PATH.
  Without Tesseract, the app still runs, and screenshot results show OCR as *unavailable*.

## Run it locally

**1. Backend** (terminal 1)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env            # optional; defaults work
uvicorn app.main:app --reload --port 8000
```
API docs index: http://127.0.0.1:8000/api/docs

**2. Frontend** (terminal 2)
```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173 (proxies /api to port 8000)
```

Open http://localhost:5173.

## Tests
```bash
cd backend
python -m pytest -q
```
Fixtures are generated at runtime (harmless QR codes and text images). No external services are called.

## API
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/scan/url` | Analyze a URL (JSON `{ "url": "..." }`) |
| POST | `/api/scan/qr` | Analyze a QR image (multipart `file`) |
| POST | `/api/scan/screenshot` | Analyze a screenshot (multipart `file`) |
| GET | `/api/scans` | Paginated history (`q`, `scan_type`, `classification`, `sort`, `page`, `page_size`) |
| GET / DELETE | `/api/scans/{id}` | Get or delete a scan |
| GET | `/api/scans/{id}/report.json` / `report.pdf` | Exports |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/settings` | Thresholds, limits, provider status |

## Configuration
See `.env.example`. Upload limit, retention period, CORS origins, and Tesseract path are environment variables.
Provider keys (`GOOGLE_SAFE_BROWSING_KEY`, `VIRUSTOTAL_API_KEY`) are reserved and server-side only; those integrations are not implemented yet.

## Limitations
- Rule-based detection only. No trained classifier is shipped, so the Model Evaluation page shows an empty state.
- Remote webpages are not fetched, so page content, certificates, and redirects are not inspected.
- Visual (layout/logo) phishing detection is not implemented.
- Reputation providers (Safe Browsing, VirusTotal) are not yet integrated; they are never treated as clean results.
- No authentication or rate limiting in this prototype.
- Scan records are kept for `SCAN_RETENTION_DAYS` and purged at server start; uploaded image bytes are never stored.
## Screenshots
![Dashboard](docs/screenshots/dashboard.png)
![URL scan](docs/screenshots/url-caution.png)
![Screenshot analysis](docs/screenshots/screenshot-analysis.png)
