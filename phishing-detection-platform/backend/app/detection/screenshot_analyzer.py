"""Screenshot analysis: OCR (Tesseract) + explainable phrase heuristics.

Indicators are signals to review, not proof of phishing. The visual model
stage is reported as unavailable because no trained visual model is shipped.
"""
from __future__ import annotations

import re
import shutil

import numpy as np
import pytesseract
from PIL import Image, ImageOps

from app.config import settings
from app.explainability.scoring import CheckStatus, Finding, ScoreResult, score_findings

# (indicator_id, display name, regex, weight, explanation, recommendation)
PHRASE_RULES = [
    ("pw_request", "Password request", r"\b(enter|confirm|re-?enter|update|provide)\b.{0,20}\bpassword\b", 0.35,
     "Pages that ask for a password are the main target of credential phishing.",
     "Never enter your password from a link in a message. Go to the service directly."),
    ("otp_request", "One-time code request", r"\b(otp|one[- ]time (password|code|passcode)|verification code|security code)\b", 0.35,
     "Requests for one-time codes are used to bypass two-factor authentication.",
     "Never share a one-time code with anyone who contacts you."),
    ("account_suspension", "Urgent account suspension", r"\b(suspend(ed|ion)?|locked|terminated|deactivat(e|ed)|will be closed)\b", 0.25,
     "Threats of suspension create urgency so people act without checking.",
     "Log in through the official app or typed address, not through this page."),
    ("urgency", "Urgency language", r"\b(urgent|immediately|within 24 hours|act now|expires? (today|soon)|final notice)\b", 0.15,
     "Urgent wording is a common manipulation tactic.",
     "Pause and verify through an independent channel."),
    ("payment_verify", "Payment or card verification", r"\b(card (number|details)|cvv|credit card|bank account|verify (your )?(payment|billing))\b", 0.35,
     "Requests for card or bank details on an unexpected page suggest payment fraud.",
     "Do not enter card details unless you initiated the purchase on a trusted site."),
    ("account_verify", "Account verification request", r"\b(verify|validate|confirm) (your )?(account|identity|details|information)\b", 0.25,
     "Requests to verify identity are a frequent phishing pretext.",
     "Verify through the service's official website or app."),
    ("login_prompt", "Login prompt", r"\b(sign ?in|log ?in)\b.{0,30}\b(to continue|to view|to avoid)\b", 0.15,
     "Login prompts that promise to unlock content may collect credentials.",
     "Check the address bar before entering credentials."),
]


def _ocr(image: Image.Image) -> tuple[str | None, str]:
    """Return (text, status_note). text is None when OCR cannot run."""
    if settings.tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd
    if not shutil.which(pytesseract.pytesseract.tesseract_cmd) and not shutil.which("tesseract"):
        return None, "Tesseract OCR engine is not installed or not on PATH."
    gray = ImageOps.grayscale(image)
    gray = ImageOps.autocontrast(gray)
    try:
        text = pytesseract.image_to_string(gray)
    except pytesseract.TesseractError as exc:
        return None, f"OCR failed: {exc}"
    except Exception:  # noqa: BLE001 - never leak internals to the user
        return None, "OCR failed unexpectedly."
    return text, ""


def analyze_screenshot(image: Image.Image) -> tuple[str, ScoreResult]:
    text, note = _ocr(image)
    checks = []
    limitations = [
        "A screenshot cannot establish the true destination URL.",
        "A screenshot cannot prove that a site transmits sensitive information.",
        "Visual phishing models are not loaded, so layout and logo similarity were not evaluated.",
    ]

    if text is None:
        checks.append(CheckStatus("OCR text extraction", "unavailable", note))
        checks.append(CheckStatus("Visual model analysis", "unavailable", "No trained visual model is loaded."))
        return "", score_findings([], checks, limitations + [note])

    checks.append(CheckStatus("OCR text extraction", "completed"))
    checks.append(CheckStatus("Visual model analysis", "unavailable", "No trained visual model is loaded."))

    clean = re.sub(r"\s+", " ", text).strip()
    findings: list[Finding] = []
    if len(clean) < 10:
        findings.append(Finding(
            "little_text", "Little readable text",
            f"OCR recovered only {len(clean)} characters.",
            "info", 0.0,
            "Images with little readable text cannot be assessed by text heuristics.",
            "Upload a clearer screenshot or review the page manually.", source="ocr", benign=True))
    for rule_id, name, pattern, weight, explanation, recommendation in PHRASE_RULES:
        m = re.search(pattern, clean, flags=re.IGNORECASE)
        if m:
            findings.append(Finding(
                rule_id, name, f"OCR text contains: \u201c{m.group(0)[:80]}\u201d",
                "high" if weight >= 0.3 else "medium", weight,
                explanation, recommendation, source="ocr"))

    return clean[:2000], score_findings(findings, checks, limitations)
