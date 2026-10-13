from tests.fixtures import blank_png, qr_png, text_png


def test_qr_with_url_is_decoded_and_analyzed(client):
    r = client.post("/api/scan/qr", files={"file": ("qr.png", qr_png("http://192.168.1.5/login"), "image/png")})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["scan_type"] == "qr"
    assert body["extracted"] == "http://192.168.1.5/login"
    assert body["qr_urls"] and body["qr_urls"][0]["content"] == "http://192.168.1.5/login"
    assert "ip_host" in {f["indicator_id"] for f in body["findings"]}


def test_qr_with_plain_text_is_not_marked_dangerous(client):
    r = client.post("/api/scan/qr", files={"file": ("qr.png", qr_png("Hello world"), "image/png")})
    body = r.json()
    assert body["extracted"] == "Hello world"
    assert body["risk_score"] == 0
    assert body["classification"] == "Low Risk"


def test_image_without_qr_code(client):
    r = client.post("/api/scan/qr", files={"file": ("blank.png", blank_png(), "image/png")})
    assert r.status_code == 200
    assert r.json()["extracted"] is None


def test_invalid_file_rejected_by_content(client):
    r = client.post("/api/scan/qr", files={"file": ("evil.png", b"not an image at all", "image/png")})
    assert r.status_code == 422


def test_oversized_upload_rejected(client):
    too_big = b"\x89PNG" + b"0" * (5 * 1024 * 1024 + 16)  # just over the 5 MB default limit
    r = client.post("/api/scan/screenshot", files={"file": ("big.png", too_big, "image/png")})
    assert r.status_code == 413


def test_screenshot_with_suspicious_wording(client):
    png = text_png(["Your account will be suspended.", "Enter your password to verify your account."])
    r = client.post("/api/scan/screenshot", files={"file": ("shot.png", png, "image/png")})
    assert r.status_code == 200, r.text
    body = r.json()
    ids = {f["indicator_id"] for f in body["findings"]}
    assert "pw_request" in ids or "account_suspension" in ids
    assert body["extracted"]


def test_screenshot_without_text_has_low_risk(client):
    r = client.post("/api/scan/screenshot", files={"file": ("blank.png", blank_png(), "image/png")})
    assert r.status_code == 200
    assert r.json()["risk_score"] == 0
    statuses = {c["name"]: c["status"] for c in r.json()["checks"]}
    assert statuses["Visual model analysis"] == "unavailable"
