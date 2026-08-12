"""
Manager ↔ Sales Representative Assignment Tests
Covers: assign, re-assign, unassign, list managers, unassigned reps,
manager-scoped team view, and RBAC enforcement.
"""
from httpx import AsyncClient

PASSWORD = "Passw0rd@123"


def _role_id(roles, name: str) -> str:
    return next(r["id"] for r in roles if r["name"] == name)


async def _fetch_roles(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/roles", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    return resp.json()["data"]


async def _create_user(client: AsyncClient, auth_headers: dict, full_name: str, email: str, role_id: str):
    resp = await client.post("/api/v1/users", headers=auth_headers, json={
        "full_name": full_name,
        "email": email,
        "password": PASSWORD,
        "role_id": role_id,
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]


async def _login(client: AsyncClient, email: str):
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['data']['access_token']}"}


# ── Assign ────────────────────────────────────────────────────────────────────

async def test_assign_manager_to_sales_rep(client: AsyncClient, auth_headers, seed_roles):
    roles = await _fetch_roles(client, auth_headers)
    manager = await _create_user(client, auth_headers, "Mgr One", "mgr.one@company.com", _role_id(roles, "manager"))
    rep = await _create_user(client, auth_headers, "Rep One", "rep.one@company.com", _role_id(roles, "sales_rep"))

    resp = await client.post(
        f"/api/v1/users/{rep['id']}/manager",
        headers=auth_headers,
        json={"manager_id": manager["id"]},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["manager_id"] == manager["id"]
    assert data["manager_name"] == "Mgr One"


async def test_reassign_to_different_manager(client: AsyncClient, auth_headers, seed_roles):
    roles = await _fetch_roles(client, auth_headers)
    mgr_a = await _create_user(client, auth_headers, "Mgr A", "mgr.a@company.com", _role_id(roles, "manager"))
    mgr_b = await _create_user(client, auth_headers, "Mgr B", "mgr.b@company.com", _role_id(roles, "manager"))
    rep = await _create_user(client, auth_headers, "Rep Re", "rep.re@company.com", _role_id(roles, "sales_rep"))

    await client.post(f"/api/v1/users/{rep['id']}/manager", headers=auth_headers, json={"manager_id": mgr_a["id"]})
    resp = await client.post(
        f"/api/v1/users/{rep['id']}/manager",
        headers=auth_headers,
        json={"manager_id": mgr_b["id"]},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["data"]["manager_id"] == mgr_b["id"]


async def test_assign_same_manager_conflict(client: AsyncClient, auth_headers, seed_roles):
    roles = await _fetch_roles(client, auth_headers)
    manager = await _create_user(client, auth_headers, "Mgr Dup", "mgr.dup@company.com", _role_id(roles, "manager"))
    rep = await _create_user(client, auth_headers, "Rep Dup", "rep.dup@company.com", _role_id(roles, "sales_rep"))

    await client.post(f"/api/v1/users/{rep['id']}/manager", headers=auth_headers, json={"manager_id": manager["id"]})
    resp = await client.post(
        f"/api/v1/users/{rep['id']}/manager",
        headers=auth_headers,
        json={"manager_id": manager["id"]},
    )
    assert resp.status_code == 409


async def test_assign_non_sales_rep_rejected(client: AsyncClient, auth_headers, seed_roles):
    roles = await _fetch_roles(client, auth_headers)
    manager = await _create_user(client, auth_headers, "Mgr Two", "mgr.two@company.com", _role_id(roles, "manager"))
    other_admin = await _create_user(client, auth_headers, "Admin Two", "admin.two@company.com", _role_id(roles, "admin"))

    resp = await client.post(
        f"/api/v1/users/{other_admin['id']}/manager",
        headers=auth_headers,
        json={"manager_id": manager["id"]},
    )
    assert resp.status_code == 409


async def test_assign_to_non_manager_rejected(client: AsyncClient, auth_headers, seed_roles):
    roles = await _fetch_roles(client, auth_headers)
    rep_a = await _create_user(client, auth_headers, "Rep A", "rep.a@company.com", _role_id(roles, "sales_rep"))
    rep_b = await _create_user(client, auth_headers, "Rep B", "rep.b@company.com", _role_id(roles, "sales_rep"))

    resp = await client.post(
        f"/api/v1/users/{rep_a['id']}/manager",
        headers=auth_headers,
        json={"manager_id": rep_b["id"]},
    )
    assert resp.status_code == 409


async def test_assign_unknown_manager_rejected(client: AsyncClient, auth_headers, seed_roles):
    roles = await _fetch_roles(client, auth_headers)
    rep = await _create_user(client, auth_headers, "Rep C", "rep.c@company.com", _role_id(roles, "sales_rep"))

    resp = await client.post(
        f"/api/v1/users/{rep['id']}/manager",
        headers=auth_headers,
        json={"manager_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert resp.status_code == 404


# ── Unassign ──────────────────────────────────────────────────────────────────

async def test_remove_manager_assignment(client: AsyncClient, auth_headers, seed_roles):
    roles = await _fetch_roles(client, auth_headers)
    manager = await _create_user(client, auth_headers, "Mgr Three", "mgr.three@company.com", _role_id(roles, "manager"))
    rep = await _create_user(client, auth_headers, "Rep Three", "rep.three@company.com", _role_id(roles, "sales_rep"))

    await client.post(f"/api/v1/users/{rep['id']}/manager", headers=auth_headers, json={"manager_id": manager["id"]})

    resp = await client.delete(f"/api/v1/users/{rep['id']}/manager", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["manager_id"] is None
    assert data["manager_name"] is None

    # Removing again → conflict
    resp = await client.delete(f"/api/v1/users/{rep['id']}/manager", headers=auth_headers)
    assert resp.status_code == 409


# ── Listing helpers ───────────────────────────────────────────────────────────

async def test_list_managers(client: AsyncClient, auth_headers, seed_roles):
    roles = await _fetch_roles(client, auth_headers)
    await _create_user(client, auth_headers, "Mgr List", "mgr.list@company.com", _role_id(roles, "manager"))

    resp = await client.get("/api/v1/users/managers", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    names = [m["full_name"] for m in resp.json()["data"]]
    assert "Mgr List" in names


async def test_inactive_manager_rejected(client: AsyncClient, auth_headers, seed_roles):
    roles = await _fetch_roles(client, auth_headers)
    manager = await _create_user(client, auth_headers, "Mgr Off", "mgr.off@company.com", _role_id(roles, "manager"))
    rep = await _create_user(client, auth_headers, "Rep Off", "rep.off@company.com", _role_id(roles, "sales_rep"))

    # Deactivate the manager
    resp = await client.post(f"/api/v1/users/{manager['id']}/deactivate", headers=auth_headers)
    assert resp.status_code == 200, resp.text

    resp = await client.post(
        f"/api/v1/users/{rep['id']}/manager",
        headers=auth_headers,
        json={"manager_id": manager["id"]},
    )
    assert resp.status_code == 409


async def test_cannot_assign_manager_from_another_org(client: AsyncClient, auth_headers, seed_roles):
    # Register a second organization's admin
    resp = await client.post("/api/v1/auth/register", json={
        "full_name": "Other Org Admin",
        "email": "other.admin@example.com",
        "password": "Other@123456",
        "organization_name": "Other Organization",
    })
    assert resp.status_code == 201, resp.text
    other_headers = {"Authorization": f"Bearer {resp.json()['data']['access_token']}"}

    other_roles = await _fetch_roles(client, other_headers)
    other_manager = await _create_user(
        client, other_headers, "Other Mgr", "other.mgr@company.com", _role_id(other_roles, "manager")
    )

    # Org-1 admin tries to assign the other org's manager to a local rep
    roles = await _fetch_roles(client, auth_headers)
    rep = await _create_user(client, auth_headers, "Rep X", "rep.x@company.com", _role_id(roles, "sales_rep"))

    resp = await client.post(
        f"/api/v1/users/{rep['id']}/manager",
        headers=auth_headers,
        json={"manager_id": other_manager["id"]},
    )
    assert resp.status_code == 404


# ── Manager-scoped team view ──────────────────────────────────────────────────

async def test_manager_my_team_scoped(client: AsyncClient, auth_headers, seed_roles):
    roles = await _fetch_roles(client, auth_headers)
    manager = await _create_user(client, auth_headers, "Mgr Team", "mgr.team@company.com", _role_id(roles, "manager"))
    rep_1 = await _create_user(client, auth_headers, "Rep Team 1", "rep.team1@company.com", _role_id(roles, "sales_rep"))
    rep_2 = await _create_user(client, auth_headers, "Rep Team 2", "rep.team2@company.com", _role_id(roles, "sales_rep"))
    await _create_user(client, auth_headers, "Rep Other", "rep.other@company.com", _role_id(roles, "sales_rep"))

    await client.post(f"/api/v1/users/{rep_1['id']}/manager", headers=auth_headers, json={"manager_id": manager["id"]})
    await client.post(f"/api/v1/users/{rep_2['id']}/manager", headers=auth_headers, json={"manager_id": manager["id"]})

    manager_headers = await _login(client, "mgr.team@company.com")
    resp = await client.get("/api/v1/users/my-team", headers=manager_headers)
    assert resp.status_code == 200, resp.text
    team = resp.json()["data"]
    ids = {u["id"] for u in team}
    assert rep_1["id"] in ids
    assert rep_2["id"] in ids
    assert "rep.other@company.com" not in {u["email"] for u in team}


async def test_my_team_empty_before_assignment(client: AsyncClient, auth_headers, seed_roles):
    roles = await _fetch_roles(client, auth_headers)
    await _create_user(client, auth_headers, "Mgr Empty", "mgr.empty@company.com", _role_id(roles, "manager"))

    manager_headers = await _login(client, "mgr.empty@company.com")
    resp = await client.get("/api/v1/users/my-team", headers=manager_headers)
    assert resp.status_code == 200, resp.text
    assert resp.json()["data"] == []


# ── RBAC ──────────────────────────────────────────────────────────────────────

async def test_my_team_forbidden_for_sales_rep(client: AsyncClient, auth_headers, seed_roles):
    roles = await _fetch_roles(client, auth_headers)
    await _create_user(client, auth_headers, "Rep RBAC", "rep.rbac@company.com", _role_id(roles, "sales_rep"))

    rep_headers = await _login(client, "rep.rbac@company.com")
    resp = await client.get("/api/v1/users/my-team", headers=rep_headers)
    assert resp.status_code == 403


async def test_manager_cannot_assign(client: AsyncClient, auth_headers, seed_roles):
    roles = await _fetch_roles(client, auth_headers)
    manager = await _create_user(client, auth_headers, "Mgr RBAC", "mgr.rbac@company.com", _role_id(roles, "manager"))
    rep = await _create_user(client, auth_headers, "Rep RBAC2", "rep.rbac2@company.com", _role_id(roles, "sales_rep"))

    manager_headers = await _login(client, "mgr.rbac@company.com")
    resp = await client.post(
        f"/api/v1/users/{rep['id']}/manager",
        headers=manager_headers,
        json={"manager_id": manager["id"]},
    )
    assert resp.status_code == 403
