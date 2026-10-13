import pytest
from app.detection.url_analyzer import analyze_url, UrlValidationError
from app.explainability.scoring import Finding, score_findings, Classification


def ids(result):
    return {f.indicator_id for f in result.findings}


def test_plain_https_domain_has_no_risk_indicators():
    r = analyze_url("https://www.example.com/docs")
    assert r.score == 0
    assert r.classification == Classification.LOW
    assert "https_present" in ids(r)


def test_ip_address_host_is_flagged():
    r = analyze_url("http://192.168.1.5/login")
    assert "ip_host" in ids(r)
    assert r.score >= 50


def test_userinfo_at_sign_is_flagged():
    r = analyze_url("https://paypal.com@evil.example.net/")
    assert "userinfo_at" in ids(r)


def test_punycode_domain_is_flagged():
    r = analyze_url("https://xn--pple-43d.com")
    assert "punycode" in ids(r)


def test_brand_name_in_non_brand_domain_is_flagged():
    r = analyze_url("https://secure-paypal.account-check.xyz/verify")
    assert "brand_spoof" in ids(r)
    assert "suspicious_tokens" in ids(r)


def test_unsupported_scheme_rejected():
    with pytest.raises(UrlValidationError):
        analyze_url("ftp://example.com/file")


def test_empty_input_rejected():
    with pytest.raises(UrlValidationError):
        analyze_url("   ")


def test_whitespace_rejected():
    with pytest.raises(UrlValidationError):
        analyze_url("https://exa mple.com")


def test_score_is_bounded_and_deduplicated():
    f = Finding("x", "n", "e", "high", 0.9, "x", "y")
    r = score_findings([f, f, f])
    assert r.score == 90  # counted once, not three times
    many = [Finding(str(i), "n", "e", "high", 0.99, "x", "y") for i in range(20)]
    assert score_findings(many).score == 100


def test_benign_findings_contribute_nothing():
    b = Finding("https", "n", "e", "info", 0.9, "x", "y", benign=True)
    assert score_findings([b]).score == 0
