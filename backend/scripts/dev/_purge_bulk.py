"""Stress-test purge: create 220 archived leads (>2 pages of 100), purge, assert all gone."""
import json
import urllib.request

BASE = "http://127.0.0.1:8000"


def login(email, password):
    req = urllib.request.Request(
        f"{BASE}/api/v1/auth/login", method="POST",
        headers={"Content-Type": "application/json"},
        data=json.dumps({"email": email, "password": password}).encode(),
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())["data"]["access_token"]


def api(method, path, body=None, token=None):
    req = urllib.request.Request(
        f"{BASE}{path}", method=method,
        headers={"Authorization": f"Bearer {token}" if token else "",
                 "Content-Type": "application/json"},
        data=json.dumps(body).encode() if body is not None else None,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode()[:200]
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw


rep_tok = login("sales@gmail.com", "Sales@123456")
admin_tok = login("kuppamajith@gmail.com", "Admin@123456")

# create + archive 220 leads
created = 0
for i in range(220):
    code, resp = api("POST", "/api/v1/leads", {
        "title": f"Bulk Purge {i}", "status": "new", "source": "website", "currency": "INR",
    }, token=rep_tok)
    lid = (resp.get("data") or {}).get("id")
    if not lid:
        print(f"create failed at {i}: HTTP {code}"); break
    dc, _ = api("DELETE", f"/api/v1/leads/{lid}", token=rep_tok)
    if dc in (200, 204):
        created += 1
print(f"created+archived: {created}")

# count before
code, resp = api("GET", "/api/v1/leads/deleted?page_size=100", token=admin_tok)
total_before = (resp.get("data") or {}).get("total", 0)
print(f"archived before purge: {total_before}")

# purge all
code, resp = api("POST", "/api/v1/leads/purge-deleted", token=admin_tok)
purged = (resp.get("data") or {}).get("purged")
print(f"purge: HTTP {code} purged={purged}")

# count after
code, resp = api("GET", "/api/v1/leads/deleted?page_size=100", token=admin_tok)
total_after = (resp.get("data") or {}).get("total", 0)
print(f"archived after purge: {total_after}")
print(f"RESULT: {'PASS' if total_after == 0 else 'FAIL'}")
