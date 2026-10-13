def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_url_scan_persists_and_is_retrievable(client):
    r = client.post("/api/scan/url", json={"url": "https://paypal.com@evil.example.net/"})
    assert r.status_code == 200
    scan_id = r.json()["id"]
    got = client.get(f"/api/scans/{scan_id}")
    assert got.status_code == 200
    assert got.json()["risk_score"] == r.json()["risk_score"]


def test_invalid_url_returns_422(client):
    assert client.post("/api/scan/url", json={"url": "ftp://x.com"}).status_code == 422
    assert client.post("/api/scan/url", json={"url": ""}).status_code == 422


def test_unknown_scan_404(client):
    assert client.get("/api/scans/does-not-exist").status_code == 404


def test_history_filter_pagination_and_delete(client):
    client.post("/api/scan/url", json={"url": "https://example.com/a"})
    page = client.get("/api/scans", params={"page_size": 1, "scan_type": "url"}).json()
    assert page["page_size"] == 1 and page["total"] >= 1
    sid = page["items"][0]["id"]
    assert client.delete(f"/api/scans/{sid}").status_code == 204
    assert client.get(f"/api/scans/{sid}").status_code == 404


def test_stats_reflect_records(client):
    stats = client.get("/api/stats").json()
    assert stats["total"] == stats["low"] + stats["caution"] + stats["suspicious"] + stats["high"]
    assert len(stats["activity"]) == 14


def test_reports_export(client):
    sid = client.post("/api/scan/url", json={"url": "http://10.0.0.1/x"}).json()["id"]
    j = client.get(f"/api/scans/{sid}/report.json")
    assert j.status_code == 200 and j.json()["id"] == sid
    p = client.get(f"/api/scans/{sid}/report.pdf")
    assert p.status_code == 200 and p.content[:4] == b"%PDF"


def test_providers_reported_as_not_configured(client):
    s = client.get("/api/settings").json()
    assert all(p["configured"] is False for p in s["providers"])
