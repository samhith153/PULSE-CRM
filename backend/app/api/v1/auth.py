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
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.deps import CurrentUser, DBSession
from app.core.exceptions import ForbiddenException, UnauthorizedException
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
    GoogleLoginRequest,
    GoogleCallbackRequest,
    AuthConfigResponse,
)
from app.schemas.common import StandardResponse
from app.services.auth_service import AuthService
from app.services.google_oauth_service import GoogleOAuthService

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
        avatar_url=current_user.avatar_url,
        phone=current_user.phone,
        job_title=current_user.job_title,
    )
    return {"success": True, "message": "OK", "data": response}


@router.get(
    "/config",
    response_model=StandardResponse[AuthConfigResponse],
    summary="Get public auth configurations",
    description="Returns public configuration details needed for authentication.",
)
async def get_auth_config() -> dict:
    from app.core.config import settings
    response = AuthConfigResponse(
        google_client_id=settings.GOOGLE_CLIENT_ID,
        google_redirect_uri=settings.GOOGLE_AUTH_REDIRECT_URI,
    )
    return {"success": True, "message": "OK", "data": response}


@router.post(
    "/google",
    response_model=StandardResponse[TokenResponse],
    summary="Authenticate with Google",
    description="Exchange a Google ID token credential for JWT access and refresh tokens.",
)
async def login_with_google(
    payload: GoogleLoginRequest,
    request: Request,
    db: DBSession,
) -> dict:
    client_ip = request.client.host if request.client else ""
    svc = AuthService(db)
    tokens = await svc.login_with_google(payload.credential, client_ip)
    return {"success": True, "message": "Login successful.", "data": tokens}



# ── Google OAuth 2.0 Flow (Existing Users Only) ──────────────────────────────

@router.get(
    "/google/auth-url",
    response_model=StandardResponse[dict],
    summary="Get Google OAuth authorization URL",
    description="Generate Google OAuth URL for existing users authentication.",
)
async def get_google_auth_url(db: DBSession) -> dict:
    """
    Returns the Google OAuth authorization URL and state for CSRF protection.
    Frontend should redirect user to this URL to initiate Google login.
    """
    svc = GoogleOAuthService(db)
    auth_url, state = svc.generate_auth_url()
    return {
        "success": True,
        "message": "Google auth URL generated.",
        "data": {"auth_url": auth_url, "state": state},
    }


@router.get(
    "/google/callback",
    summary="Google OAuth callback",
    description="Handle Google OAuth callback. Authenticates existing users only with their assigned roles.",
)
async def google_oauth_callback(
    code: str,
    state: str,
    request: Request,
    db: DBSession,
) -> dict:
    """
    Google OAuth callback endpoint.
    
    IMPORTANT: Only existing users can authenticate via this endpoint.
    Users must be created by admin first.
    
    Flow:
    1. Validate CSRF state
    2. Exchange authorization code for Google tokens
    3. Get user info from Google
    4. Find user in database by email
    5. If user exists: link Google account and authenticate with existing role
    6. If user doesn't exist: reject with error message
    
    Query params:
        code: Authorization code from Google
        state: CSRF state token
        
    Returns:
        Redirect to frontend with tokens or error
    """
    from fastapi.responses import RedirectResponse
    from app.core.config import settings

    client_ip = request.client.host if request.client else ""
    svc = GoogleOAuthService(db)

    try:
        # Exchange code for tokens and user info
        google_data = await svc.exchange_code_for_tokens(code, state)

        # Authenticate user and assign ADMIN role
        tokens = await svc.authenticate_admin_user(
            google_data["user_info"], client_ip
        )

        # Redirect to frontend with tokens
        frontend_url = settings.FRONTEND_URL or "http://localhost:3000"
        redirect_url = (
            f"{frontend_url}/auth/google/callback"
            f"?access_token={tokens['access_token']}"
            f"&refresh_token={tokens['refresh_token']}"
        )
        return RedirectResponse(url=redirect_url, status_code=302)

    except UnauthorizedException as e:
        # Invalid state or Google error
        frontend_url = settings.FRONTEND_URL or "http://localhost:3000"
        error_url = f"{frontend_url}/auth/google/error?message={str(e)}"
        return RedirectResponse(url=error_url, status_code=302)

    except Exception as e:
        # Unexpected error
        from app.core.logging import get_logger
        logger = get_logger(__name__)
        logger.error("Google OAuth callback error", extra={"error": str(e)})
        
        frontend_url = settings.FRONTEND_URL or "http://localhost:3000"
        error_url = f"{frontend_url}/auth/google/error?message=Authentication failed. Please try again."
        return RedirectResponse(url=error_url, status_code=302)
