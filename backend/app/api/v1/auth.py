"""
Authentication Routes
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/change-password
GET  /api/v1/auth/me
"""
from fastapi import APIRouter, Depends, Request, status

from app.api.deps import CurrentUser, DBSession
from app.core.permissions import resolve_permissions_for_user
from app.schemas.auth import (
    ChangePasswordRequest,
    CurrentUserResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.common import StandardResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post(
    "/register",
    response_model=StandardResponse[TokenResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register new organization and admin user",
    description=(
        "Creates a new Organization and the first Admin user. "
        "Returns JWT access and refresh tokens on success."
    ),
)
async def register(
    payload: RegisterRequest,
    request: Request,
    db: DBSession,
) -> dict:
    client_ip = request.client.host if request.client else ""
    svc = AuthService(db)
    tokens = await svc.register(payload, client_ip)
    return {"success": True, "message": "Registration successful.", "data": tokens}


@router.post(
    "/login",
    response_model=StandardResponse[TokenResponse],
    summary="Authenticate user",
    description="Exchange email + password for JWT access and refresh tokens.",
)
async def login(
    payload: LoginRequest,
    request: Request,
    db: DBSession,
) -> dict:
    client_ip = request.client.host if request.client else ""
    svc = AuthService(db)
    tokens = await svc.login(payload, client_ip)
    return {"success": True, "message": "Login successful.", "data": tokens}


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout (client-side token invalidation)",
    description=(
        "The server is stateless (JWTs); clients should delete tokens locally. "
        "This endpoint exists for audit logging and future token revocation (Redis blacklist)."
    ),
)
async def logout(current_user: CurrentUser) -> None:
    return None


@router.post(
    "/refresh",
    response_model=StandardResponse[TokenResponse],
    summary="Refresh access token",
    description="Exchange a valid refresh token for a new access token pair.",
)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: DBSession,
) -> dict:
    svc = AuthService(db)
    tokens = await svc.refresh_token(payload.refresh_token)
    return {"success": True, "message": "Token refreshed.", "data": tokens}


@router.post(
    "/forgot-password",
    response_model=StandardResponse[None],
    summary="Request password reset email",
    description=(
        "Triggers a password reset email. "
        "Returns 200 regardless of whether the email exists (prevent enumeration)."
    ),
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: DBSession,
) -> dict:
    svc = AuthService(db)
    await svc.forgot_password(payload.email)
    return {
        "success": True,
        "message": "If that email is registered, a reset link has been sent.",
        "data": None,
    }


@router.post(
    "/reset-password",
    response_model=StandardResponse[None],
    summary="Reset password with token",
    description="Consumes the one-time token and sets the new password.",
)
async def reset_password(
    payload: ResetPasswordRequest,
    db: DBSession,
) -> dict:
    svc = AuthService(db)
    await svc.reset_password(payload)
    return {"success": True, "message": "Password has been reset successfully.", "data": None}


@router.post(
    "/change-password",
    response_model=StandardResponse[None],
    summary="Change own password",
    description="Authenticated users can change their own password.",
)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = AuthService(db)
    await svc.change_password(current_user, payload)
    return {"success": True, "message": "Password changed successfully.", "data": None}


@router.get(
    "/me",
    response_model=StandardResponse[CurrentUserResponse],
    summary="Get current authenticated user",
    description="Returns the profile and permissions of the currently logged-in user.",
)
async def get_me(current_user: CurrentUser) -> dict:
    permissions = resolve_permissions_for_user(current_user)

    response = CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        organization_id=current_user.organization_id,
        roles=[ur.role.name for ur in current_user.user_roles if ur.role],
        permissions=permissions,
        is_verified=current_user.is_verified,
        is_superuser=current_user.is_superuser,
    )
    return {"success": True, "message": "OK", "data": response}
