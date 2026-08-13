"""RBAC tests: role → permission matrix, endpoint guards, persisted edits win."""
from sqlalchemy import delete, select

from app.core.permissions import Permission
from app.models.role import Permission as PermissionModel
from app.models.role import Role as RoleModel
from app.models.role import RolePermission

from tests.helpers import auth_headers, get_org_id, login, register_org, seed_user


async def _perms_for(client, email: str) -> list[str]:
    tokens = await login(client, email)
    res = await client.get("/api/v1/auth/me", headers=auth_headers(tokens["access"]))
    assert res.status_code == 200, res.text
    return res.json()["data"]["permissions"]


async def _org_with_user(client, db_session, *, org_name: str, email: str, role_name: str):
    await register_org(client, org_name, f"admin-{email}")
    org_id = await get_org_id(client, (await login(client, f"admin-{email}"))["access"])
    await seed_user(
        db_session, email=email, full_name=email.split("@")[0], org_id=org_id, role_name=role_name
    )
    return org_id


async def test_sales_rep_permission_set(client, db_session, seed_roles):
    await _org_with_user(
        client, db_session, org_name="Rep Perms Org", email="rep@example.com", role_name="sales_rep"
    )

    perms = await _perms_for(client, "rep@example.com")
    for granted in ("lead:create", "activity:create", "email:send", "file:read", "file:upload", "contact:read"):
        assert granted in perms, f"sales_rep should have {granted}"
    for denied in ("user:deactivate", "user:manage_roles", "system:admin", "report:export"):
        assert denied not in perms, f"sales_rep must NOT have {denied}"


async def test_manager_permission_set(client, db_session, seed_roles):
    await _org_with_user(
        client, db_session, org_name="Mgr Perms Org", email="mgr@example.com", role_name="manager"
    )

    perms = await _perms_for(client, "mgr@example.com")
    for granted in ("user:create", "team_performance:view", "email:send", "file:read", "report:export"):
        assert granted in perms, f"manager should have {granted}"
    assert "system:admin" not in perms


async def test_admin_has_every_permission(client, seed_roles):
    tokens = await register_org(client, "Admin Perms Org", "adm-perm@example.com")
    res = await client.get("/api/v1/auth/me", headers=auth_headers(tokens["access"]))
    assert res.status_code == 200, res.text
    perms = set(res.json()["data"]["permissions"])
    missing = {p.value for p in Permission} - perms
    assert not missing, f"admin missing permissions: {sorted(missing)}"


async def test_admin_only_endpoint_rejected_for_rep(client, db_session, seed_roles):
    await _org_with_user(
        client, db_session, org_name="Guard Org", email="guard-rep@example.com", role_name="sales_rep"
    )
    tokens = await login(client, "guard-rep@example.com")

    res = await client.get("/api/v1/dashboard/admin", headers=auth_headers(tokens["access"]))
    assert res.status_code == 403


async def test_persisted_role_edits_win_over_catalog(client, db_session, seed_roles):
    """Removing a permission from a system role in the admin UI must stick."""
    await _org_with_user(
        client, db_session, org_name="Edit Org", email="edit-rep@example.com", role_name="sales_rep"
    )

    # Sanity: catalog grants email:send by default.
    assert "email:send" in await _perms_for(client, "edit-rep@example.com")

    # Simulate the admin UI removing email:send from sales_rep (persisted row).
    role = (await db_session.execute(select(RoleModel).where(RoleModel.name == "sales_rep"))).scalar_one()
    perm = (
        await db_session.execute(select(PermissionModel).where(PermissionModel.codename == "email:send"))
    ).scalar_one()
    await db_session.execute(
        delete(RolePermission).where(
            RolePermission.role_id == role.id, RolePermission.permission_id == perm.id
        )
    )
    await db_session.flush()
    # Drop ORM caches so the next request re-reads role_permissions from the DB.
    db_session.expire_all()

    perms = await _perms_for(client, "edit-rep@example.com")
    assert "email:send" not in perms, "persisted edit must win over the built-in catalog"

    # The actual send endpoint is now blocked for the role too (403).
    res = await client.post(
        "/api/v1/gmail/send",
        headers=auth_headers((await login(client, "edit-rep@example.com"))["access"]),
        json={},
    )
    assert res.status_code == 403
