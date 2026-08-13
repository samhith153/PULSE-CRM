"""Auth security tests: refresh rotation, reuse detection, logout revocation."""
from tests.helpers import auth_headers, get_org_id, login, register_org, seed_user


async def test_refresh_token_rotation_and_reuse_detection(client, seed_roles):
    tokens = await register_org(client, "Rotate Org", "rotate@example.com")
    rt1 = tokens["refresh"]

    # First refresh rotates: new pair, old token revoked.
    res = await client.post("/api/v1/auth/refresh", json={"refresh_token": rt1})
    assert res.status_code == 200, res.text
    rt2 = res.json()["data"]["refresh_token"]
    assert rt2 != rt1

    # Replaying the rotated token = theft → whole family revoked, 401.
    res = await client.post("/api/v1/auth/refresh", json={"refresh_token": rt1})
    assert res.status_code == 401

    # The replacement is also dead after family revocation.
    res = await client.post("/api/v1/auth/refresh", json={"refresh_token": rt2})
    assert res.status_code == 401


async def test_logout_revokes_access_and_refresh_tokens(client, seed_roles):
    tokens = await register_org(client, "Logout Org", "logout@example.com")

    res = await client.post(
        "/api/v1/auth/logout",
        headers=auth_headers(tokens["access"]),
        json={"refresh_token": tokens["refresh"]},
    )
    assert res.status_code == 204

    # Access token is now revoked (DB-backed) — /me must reject it.
    me = await client.get("/api/v1/auth/me", headers=auth_headers(tokens["access"]))
    assert me.status_code == 401

    # Refresh token is revoked server-side too.
    res = await client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh"]})
    assert res.status_code == 401


async def test_deactivated_user_cannot_login(client, db_session, seed_roles):
    admin = await register_org(client, "Deact Org", "deact-admin@example.com")
    org_id = await get_org_id(client, admin["access"])

    rep = await seed_user(
        db_session,
        email="deact-rep@example.com",
        full_name="Deact Rep",
        org_id=org_id,
        role_name="sales_rep",
    )

    assert (await login(client, "deact-rep@example.com"))["access"]

    res = await client.post(
        f"/api/v1/users/{rep.id}/deactivate", headers=auth_headers(admin["access"])
    )
    assert res.status_code == 200

    res = await client.post(
        "/api/v1/auth/login", json={"email": "deact-rep@example.com", "password": "StrongPass1!"}
    )
    assert res.status_code == 401


async def test_change_password_revokes_sessions(client, db_session, seed_roles):
    admin = await register_org(client, "Chpwd Org", "chpwd-admin@example.com")
    org_id = await get_org_id(client, admin["access"])
    await seed_user(
        db_session,
        email="chpwd-rep@example.com",
        full_name="Chpwd Rep",
        org_id=org_id,
        role_name="sales_rep",
    )
    tokens = await login(client, "chpwd-rep@example.com")

    res = await client.post(
        "/api/v1/auth/change-password",
        headers=auth_headers(tokens["access"]),
        json={"current_password": "StrongPass1!", "new_password": "NewStrongPass1!"},
    )
    assert res.status_code == 200

    # Old refresh token must be dead after the password change.
    res = await client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh"]})
    assert res.status_code == 401
