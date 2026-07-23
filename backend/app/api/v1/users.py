"""
User Management Routes
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/{id}
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}
POST   /api/v1/users/{id}/activate
POST   /api/v1/users/{id}/deactivate
POST   /api/v1/users/{id}/roles
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import PaginatedResponse, StandardResponse
from app.schemas.user import UserCreateRequest, UserResponse, UserRoleAssignRequest, UserUpdateRequest
from app.services.user_service import UserService

router = APIRouter()


@router.get(
    "",
    response_model=StandardResponse[PaginatedResponse[UserResponse]],
    summary="List users",
    dependencies=[Depends(require_permission("user:read"))],
)
async def list_users(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
) -> dict:
    svc = UserService(db)
    users, total = await svc.list_users(
        current_user.organization_id, search, page, page_size
    )
    paginated = PaginatedResponse.create(
        data=[UserResponse.from_orm_with_roles(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
    )
    return {"success": True, "message": "OK", "data": paginated}


@router.post(
    "",
    response_model=StandardResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create user",
    dependencies=[Depends(require_permission("user:create"))],
)
async def create_user(
    payload: UserCreateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = UserService(db)
    user = await svc.create_user(payload, current_user.organization_id, current_user.id)
    return {"success": True, "message": "User created.", "data": UserResponse.from_orm_with_roles(user)}


@router.get(
    "/{user_id}",
    response_model=StandardResponse[UserResponse],
    summary="Get user by ID",
    dependencies=[Depends(require_permission("user:read"))],
)
async def get_user(
    user_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = UserService(db)
    user = await svc.get_user(user_id, current_user.organization_id)
    return {"success": True, "message": "OK", "data": UserResponse.from_orm_with_roles(user)}


@router.put(
    "/{user_id}",
    response_model=StandardResponse[UserResponse],
    summary="Update user",
    dependencies=[Depends(require_permission("user:update"))],
)
async def update_user(
    user_id: UUID,
    payload: UserUpdateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = UserService(db)
    user = await svc.update_user(user_id, current_user.organization_id, payload)
    return {"success": True, "message": "User updated.", "data": UserResponse.from_orm_with_roles(user)}


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user (soft)",
    dependencies=[Depends(require_permission("user:delete"))],
)
async def delete_user(
    user_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    svc = UserService(db)
    await svc.delete_user(user_id, current_user.organization_id, current_user.id)


@router.post(
    "/{user_id}/activate",
    response_model=StandardResponse[UserResponse],
    summary="Activate user account",
    dependencies=[Depends(require_permission("user:activate"))],
)
async def activate_user(
    user_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = UserService(db)
    user = await svc.activate_user(user_id, current_user.organization_id)
    return {"success": True, "message": "User activated.", "data": UserResponse.from_orm_with_roles(user)}


@router.post(
    "/{user_id}/deactivate",
    response_model=StandardResponse[UserResponse],
    summary="Deactivate user account",
    dependencies=[Depends(require_permission("user:deactivate"))],
)
async def deactivate_user(
    user_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = UserService(db)
    user = await svc.deactivate_user(user_id, current_user.organization_id, current_user.id)
    return {"success": True, "message": "User deactivated.", "data": UserResponse.from_orm_with_roles(user)}


@router.post(
    "/{user_id}/roles",
    response_model=StandardResponse[UserResponse],
    summary="Assign roles to user",
    dependencies=[Depends(require_permission("user:manage_roles"))],
)
async def assign_roles(
    user_id: UUID,
    payload: UserRoleAssignRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = UserService(db)
    user = await svc.assign_roles(
        user_id, current_user.organization_id, payload.role_ids, current_user.id
    )
    return {"success": True, "message": "Roles assigned.", "data": UserResponse.from_orm_with_roles(user)}
