"""
FastAPI Dependency Injection
Provides reusable dependencies for:
  - Database session
  - Current authenticated user
  - RBAC permission enforcement
"""
from typing import Annotated, Callable
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.permissions import resolve_permissions_for_user
from app.core.security import decode_access_token
from app.database.connection import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository

# OAuth2 / Bearer extractor
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate JWT access token and return the authenticated User."""
    if not credentials:
        raise UnauthorizedException("Missing Bearer token.")

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token payload.")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id_with_roles(UUID(user_id))

    if not user or not user.is_active or user.is_deleted:
        raise UnauthorizedException("User account not found or is inactive.")

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    return current_user


CurrentUser = Annotated[User, Depends(get_current_active_user)]
DBSession = Annotated[AsyncSession, Depends(get_db)]


def require_permission(permission: str) -> Callable:
    """Dependency factory for a required permission."""

    async def _check(current_user: CurrentUser) -> None:
        if current_user.is_superuser:
            return

        permissions = resolve_permissions_for_user(current_user)
        if permission not in permissions:
            raise ForbiddenException(permission)

    return _check


def require_any_permission(*permissions: str) -> Callable:
    """Pass if the user has at least one of the given permissions."""

    async def _check(current_user: CurrentUser) -> None:
        if current_user.is_superuser:
            return

        user_permissions = resolve_permissions_for_user(current_user)
        if not any(p in user_permissions for p in permissions):
            raise ForbiddenException(permissions[0])

    return _check


def require_role(*roles: str) -> Callable:
    """Pass if the user has any of the listed roles."""

    async def _check(current_user: CurrentUser) -> None:
        if current_user.is_superuser:
            return

        user_roles = {
            ur.role.name
            for ur in current_user.user_roles
            if ur.role and ur.role.name
        }
        if not any(role in user_roles for role in roles):
            raise ForbiddenException(f"Required role: {', '.join(roles)}")

    return _check
