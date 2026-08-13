"""
Backend Tests — Task 5: Role assignment API → /me permissions + Org isolation on lead LIST

Two new meaningful tests:

1. test_role_assignment_via_api_reflects_in_me
   Assigns a role to a user via POST /api/v1/users/{id}/roles, then verifies
   /api/v1/auth/me returns the effective permissions for that role.

2. test_cross_org_lead_list_isolation
   Creates leads in Org A, then confirms Org B's lead LIST endpoint
   (/api/v1/leads) does not include them.  Extends the existing
   test_cross_org_lead_isolation (which only hits /leads/{id}) to cover
   the list view.
"""
import pytest
from httpx import AsyncClient

from tests.helpers import auth_headers, get_org_id, login, register_org, seed_user


# ── (1) Role assignment via API reflects in /me ──────────────────────────────

async def test_role_assignment_via_api_reflects_in_me(
    client, db_session, seed_roles
):
    """
    Verify that assigning a role to a user through the REST API
    (POST /api/v1/users/{id}/roles) is reflected in the effective
    permissions returned by GET /api/v1/auth/me for that user.

    Steps:
      1. Register an admin-run org.
      2. Seed a plain user (no role yet) into that org.
      3. Assign the "sales_rep" role to the seeded user via the API
         (admin must have user:manage_roles).
      4. Log in as the seeded user and hit /me.
      5. Assert the permissions match what sales_rep is expected to have.
    """
    # --- setup: admin + org ---
    admin = await register_org(client, "RoleAssign Org", "ra-admin@example.com")
    org_id = await get_org_id(client, admin["access"])

    # --- seed a user with NO role (so we can see the delta) ---
    user = await seed_user(
        db_session,
        email="ra-target@example.com",
        full_name="Role Assign Target",
        org_id=org_id,
        role_name=None,          # no role initially
    )

    # sanity: /me for the target shows no permissions yet (or only defaults)
    target_tokens = await login(client, "ra-target@example.com")
    me_before = await client.get(
        "/api/v1/auth/me", headers=auth_headers(target_tokens["access"])
    )
    assert me_before.status_code == 200, me_before.text
    perms_before = set(me_before.json()["data"]["permissions"])

    # --- fetch the sales_rep role id from the DB ---
    from app.models.role import Role as RoleModel
    from sqlalchemy import select
    role_row = await db_session.execute(
        select(RoleModel).where(RoleModel.name == "sales_rep")
    )
    sales_rep_role = role_row.scalar_one()
    role_id = sales_rep_role.id

    # --- assign the role via the API (admin does it) ---
    assign_resp = await client.post(
        f"/api/v1/users/{user.id}/roles",
        headers=auth_headers(admin["access"]),
        json={"role_id": str(role_id)},
    )
    assert assign_resp.status_code == 200, assign_resp.text

    # --- re-login as the target and check /me ---
    target_tokens = await login(client, "ra-target@example.com")
    me_after = await client.get(
        "/api/v1/auth/me", headers=auth_headers(target_tokens["access"])
    )
    assert me_after.status_code == 200, me_after.text
    perms_after = set(me_after.json()["data"]["permissions"])

    # permissions should have grown (sales_rep grants several)
    assert len(perms_after) > len(perms_before), (
        "role assignment should add permissions"
    )

    # sales_rep-specific grants must be present
    for granted in ("lead:create", "activity:create", "email:send",
                    "file:read", "file:upload", "contact:read"):
        assert granted in perms_after, (
            f"sales_rep should have {granted} after role assignment"
        )

    # admin-only permissions must still be absent
    for denied in ("user:deactivate", "user:manage_roles", "system:admin",
                   "report:export"):
        assert denied not in perms_after, (
            f"sales_rep must NOT have {denied}"
        )


# ── (2) Cross-org lead LIST isolation ────────────────────────────────────────

async def test_cross_org_lead_list_isolation(client, seed_roles):
    """
    Confirm that a user in Org B cannot see leads belonging to Org A
    when hitting the leads LIST endpoint (/api/v1/leads).

    This complements test_cross_org_lead_isolation (which only tests
    GET /leads/{id}) by exercising the paginated list view.
    """
    a = await register_org(client, "LeadList Org A", "ll-a@example.com")
    b = await register_org(client, "LeadList Org B", "ll-b@example.com")

    # Create a lead in Org A
    created = await client.post(
        "/api/v1/leads",
        headers=auth_headers(a["access"]),
        json={"title": "Org A Secret Lead", "source": "website"},
    )
    assert created.status_code == 201, created.text
    lead_title = created.json()["data"]["title"]

    # Org B lists leads — must NOT contain Org A's lead
    lst = await client.get(
        "/api/v1/leads", headers=auth_headers(b["access"])
    )
    assert lst.status_code == 200, lst.text
    leads_data = lst.json()["data"]["data"]
    titles = [ld["title"] for ld in leads_data]
    assert lead_title not in titles, (
        f"Org B must not see Org A's lead '{lead_title}' in the list"
    )

    # Also confirm Org A CAN see its own lead in the list
    lst_a = await client.get(
        "/api/v1/leads", headers=auth_headers(a["access"])
    )
    assert lst_a.status_code == 200, lst_a.text
    titles_a = [ld["title"] for ld in lst_a.json()["data"]["data"]]
    assert lead_title in titles_a, (
        f"Org A should see its own lead '{lead_title}' in the list"
    )
