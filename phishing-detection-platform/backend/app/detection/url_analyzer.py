"""Rule-based URL analysis. This is NOT a trained ML model.

The URL is parsed and features are extracted from the actual string.
The submitted URL is never fetched or opened.
"""
from __future__ import annotations

import ipaddress
import re
from dataclasses import dataclass
from urllib.parse import urlsplit, unquote

from app.explainability.scoring import (
    CheckStatus,
    Finding,
    ScoreResult,
    score_findings,
)

MAX_URL_LENGTH = 2048
SUSPICIOUS_TOKENS = ("login", "signin", "verify", "verification", "account",
                     "secure", "update", "password", "confirm", "suspend", "wallet")
SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
              "buff.ly", "rebrand.ly", "cutt.ly"}
BRANDS = ("paypal", "apple", "microsoft", "google", "amazon", "netflix",
          "facebook", "instagram", "whatsapp", "dropbox", "outlook", "chase")
COMMON_PORTS = {None, 80, 443}
_HEX_ESCAPE = re.compile(r"%[0-9A-Fa-f]{2}")


class UrlValidationError(ValueError):
    """Raised for input that cannot be analyzed at all."""


@dataclass
class ParsedUrl:
    original: str
    normalized: str
    scheme: str
    hostname: str
    port: int | None
    userinfo: bool
    path: str
    query: str


def parse_url(raw: str) -> ParsedUrl:
    if raw is None or not raw.strip():
        raise UrlValidationError("URL is empty.")
    text = raw.strip()
    if len(text) > MAX_URL_LENGTH:
        raise UrlValidationError(f"URL exceeds {MAX_URL_LENGTH} characters.")
    if any(ch.isspace() for ch in text):
        raise UrlValidationError("URL must not contain whitespace.")
    if "://" not in text:
        text = "https://" + text  # bare domains are assumed https for analysis
    parts = urlsplit(text)
    scheme = parts.scheme.lower()
    if scheme not in {"http", "https"}:
        raise UrlValidationError(f"Unsupported scheme '{scheme}'. Only http and https are analyzed.")
    try:
        host = parts.hostname
        port = parts.port
    except ValueError as exc:
        raise UrlValidationError("URL has an invalid host or port.") from exc
    if not host:
        raise UrlValidationError("URL has no hostname.")
    return ParsedUrl(
        original=raw,
        normalized=text,
        scheme=scheme,
        hostname=host.lower(),
        port=port,
        userinfo="@" in parts.netloc,
        path=parts.path,
        query=parts.query,
    )


def _registrable_labels(hostname: str) -> list[str]:
    labels = [l for l in hostname.split(".") if l]
    return labels[-2:] if len(labels) >= 2 else labels


def _is_ip(hostname: str) -> bool:
    try:
        ipaddress.ip_address(hostname.strip("[]"))
        return True
    except ValueError:
        return False


def analyze_url(raw: str) -> ScoreResult:
    p = parse_url(raw)
    findings: list[Finding] = []
    host = p.hostname
    labels = [l for l in host.split(".") if l]
    is_ip = _is_ip(host)
    registrable = host if is_ip else ".".join(_registrable_labels(host))
    subdomain_count = 0 if is_ip else max(0, len(labels) - 2)

    # 1. IP-address host
    if _is_ip(host):
        findings.append(Finding(
            "ip_host", "IP address used as hostname",
            f"Host is the literal IP address {host}.",
            "high", 0.55,
            "Legitimate sites almost always use domain names. Raw IP hosts are common in phishing kits and compromised servers.",
            "Do not enter credentials. Confirm the site through a known domain name.",
        ))

    # 2. userinfo '@' trick
    if p.userinfo:
        findings.append(Finding(
            "userinfo_at", "Credentials-style '@' in URL",
            "The authority section contains '@', so text before it is treated as user info.",
            "high", 0.6,
            "Browsers ignore text before '@', so the visible name can differ from the real destination.",
            "Treat this link as deceptive. Do not open it.",
        ))

    # 3. Punycode / internationalized host
    if any(l.startswith("xn--") for l in labels):
        findings.append(Finding(
            "punycode", "Punycode (internationalized) domain",
            f"Hostname uses an 'xn--' label: {host}.",
            "medium", 0.3,
            "Punycode can encode look-alike characters from other scripts that imitate familiar brand names.",
            "Compare the decoded domain against the official spelling before trusting it.",
        ))

    # 4. Non-ASCII characters in hostname
    if not host.isascii():
        findings.append(Finding(
            "unicode_host", "Non-ASCII characters in hostname",
            f"Hostname contains non-ASCII characters: {host}.",
            "medium", 0.35,
            "Non-ASCII letters can be visually identical to Latin letters (homograph attack).",
            "Verify the domain character by character against the real brand domain.",
        ))

    # 5. Excessive subdomains
    if subdomain_count >= 3:
        findings.append(Finding(
            "deep_subdomains", "Deeply nested subdomains",
            f"Hostname has {subdomain_count} subdomain levels under '{registrable}'.",
            "medium", 0.3,
            "Long nested subdomains can hide the real registered domain at the end of the hostname.",
            "Check the registered domain (the part just before the public suffix) before entering data.",
        ))

    # 6. Long URL
    if len(p.original) > 75:
        findings.append(Finding(
            "long_url", "Unusually long URL",
            f"URL is {len(p.original)} characters long.",
            "low", 0.12,
            "Phishing links are often long to hide the destination or carry tracking tokens.",
            "Look at the full destination before clicking.",
        ))

    # 7. Hyphen-heavy hostname
    hyphens = host.count("-")
    if hyphens >= 3:
        findings.append(Finding(
            "hyphen_host", "Hyphen-heavy hostname",
            f"Hostname contains {hyphens} hyphens.",
            "low", 0.15,
            "Many hyphens are often used to imitate brand names with extra words such as 'secure' or 'login'.",
            "Confirm the exact domain spelling.",
        ))

    # 8. Percent-encoding in host or path
    encoded_count = len(_HEX_ESCAPE.findall(p.original))
    if encoded_count >= 3:
        findings.append(Finding(
            "encoded_chars", "Heavy percent-encoding",
            f"URL contains {encoded_count} percent-encoded sequences; decoded example: {unquote(p.path)[:60]!r}.",
            "low", 0.15,
            "Encoding can hide keywords from simple filters and obscure the final path.",
            "Decode the URL and read it before trusting it.",
        ))

    # 9. Suspicious path/query tokens
    combined = (p.path + " " + p.query).lower()
    hits = sorted({t for t in SUSPICIOUS_TOKENS if t in combined})
    if hits:
        findings.append(Finding(
            "suspicious_tokens", "Credential-related keywords in path or query",
            f"Path/query contains: {', '.join(hits)}.",
            "medium", min(0.1 + 0.1 * len(hits), 0.4),
            "Words such as 'login' or 'verify' are common in pages that ask for credentials, but also appear on legitimate sites.",
            "Only enter credentials if you navigated to this site yourself from a trusted source.",
        ))

    # 10. Brand name placed outside the real domain
    brand_hits = [b for b in BRANDS if b in host and b not in registrable.split(".")[0]]
    if brand_hits:
        findings.append(Finding(
            "brand_spoof", "Brand name in a non-brand domain",
            f"Hostname '{host}' contains '{brand_hits[0]}' but its registered domain is '{registrable}'.",
            "high", 0.5,
            "Attackers place a brand name in subdomains or the domain to look official.",
            "Check whether the registered domain belongs to the brand before signing in.",
        ))

    # 11. Known URL shortener
    if registrable in SHORTENERS:
        findings.append(Finding(
            "shortener", "URL shortener",
            f"Link uses the shortener domain '{registrable}'.",
            "low", 0.2,
            "Shorteners hide the destination, so the real site cannot be read from the link.",
            "Expand the link with a trusted preview service before opening it.",
        ))

    # 12. Unusual port
    if p.port not in COMMON_PORTS:
        findings.append(Finding(
            "unusual_port", "Non-standard port",
            f"URL uses port {p.port}.",
            "low", 0.2,
            "Phishing pages are sometimes hosted on unusual ports, although many legitimate services also do.",
            "Be cautious with non-standard ports on login pages.",
        ))

    # 13. Scheme: HTTP is weak evidence, HTTPS is only mitigating
    benign: list[Finding] = []
    if p.scheme == "http":
        findings.append(Finding(
            "no_https", "Connection is not encrypted (HTTP)",
            "The URL uses http://, so traffic is not encrypted in transit.",
            "low", 0.1,
            "Unencrypted pages can expose entered data, but HTTP alone does not show that a site is malicious.",
            "Avoid entering passwords or payment data on HTTP pages.",
        ))
    else:
        benign.append(Finding(
            "https_present", "HTTPS encryption",
            "The URL uses https://.",
            "info", 0.0,
            "HTTPS encrypts traffic, but it only means the connection is encrypted. Phishing sites can also use HTTPS certificates.",
            "Still verify the domain name.",
            benign=True,
        ))

    checks = [
        CheckStatus("Lexical feature extraction", "completed"),
        CheckStatus("Trained ML classifier", "not_applicable",
                    "No trained model is loaded; rule-based analysis only."),
        CheckStatus("Reputation providers (Safe Browsing / VirusTotal)", "not_applicable",
                    "No provider API keys configured."),
        CheckStatus("Page content / DOM analysis", "not_applicable",
                    "Remote fetching is disabled for safety."),
    ]
    limitations = [
        "Rule-based analysis of the URL string only; the page itself was not fetched or opened.",
        "A low score does not guarantee that a website is safe.",
        "Scores are prototype estimates and are not calibrated probabilities.",
    ]

    result = score_findings(findings + benign, checks, limitations)
    result.features = {  # type: ignore[attr-defined]
        "hostname": host,
        "registrable_domain": registrable,
        "url_length": len(p.original),
        "subdomain_levels": subdomain_count,
        "scheme": p.scheme,
        "port": p.port,
    }
    return result
