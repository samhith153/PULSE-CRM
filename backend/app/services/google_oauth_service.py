"""
Google OAuth Service
Handles Google OAuth 2.0 authentication flow and token exchange.
EXISTING USERS ONLY: Only users already in database can authenticate via Google.
Users login with their existing role (admin, manager, sales_rep, etc.).
"""
from __future__ import annotations

import secrets
import time
from datetime import datetime, timezone
from typing import Dict, Optional
from urllib.parse import urlencode

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.core.logging import get_logger
from app.core.permissions import resolve_permissions_for_user
from app.core.security import create_access_token, create_refresh_token
from app.models.user import User

logger = get_logger(__name__)

# In-memory state store (for CSRF protection)
# NOTE: per-process memory — works for single-worker deployments.
_oauth_states: Dict[str, float] = {}  # state -> created timestamp (monotonic)
_OAUTH_STATE_TTL_SECONDS = 600  # 10 minutes


def _prune_oauth_states() -> None:
    """Remove expired CSRF states so the store cannot grow unbounded."""
    now = time.monotonic()
    for s in [k for k, created in _oauth_states.items() if now - created > _OAUTH_STATE_TTL_SECONDS]:
        del _oauth_states[s]


class GoogleOAuthService:
    """Manages Google OAuth 2.0 authentication for existing users only."""

    GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

    def __init__(self, db: AsyncSession):
        self.db = db

    def generate_auth_url(self) -> tuple[str, str]:
        """
        Generate Google OAuth authorization URL with CSRF state.
        Returns: (auth_url, state)
        """
        _prune_oauth_states()
        state = secrets.token_urlsafe(32)
        _oauth_states[state] = time.monotonic()

        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_AUTH_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }

        auth_url = f"{self.GOOGLE_AUTH_URL}?{urlencode(params)}"
        return auth_url, state

    async def exchange_code_for_tokens(
        self, code: str, state: str
    ) -> dict:
        """
        Exchange authorization code for access token and user info.
        Validates CSRF state and retrieves user profile from Google.

        Returns: dict with access_token, refresh_token, user_info
        Raises: UnauthorizedException if state is invalid or exchange fails
        """
        # Validate state (single-use; removes it even on expiry)
        if _oauth_states.pop(state, None) is None:
            logger.warning("Invalid OAuth state received", extra={"state": state})
            raise UnauthorizedException("Invalid OAuth state. Please try again.")

        # Exchange code for token
        async with httpx.AsyncClient() as client:
            try:
                token_response = await client.post(
                    self.GOOGLE_TOKEN_URL,
                    data={
                        "code": code,
                        "client_id": settings.GOOGLE_CLIENT_ID,
                        "client_secret": settings.GOOGLE_CLIENT_SECRET,
                        "redirect_uri": settings.GOOGLE_AUTH_REDIRECT_URI,
                        "grant_type": "authorization_code",
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
                token_response.raise_for_status()
                tokens = token_response.json()

                # Get user info
                userinfo_response = await client.get(
                    self.GOOGLE_USERINFO_URL,
                    headers={"Authorization": f"Bearer {tokens['access_token']}"},
                )
                userinfo_response.raise_for_status()
                user_info = userinfo_response.json()

                return {
                    "access_token": tokens.get("access_token"),
                    "refresh_token": tokens.get("refresh_token"),
                    "user_info": user_info,
                }

            except httpx.HTTPStatusError as e:
                logger.error(
                    "Google token exchange failed",
                    extra={"status": e.response.status_code, "error": e.response.text},
                )
                raise UnauthorizedException(
                    "Failed to authenticate with Google. Please try again."
                )
            except Exception as e:
                logger.error("Google OAuth error", extra={"error": str(e)})
                raise UnauthorizedException(
                    "Google authentication failed. Please try again."
                )

    async def authenticate_admin_user(
        self, google_user_info: dict, client_ip: str
    ) -> dict:
        """
        Authenticate user via Google OAuth - ONLY for existing users.

        Flow:
        1. Find user by email in database
        2. If user exists:
           - Link Google account to existing user
           - Keep existing role (admin, manager, sales_rep, etc.)
           - Update profile with Google info
        3. If user doesn't exist:
           - REJECT authentication
           - User must be created by admin first

        Args:
            google_user_info: User info from Google (id, email, name, picture, verified_email)
            client_ip: Client IP address for audit logging

        Returns:
            dict with access_token and refresh_token

        Raises:
            UnauthorizedException: If email not found in database
        """
        google_id = google_user_info.get("id")
        email = google_user_info.get("email")
        full_name = google_user_info.get("name", "")
        picture = google_user_info.get("picture")
        email_verified = google_user_info.get("verified_email", False)

        if not google_id or not email:
            raise UnauthorizedException("Invalid Google user information.")

        logger.info(
            "Google OAuth authentication attempt",
            extra={"google_id": google_id, "email": email, "ip": client_ip},
        )

        # Find user by google_id or email
        user = await self._find_user_by_google_or_email(google_id, email)

        if user:
            # Existing user - link Google account and keep existing role
            logger.info(
                "Google OAuth: Existing user found",
                extra={"user_id": str(user.id), "email": email},
            )

            # Update Google OAuth info
            if not user.google_id:
                user.google_id = google_id
                user.auth_provider = "google"

            # Update profile picture if provided
            if picture and not user.avatar_url:
                user.avatar_url = picture

            # Update full name if the user has none set
            if full_name and not user.full_name:
                user.full_name = full_name

            # Mark as verified
            if email_verified and not user.is_verified:
                user.is_verified = True

            # Log existing role
            user_roles = [ur.role.name for ur in user.user_roles if ur.role]
            logger.info(
                "Google OAuth: User authenticated with existing roles",
                extra={"user_id": str(user.id), "email": email, "roles": user_roles},
            )
        else:
            # User not found - REJECT authentication
            logger.warning(
                "Google OAuth: Authentication rejected - email not found in database",
                extra={"google_id": google_id, "email": email, "ip": client_ip},
            )
            raise UnauthorizedException(
                "This Google account is not registered in PULSE CRM. "
                "Please contact your administrator to create an account for you."
            )

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        user.last_login_ip = client_ip

        await self.db.commit()
        await self.db.refresh(user)

        # Generate JWT tokens with user's actual role
        permissions = resolve_permissions_for_user(user)

        # Get primary role (first role assigned to user)
        user_roles = [ur.role.name for ur in user.user_roles if ur.role]
        primary_role = user_roles[0] if user_roles else "sales_rep"

        access_token = create_access_token(
            user_id=user.id,
            organization_id=user.organization_id,
            role=primary_role,  # Use actual role, not hardcoded "admin"
            permissions=permissions,
        )
        refresh_token = create_refresh_token(user.id)

        logger.info(
            "Google OAuth success: User authenticated",
            extra={"user_id": str(user.id), "email": email, "role": primary_role},
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    async def _find_user_by_google_or_email(
        self, google_id: str, email: str
    ) -> Optional[User]:
        """
        Find user by google_id or email.
        Loads user with roles for permission checking.
        """
        # Try google_id first
        stmt = (
            select(User)
            .where(User.google_id == google_id)
            .where(User.is_deleted.is_(False))
        )
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if user:
            # Load roles explicitly
            await self.db.refresh(user, ["user_roles"])
            return user

        # Try email
        stmt = (
            select(User)
            .where(User.email == email)
            .where(User.is_deleted.is_(False))
        )
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if user:
            await self.db.refresh(user, ["user_roles"])
            return user

        return None
