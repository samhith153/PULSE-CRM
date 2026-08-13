"""Org isolation tests: users can never read another org's data."""
from app.core.config import settings

from tests.helpers import auth_headers, get_org_id, register_org


async def test_cross_org_company_isolation(client, seed_roles):
    a = await register_org(client, "Isolation Org A", "iso-a@example.com")
    b = await register_org(client, "Isolation Org B", "iso-b@example.com")
    a_org = await get_org_id(client, a["access"])
    b_org = await get_org_id(client, b["access"])
    assert a_org != b_org

    created = await client.post(
        "/api/v1/companies", headers=auth_headers(a["access"]), json={"name": "Secret Co A"}
    )
    assert created.status_code == 201, created.text
    company_id = created.json()["data"]["id"]

    # Org B cannot fetch A's company by id.
    res = await client.get(f"/api/v1/companies/{company_id}", headers=auth_headers(b["access"]))
    assert res.status_code == 404

    # Org B's company list must not contain it.
    lst = await client.get("/api/v1/companies", headers=auth_headers(b["access"]))
    assert lst.status_code == 200
    names = [c["name"] for c in lst.json()["data"]["data"]]
    assert "Secret Co A" not in names


async def test_cross_org_lead_isolation(client, seed_roles):
    a = await register_org(client, "Lead Iso Org A", "liso-a@example.com")
    b = await register_org(client, "Lead Iso Org B", "liso-b@example.com")

    created = await client.post(
        "/api/v1/leads",
        headers=auth_headers(a["access"]),
        json={"title": "Secret Lead A", "source": "website"},
    )
    assert created.status_code == 201, created.text
    lead_id = created.json()["data"]["id"]

    res = await client.get(f"/api/v1/leads/{lead_id}", headers=auth_headers(b["access"]))
    assert res.status_code == 404


async def test_uploads_require_auth_and_are_org_scoped(client, seed_roles, tmp_path, monkeypatch):
    # Uploaded files must never be publicly readable — serve them through the
    # authenticated, org-scoped API route only.
    monkeypatch.setattr(settings, "LOCAL_STORAGE_PATH", str(tmp_path))

    a = await register_org(client, "Up Org A", "up-a@example.com")
    b = await register_org(client, "Up Org B", "up-b@example.com")

    up = await client.post(
        "/api/v1/uploads/avatars",
        headers=auth_headers(a["access"]),
        files={"file": ("a.png", b"avatar-bytes", "image/png")},
    )
    assert up.status_code == 201, up.text
    url = up.json()["data"]["url"]  # /uploads/{org}/avatars/{name}

    # Authenticated same-org fetch works.
    res = await client.get(f"/api/v1{url}", headers=auth_headers(a["access"]))
    assert res.status_code == 200
    assert res.content == b"avatar-bytes"

    # Cross-org is a 404 (org scoped, not just authenticated).
    res = await client.get(f"/api/v1{url}", headers=auth_headers(b["access"]))
    assert res.status_code == 404

    # Anonymous is rejected.
    res = await client.get(f"/api/v1{url}")
    assert res.status_code == 401

    # The old public static mount is gone.
    res = await client.get(url)
    assert res.status_code == 404


async def test_path_traversal_rejected(client, seed_roles, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "LOCAL_STORAGE_PATH", str(tmp_path))
    a = await register_org(client, "Trav Org A", "trav-a@example.com")
    org_id = await get_org_id(client, a["access"])

    for evil in ("..%2F..%2Fsecret", "..", ".env", "x%2F..%2Fy"):
        res = await client.get(
            f"/api/v1/uploads/{org_id}/avatars/{evil}",
            headers=auth_headers(a["access"]),
        )
        # Must never serve a file outside the uploads root.
        assert res.status_code in (404, 422), f"{evil!r} -> {res.status_code}"
