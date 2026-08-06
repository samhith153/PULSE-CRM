"""
RBAC Bootstrap
──────────────
Guarantees the built-in roles and permissions always exist in the database.

The `roles` / `permissions` tables are the backbone of authorization: when they
are empty, registration silently creates users with no role, the admin UI cannot
offer a role to assign, and role assignment fails with a 404. Running this on
application startup makes a fresh or partially-migrated database self-healing
instead of requiring `python -m scripts.seed` to have been run by hand.

Every step is idempotent — existing rows are reused, never duplicated.
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.core.permissions import ROLE_PERMISSIONS, Permission, Role
from app.models.role import Permission as PermissionModel
from app.models.role import Role as RoleModel
from app.models.role import RolePermission

logger = get_logger(__name__)

ROLE_DISPLAY_NAMES: dict[Role, str] = {
    Role.ADMIN: "Administrator",
    Role.MANAGER: "Sales Manager",
    Role.SALES_REP: "Sales Representative",
}

ROLE_DESCRIPTIONS: dict[Role, str] = {
    Role.ADMIN: "Full access to every workspace feature and setting.",
    Role.MANAGER: "Manages the sales team, pipeline and reporting.",
    Role.SALES_REP: "Works leads, contacts and deals they own.",
}


async def ensure_permissions(db: AsyncSession) -> dict[str, PermissionModel]:
    """Create any missing permission rows and return the full codename map."""
    result = await db.execute(select(PermissionModel))
    existing = {p.codename: p for p in result.scalars().all()}

    created = 0
    for permission in Permission:
        if permission.value in existing:
            continue
        resource, action = permission.value.split(":", 1)
        row = PermissionModel(
            codename=permission.value,
            name=permission.value.replace(":", " ").replace("_", " ").title(),
            resource=resource,
            action=action,
        )
        db.add(row)
        existing[permission.value] = row
        created += 1

    if created:
        await db.flush()
        logger.info("RBAC bootstrap created %d permission(s)", created)

    return existing


async def ensure_roles(
    db: AsyncSession,
    permission_map: dict[str, PermissionModel],
) -> dict[str, RoleModel]:
    """Create any missing built-in roles and wire up their default permissions."""
    result = await db.execute(select(RoleModel))
    existing = {r.name: r for r in result.scalars().all()}

    created_roles = 0
    for role in Role:
        if role.value not in existing:
            row = RoleModel(
                name=role.value,
                display_name=ROLE_DISPLAY_NAMES[role],
                description=ROLE_DESCRIPTIONS[role],
                is_system=True,
            )
            db.add(row)
            existing[role.value] = row
            created_roles += 1

    if created_roles:
        await db.flush()

    # Attach default permissions only for role/permission pairs that are missing,
    # so admin-UI customizations to an existing role are never overwritten.
    pair_result = await db.execute(select(RolePermission.role_id, RolePermission.permission_id))
    existing_pairs = {(role_id, permission_id) for role_id, permission_id in pair_result.all()}

    created_pairs = 0
    for role in Role:
        role_row = existing[role.value]
        for permission in ROLE_PERMISSIONS.get(role, set()):
            permission_row = permission_map.get(permission.value)
            if not permission_row:
                continue
            if (role_row.id, permission_row.id) in existing_pairs:
                continue
            db.add(RolePermission(role_id=role_row.id, permission_id=permission_row.id))
            existing_pairs.add((role_row.id, permission_row.id))
            created_pairs += 1

    if created_pairs:
        await db.flush()

    if created_roles or created_pairs:
        logger.info(
            "RBAC bootstrap created %d role(s) and %d role-permission link(s)",
            created_roles,
            created_pairs,
        )

    return existing


async def ensure_rbac_seeded(db: AsyncSession) -> dict[str, RoleModel]:
    """Ensure built-in permissions and roles exist. Returns the role map by name."""
    permission_map = await ensure_permissions(db)
    return await ensure_roles(db, permission_map)


async def bootstrap_rbac_on_startup() -> None:
    """Startup hook — self-heals RBAC tables without blocking app boot on failure."""
    from app.database.connection import AsyncSessionFactory

    try:
        async with AsyncSessionFactory() as db:
            await ensure_rbac_seeded(db)
            await db.commit()
    except Exception:
        logger.exception("RBAC bootstrap failed — roles may be missing")
