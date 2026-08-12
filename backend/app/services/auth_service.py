"""
Authentication Service
All authentication business logic lives here - never in route handlers.
"""
import re
from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    BusinessRuleException,
    DuplicateException,
    InvalidCredentialsException,
    NotFoundException,
    TokenExpiredException,
    UnauthorizedException,
    WeakPasswordException,
)
from app.core.logging import get_logger
from app.core.permissions import resolve_permissions_for_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_secure_token,
    hash_password,
    hash_token,
    verify_password,
    check_password_strength,
)
from app.models.user import User
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.services.email_service import EmailService
from app.services.event_service import EventService

logger = get_logger(__name__)


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug[:100]


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.user_repo = UserRepository(db)
        self.org_repo = OrganizationRepository(db)
        self.role_repo = RoleRepository(db)
        self.refresh_token_repo = RefreshTokenRepository(db)
        self.email_service = EmailService(db)
        self.events = EventService(db)

    async def register(
        self,
        payload: RegisterRequest,
        client_ip: str = "",
        user_agent: str = "",
    ) -> TokenResponse:
        """Create a new Organization + Admin user."""
        is_valid, reason = check_password_strength(payload.password)
        if not is_valid:
            raise WeakPasswordException(reason)

        existing = await self.user_repo.get_by_email_any(payload.email.lower())
        if existing:
            raise DuplicateException("User", "email", payload.email)

        org_name = payload.organization_name.strip()
        existing_org = await self.org_repo.get_by_name(org_name)
        if existing_org:
            raise DuplicateException("Organization", "name", org_name)

        slug = _slugify(org_name)
        organization = await self.org_repo.create(name=org_name, slug=slug)

        admin_role = await self.role_repo.get_by_name("admin")

        try:
            user = await self.user_repo.create(
                email=payload.email.lower(),
                full_name=payload.full_name.strip(),
                hashed_password=hash_password(payload.password),
                organization_id=organization.id,
                is_verified=True,
                last_login_ip=client_ip,
                last_login_at=datetime.now(timezone.utc),
            )
        except IntegrityError:
            await self.db.rollback()
            raise DuplicateException("User", "email", payload.email)

        if admin_role:
            await self.user_repo.assign_role(user, admin_role.id, user.id)
            user = await self.user_repo.get_by_id_with_roles(user.id)

        logger.info("New user registered", extra={"user_id": str(user.id), "org": org_name})
        await self.events.record_event(
            "USER_REGISTERED",
            organization_id=organization.id,
            actor_id=user.id,
            aggregate_type="user",
            aggregate_id=str(user.id),
            source="auth",
            payload={
                "user_id": str(user.id),
                "organization_id": str(organization.id),
                "email": user.email,
                "organization_name": org_name,
            },
        )
        await self.email_service.send_welcome_email(user, organization_name=org_name)
        return await self._build_tokens(user, client_ip, user_agent)

    async def login(
        self,
        payload: LoginRequest,
        client_ip: str = "",
        user_agent: str = "",
    ) -> TokenResponse:
        user = await self.user_repo.get_by_email(payload.email.lower())

        if not user or not verify_password(payload.password, user.hashed_password):
            raise InvalidCredentialsException()

        if not user.is_active:
            raise UnauthorizedException("Your account has been deactivated.")

        await self.user_repo.update(
            user,
            last_login_at=datetime.now(timezone.utc),
            last_login_ip=client_ip,
        )

        logger.info("User logged in", extra={"user_id": str(user.id)})
        tokens = await self._build_tokens(user, client_ip, user_agent)
        try:
            async with self.db.begin_nested():
                await self.events.record_event(
                    "USER_LOGGED_IN",
                    organization_id=user.organization_id,
                    actor_id=user.id,
                    aggregate_type="user",
                    aggregate_id=str(user.id),
                    source="auth",
                    payload={"user_id": str(user.id), "email": user.email, "client_ip": client_ip},
                )
        except Exception:
            logger.exception("Failed to record login event", extra={"user_id": str(user.id)})
        return tokens

    async def refresh_token(
        self,
        refresh_token: str,
        client_ip: str = "",
        user_agent: str = "",
    ) -> TokenResponse:
        """Rotate a refresh token: validate the presented token against the
        server-side store, revoke it, and mint a fresh pair.

        Reuse detection: presenting a token that has already been rotated
        (or a token with no store record) revokes the entire session family
        for the user, per RFC 6749 §10.4 / OAuth security guidance.
        """
        payload = decode_refresh_token(refresh_token)
        user_id = UUID(payload["sub"])

        stored = await self.refresh_token_repo.get_by_hash(hash_token(refresh_token))

        if stored is None:
            # Either a token minted before this feature shipped, or a rotated
            # token being replayed. Treat as reuse: kill every session for the user.
            logger.warning(
                "Refresh token reuse detected (no store record); revoking all sessions",
                extra={"user_id": str(user_id)},
            )
            await self.refresh_token_repo.revoke_all_for_user(user_id)
            await self.events.record_event(
                "REFRESH_TOKEN_REUSE_DETECTED",
                organization_id=None,
                actor_id=user_id,
                aggregate_type="user",
                aggregate_id=str(user_id),
                source="auth",
                payload={"user_id": str(user_id), "client_ip": client_ip},
            )
            raise UnauthorizedException("Refresh token has been revoked.")

        if stored.is_revoked or stored.is_expired:
            if stored.replaced_by_hash is not None:
                # This token was already rotated — replaying it means the
                # refresh token was stolen. Revoke the whole session family.
                logger.warning(
                    "Refresh token reuse detected (rotated token replayed); revoking all sessions",
                    extra={"user_id": str(user_id)},
                )
                await self.refresh_token_repo.revoke_all_for_user(user_id)
            raise UnauthorizedException("Refresh token has been revoked.")

        user = await self.user_repo.get_by_id_with_roles(user_id)
        if not user or not user.is_active:
            raise UnauthorizedException()

        # Rotate: revoke the old token, chained to its replacement.
        new_token = create_refresh_token(user_id=user.id)
        await self.refresh_token_repo.revoke(stored, replaced_by_hash=hash_token(new_token))
        await self.refresh_token_repo.create(
            user_id=user.id,
            token_hash=hash_token(new_token),
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            ip_address=client_ip,
            user_agent=user_agent[:512] if user_agent else None,
        )

        access_token = create_access_token(
            user_id=user.id,
            organization_id=user.organization_id,
            role=user.primary_role or "sales_rep",
            permissions=resolve_permissions_for_user(user),
        )
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def forgot_password(self, email: str) -> str:
        user = await self.user_repo.get_by_email(email.lower())
        if not user:
            logger.info("Password reset requested for unknown email", extra={"email": email})
            return ""

        token = generate_secure_token()
        token_hash = hash_token(token)
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
        )

        await self.user_repo.update(
            user,
            password_reset_token=token_hash,
            password_reset_expires_at=expires_at,
        )

        logger.info("Password reset token generated", extra={"user_id": str(user.id)})
        await self.events.record_event(
            "PASSWORD_RESET_REQUESTED",
            organization_id=user.organization_id,
            actor_id=user.id,
            aggregate_type="user",
            aggregate_id=str(user.id),
            source="auth",
            payload={
                "user_id": str(user.id),
                "email": user.email,
                "expires_at": expires_at.isoformat(),
            },
        )
        await self.email_service.send_password_reset_email(user, token, expires_at)
        return token

    async def reset_password(self, payload: ResetPasswordRequest) -> None:
        token_hash = hash_token(payload.token)
        user = await self.user_repo.get_by_reset_token(token_hash)

        if not user:
            raise NotFoundException("Password reset token", payload.token[:8] + "...")

        if user.password_reset_expires_at and user.password_reset_expires_at < datetime.now(timezone.utc):
            raise TokenExpiredException()

        is_valid, reason = check_password_strength(payload.new_password)
        if not is_valid:
            raise WeakPasswordException(reason)

        await self.user_repo.update(
            user,
            hashed_password=hash_password(payload.new_password),
            password_reset_token=None,
            password_reset_expires_at=None,
        )
        # Revoke every session: the old password is now compromised.
        revoked = await self.refresh_token_repo.revoke_all_for_user(user.id)
        logger.info(
            "Password reset complete; revoked %d refresh token(s)",
            revoked,
            extra={"user_id": str(user.id)},
        )
        await self.events.record_event(
            "PASSWORD_RESET_COMPLETED",
            organization_id=user.organization_id,
            actor_id=user.id,
            aggregate_type="user",
            aggregate_id=str(user.id),
            source="auth",
            payload={"user_id": str(user.id), "email": user.email},
        )

    async def change_password(self, user: User, payload: ChangePasswordRequest) -> None:
        if not verify_password(payload.current_password, user.hashed_password):
            raise InvalidCredentialsException()

        is_valid, reason = check_password_strength(payload.new_password)
        if not is_valid:
            raise WeakPasswordException(reason)

        await self.user_repo.update(
            user,
            hashed_password=hash_password(payload.new_password),
        )
        # Revoke every session except the current one is not possible (we only
        # have the access token), so revoke all refresh tokens: the user
        # re-logs-in on next refresh, which is the safe default.
        revoked = await self.refresh_token_repo.revoke_all_for_user(user.id)
        logger.info(
            "Password changed; revoked %d refresh token(s)",
            revoked,
            extra={"user_id": str(user.id)},
        )
        await self.events.record_event(
            "PASSWORD_CHANGED",
            organization_id=user.organization_id,
            actor_id=user.id,
            aggregate_type="user",
            aggregate_id=str(user.id),
            source="auth",
            payload={"user_id": str(user.id), "email": user.email},
        )

    async def _build_tokens(
        self,
        user: User,
        client_ip: str = "",
        user_agent: str = "",
    ) -> TokenResponse:
        """Build access + refresh token pair from user entity and persist the
        refresh token server-side (hashed) for rotation and revocation."""
        permissions = resolve_permissions_for_user(user)
        role_name = user.primary_role or "sales_rep"

        access_token = create_access_token(
            user_id=user.id,
            organization_id=user.organization_id,
            role=role_name,
            permissions=permissions,
        )
        refresh_token = create_refresh_token(user_id=user.id)
        await self.refresh_token_repo.create(
            user_id=user.id,
            token_hash=hash_token(refresh_token),
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            ip_address=client_ip,
            user_agent=user_agent[:512] if user_agent else None,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def login_with_google(
        self,
        credential: str,
        client_ip: str = "",
        user_agent: str = "",
    ) -> TokenResponse:
        """Authenticate user using Google ID Token."""
        if not settings.GOOGLE_CLIENT_ID:
            raise BusinessRuleException("Google Sign-In is not configured on the server.")

        try:
            # Verify the ID token using google-auth library
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests

            idinfo = id_token.verify_oauth2_token(
                credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )

            email = idinfo.get("email")
            if not email:
                raise InvalidCredentialsException("Google token did not provide an email address.")
            
            email = email.lower()
            full_name = idinfo.get("name", "Google User").strip()
            avatar_url = idinfo.get("picture")

        except Exception as e:
            logger.error("Failed to verify Google token", exc_info=True)
            raise InvalidCredentialsException("Invalid Google token or verification failed.")

        user = await self.user_repo.get_by_email_any(email)

        if not user:
            # Auto-register user and create a default organization
            org_name = f"{full_name}'s Workspace"
            existing_org = await self.org_repo.get_by_name(org_name)
            
            if existing_org:
                import secrets
                org_name = f"{org_name} {secrets.token_hex(3)}"
            
            slug = _slugify(org_name)
            organization = await self.org_repo.create(name=org_name, slug=slug)

            admin_role = await self.role_repo.get_by_name("admin")
            
            import secrets
            random_pw = secrets.token_urlsafe(32)

            try:
                user = await self.user_repo.create(
                    email=email,
                    full_name=full_name,
                    hashed_password=hash_password(random_pw),
                    organization_id=organization.id,
                    avatar_url=avatar_url,
                    is_verified=True,
                    last_login_ip=client_ip,
                    last_login_at=datetime.now(timezone.utc),
                )
            except IntegrityError:
                await self.db.rollback()
                user = await self.user_repo.get_by_email_any(email)
                if not user:
                    raise

            if admin_role:
                await self.user_repo.assign_role(user, admin_role.id, user.id)
                user = await self.user_repo.get_by_id_with_roles(user.id)

            logger.info("New user registered via Google", extra={"user_id": str(user.id), "org": org_name})
            await self.events.record_event(
                "USER_REGISTERED",
                organization_id=organization.id,
                actor_id=user.id,
                aggregate_type="user",
                aggregate_id=str(user.id),
                source="auth_google",
                payload={
                    "user_id": str(user.id),
                    "organization_id": str(organization.id),
                    "email": user.email,
                    "organization_name": org_name,
                    "registered_via": "google",
                },
            )
        else:
            if not user.is_active:
                raise UnauthorizedException("Your account has been deactivated.")

            updates = {
                "last_login_at": datetime.now(timezone.utc),
                "last_login_ip": client_ip,
            }
            if avatar_url and not user.avatar_url:
                updates["avatar_url"] = avatar_url
            
            await self.user_repo.update(user, **updates)

            logger.info("User logged in via Google", extra={"user_id": str(user.id)})
            try:
                async with self.db.begin_nested():
                    await self.events.record_event(
                        "USER_LOGGED_IN",
                        organization_id=user.organization_id,
                        actor_id=user.id,
                        aggregate_type="user",
                        aggregate_id=str(user.id),
                        source="auth_google",
                        payload={"user_id": str(user.id), "email": user.email, "client_ip": client_ip, "logged_in_via": "google"},
                    )
            except Exception:
                logger.exception("Failed to record login event", extra={"user_id": str(user.id)})

        return await self._build_tokens(user, client_ip, user_agent)

