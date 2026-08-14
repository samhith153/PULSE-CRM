"""
Role & Permission Management Routes
GET    /api/v1/roles
GET    /api/v1/roles/{role_id}
PUT    /api/v1/roles/{role_id}/permissions
GET    /api/v1/permissions
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DBSession, invalidate_user_cache_all, require_permission
from app.models.role import Permission, Role, RolePermission
from app.repositories.role_repository import RoleRepository
from app.schemas.common import StandardResponse

router = APIRouter()


class RoleResponse(BaseModel):
    id: UUID
    name: str
    display_name: str
    description: str | None
    is_system: bool
    permissions: List[str]

    model_config = {"from_attributes": True}


class PermissionResponse(BaseModel):
    id: UUID
    codename: str
    name: str
    description: str | None
    resource: str
    action: str

    model_config = {"from_attributes": True}


class UpdatePermissionsRequest(BaseModel):
    permission_codenames: List[str]


@router.get(
    "",
    response_model=StandardResponse[List[RoleResponse]],
    summary="List all roles with permissions",
    dependencies=[Depends(require_permission("user:read"))],
)
async def list_roles(
    db: DBSession,
    _current_user: CurrentUser,
) -> dict:
    repo = RoleRepository(db)
    roles = await repo.get_all_with_permissions()
    result = []
    for role in roles:
        perms = [
            rp.permission.codename
            for rp in role.role_permissions
            if rp.permission
        ]
        result.append(RoleResponse(
            id=role.id,
            name=role.name,
            display_name=role.display_name,
            description=role.description,
            is_system=role.is_system,
            permissions=perms,
        ))
    return {"success": True, "message": "OK", "data": result}


@router.get(
    "/{role_id}",
    response_model=StandardResponse[RoleResponse],
    summary="Get role by ID",
    dependencies=[Depends(require_permission("user:read"))],
)
async def get_role(
    role_id: UUID,
    db: DBSession,
    _current_user: CurrentUser,
) -> dict:
    repo = RoleRepository(db)
    role = await repo.get_by_id_with_permissions(role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    perms = [
        rp.permission.codename
        for rp in role.role_permissions
        if rp.permission
    ]
    return {
        "success": True,
        "message": "OK",
        "data": RoleResponse(
            id=role.id,
            name=role.name,
            display_name=role.display_name,
            description=role.description,
            is_system=role.is_system,
            permissions=perms,
        ),
    }


@router.put(
    "/{role_id}/permissions",
    response_model=StandardResponse[RoleResponse],
    summary="Update permissions for a role",
    dependencies=[Depends(require_permission("user:manage_roles"))],
)
async def update_role_permissions(
    role_id: UUID,
    payload: UpdatePermissionsRequest,
    db: DBSession,
    _current_user: CurrentUser,
) -> dict:
    repo = RoleRepository(db)
    role = await repo.get_by_id_with_permissions(role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    perm_repo = repo.permission_repo
    permissions = await perm_repo.get_by_codenames(payload.permission_codenames)
    found = {p.codename for p in permissions}
    requested = set(payload.permission_codenames)
    if missing := requested - found:
        raise HTTPException(
            status_code=400,
            detail=f"Permissions not found: {', '.join(sorted(missing))}",
        )

    stmt = select(RolePermission).where(RolePermission.role_id == role_id)
    result = await db.execute(stmt)
    for rp in result.scalars().all():
        await db.delete(rp)
    await db.flush()

    for perm in permissions:
        rp = RolePermission(role_id=role_id, permission_id=perm.id)
        db.add(rp)

    await db.flush()
    db.expire(role)
    role = await repo.get_by_id_with_permissions(role_id)

    perms = [
        rp.permission.codename
        for rp in role.role_permissions
        if rp.permission
    ]
    invalidate_user_cache_all()
    return {
        "success": True,
        "message": "Permissions updated.",
        "data": RoleResponse(
            id=role.id,
            name=role.name,
            display_name=role.display_name,
            description=role.description,
            is_system=role.is_system,
            permissions=perms,
        ),
    }


@router.get(
    "/permissions/all",
    response_model=StandardResponse[List[PermissionResponse]],
    summary="List all available permissions",
    dependencies=[Depends(require_permission("user:read"))],
)
async def list_permissions(
    db: DBSession,
    _current_user: CurrentUser,
) -> dict:
    stmt = select(Permission).order_by(Permission.resource, Permission.action)
    result = await db.execute(stmt)
    permissions = list(result.scalars().all())
    return {
        "success": True,
        "message": "OK",
        "data": [
            PermissionResponse(
                id=p.id,
                codename=p.codename,
                name=p.name,
                description=p.description,
                resource=p.resource,
                action=p.action,
            )
            for p in permissions
        ],
    }
