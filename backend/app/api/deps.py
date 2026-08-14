"""
FastAPI Dependency Injection
Provides reusable dependencies for:
  - Database session
  - Current authenticated user
  - RBAC permission enforcement
"""
import time
from typing import Annotated, Callable
from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.permissions import Role, resolve_permissions_for_user
from app.core.security import decode_access_token
from app.database.connection import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository

# OAuth2 / Bearer extractor
security = HTTPBearer(auto_error=False)

# ── In-process RBAC user cache (60s TTL) ────────────────────────────────────
# Caches the full User object (with loaded roles/permissions) to avoid the
# 4-query selectinload chain on every authenticated request. Invalidated
# explicitly on role/permission changes via the helpers below.
_USER_CACHE_TTL = 60  # seconds
_user_cache: dict[str, tuple[float, User]] = {}


def invalidate_user_cache(user_id: str) -> None:
    """Drop the cached User for a specific user (call on role change)."""
    _user_cache.pop(user_id, None)


def invalidate_user_cache_all() -> None:
    """Clear the entire user cache (call when role permissions change)."""
    _user_cache.clear()


async def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate JWT access token and return the authenticated User.

    Tokens are accepted **only** from the ``Authorization: Bearer <token>`` header.
    Query-parameter tokens are rejected to prevent token leakage via logs,
    browser history, and Referer headers.

    The resolved User (with roles/permissions) is cached in-process for 60s
    to avoid the 4-query selectinload chain on every request.
    """
    if not credentials or not credentials.credentials:
        raise UnauthorizedException("Missing Bearer token.")

    token = credentials.credentials

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token payload.")

    # Check cache
    cached = _user_cache.get(user_id)
    if cached and time.time() - cached[0] < _USER_CACHE_TTL:
        user = cached[1]
        if not user.is_active or user.is_deleted:
            raise UnauthorizedException("User account not found or is inactive.")
        return user

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id_with_roles(UUID(user_id))

    if not user or not user.is_active or user.is_deleted:
        raise UnauthorizedException("User account not found or is inactive.")

    _user_cache[user_id] = (time.time(), user)
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
        permissions = resolve_permissions_for_user(current_user)
        if permission not in permissions:
            raise ForbiddenException(permission)

    return _check


def require_any_permission(*permissions: str) -> Callable:
    """Pass if the user has at least one of the given permissions."""

    async def _check(current_user: CurrentUser) -> None:
        user_permissions = resolve_permissions_for_user(current_user)
        if not any(p in user_permissions for p in permissions):
            raise ForbiddenException(permissions[0])

    return _check


def require_role(*roles: Role | str) -> Callable:
    """Pass if the user has any of the listed roles.

    Accepts Role enum values or raw role name strings for backward compatibility.
    """

    async def _check(current_user: CurrentUser) -> None:
        # Normalize all role names to strings for comparison
        required_role_names = {
            role.value if isinstance(role, Role) else str(role)
            for role in roles
        }

        user_roles = {
            ur.role.name
            for ur in current_user.user_roles
            if ur.role and ur.role.name
        }
        if not required_role_names.intersection(user_roles):
            raise ForbiddenException(f"Required role: {', '.join(required_role_names)}")

    return _check
