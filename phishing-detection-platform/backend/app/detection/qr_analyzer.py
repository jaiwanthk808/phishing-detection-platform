"""QR decoding with OpenCV. Decoded content is never opened or fetched."""
from __future__ import annotations

from dataclasses import dataclass, field
from urllib.parse import urlsplit

import cv2
import numpy as np
from PIL import Image

from app.detection.url_analyzer import UrlValidationError, analyze_url
from app.explainability.scoring import CheckStatus, Finding, ScoreResult, score_findings


@dataclass
class QrDecodeResult:
    contents: list[str] = field(default_factory=list)


def decode_qr(image: Image.Image) -> QrDecodeResult:
    rgb = np.array(image)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    detector = cv2.QRCodeDetector()
    found: list[str] = []
    try:
        ok, decoded, _, _ = detector.detectAndDecodeMulti(bgr)
        if ok:
            found = [d for d in decoded if d]
    except cv2.error:
        found = []
    if not found:
        single, _, _ = detector.detectAndDecode(bgr)
        if single:
            found = [single]
    # de-duplicate while keeping order
    seen, unique = set(), []
    for c in found:
        if c not in seen:
            seen.add(c)
            unique.append(c)
    return QrDecodeResult(contents=unique)


def _looks_like_url(text: str) -> bool:
    try:
        parts = urlsplit(text.strip())
    except ValueError:
        return False
    return parts.scheme in {"http", "https"} and bool(parts.netloc)


def analyze_qr(image: Image.Image) -> tuple[QrDecodeResult, list[dict], ScoreResult]:
    decoded = decode_qr(image)
    url_results: list[dict] = []
    checks = [CheckStatus("QR decoding (OpenCV)", "completed")]
    findings: list[Finding] = []
    limitations = [
        "The decoded content was analyzed as text; the destination was not opened or fetched.",
        "A screenshot or photo of a QR code can be misread; the decoded value should be verified.",
    ]

    if not decoded.contents:
        checks.append(CheckStatus("URL analysis", "not_applicable", "No QR code was decoded."))
        result = score_findings([], checks, limitations + ["No QR code was found in the image."])
        return decoded, url_results, result

    for content in decoded.contents:
        if _looks_like_url(content):
            try:
                sub = analyze_url(content)
                url_results.append({"content": content, "score": sub.score,
                                    "classification": sub.classification.value,
                                    "findings": [f.indicator_id for f in sub.findings]})
                findings.extend(sub.findings)  # reuse the URL engine's findings directly
            except UrlValidationError as exc:
                findings.append(Finding(
                    "qr_bad_url", "Malformed URL in QR code",
                    f"Decoded value looks like a URL but could not be validated: {exc}",
                    "medium", 0.3,
                    "A QR code that points to a malformed or unusual link can indicate tampering.",
                    "Do not open the link. Verify the source of the QR code.", source="qr"))
        else:
            findings.append(Finding(
                "qr_non_url", "Non-URL QR content",
                "The QR code does not contain a web link.",
                "info", 0.0,
                "Non-URL QR codes (text, contact cards, Wi-Fi settings) are not reputation-checked by URL rules.",
                "Read the content before acting on it.", source="qr", benign=True))

    checks.append(CheckStatus("URL analysis of decoded links",
                              "completed" if url_results else "not_applicable",
                              "" if url_results else "Decoded content contains no URL."))
    result = score_findings(findings, checks, limitations)
    return decoded, url_results, result
