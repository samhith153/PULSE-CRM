"""
Authentication Service
All authentication business logic lives here - never in route handlers.
"""
import re
from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID

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
        self.email_service = EmailService(db)
        self.events = EventService(db)

    async def register(self, payload: RegisterRequest, client_ip: str = "") -> TokenResponse:
        """Create a new Organization + Admin user."""
        is_valid, reason = check_password_strength(payload.password)
        if not is_valid:
            raise WeakPasswordException(reason)

        existing = await self.user_repo.get_by_email(payload.email.lower())
        if existing:
            raise DuplicateException("User", "email", payload.email)

        org_name = payload.organization_name.strip()
        existing_org = await self.org_repo.get_by_name(org_name)
        if existing_org:
            raise DuplicateException("Organization", "name", org_name)

        slug = _slugify(org_name)
        organization = await self.org_repo.create(name=org_name, slug=slug)

        admin_role = await self.role_repo.get_by_name("admin")

        user = await self.user_repo.create(
            email=payload.email.lower(),
            full_name=payload.full_name.strip(),
            hashed_password=hash_password(payload.password),
            organization_id=organization.id,
            is_verified=True,
            is_superuser=True,
            last_login_ip=client_ip,
            last_login_at=datetime.now(timezone.utc),
        )

        if admin_role:
            await self.user_repo.assign_roles(user, [admin_role.id], user.id)
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
        return await self._build_tokens(user)

    async def login(self, payload: LoginRequest, client_ip: str = "") -> TokenResponse:
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
        await self.events.record_event(
            "USER_LOGGED_IN",
            organization_id=user.organization_id,
            actor_id=user.id,
            aggregate_type="user",
            aggregate_id=str(user.id),
            source="auth",
            payload={"user_id": str(user.id), "email": user.email, "client_ip": client_ip},
        )
        return await self._build_tokens(user)

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        payload = decode_refresh_token(refresh_token)
        user_id = UUID(payload["sub"])

        user = await self.user_repo.get_by_id_with_roles(user_id)
        if not user or not user.is_active:
            raise UnauthorizedException()

        return await self._build_tokens(user)

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
        logger.info("Password reset complete", extra={"user_id": str(user.id)})
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
        logger.info("Password changed", extra={"user_id": str(user.id)})
        await self.events.record_event(
            "PASSWORD_CHANGED",
            organization_id=user.organization_id,
            actor_id=user.id,
            aggregate_type="user",
            aggregate_id=str(user.id),
            source="auth",
            payload={"user_id": str(user.id), "email": user.email},
        )

    async def _build_tokens(self, user: User) -> TokenResponse:
        """Build access + refresh token pair from user entity."""
        permissions = resolve_permissions_for_user(user)
        role_name = user.primary_role or "sales_rep"

        access_token = create_access_token(
            user_id=user.id,
            organization_id=user.organization_id,
            role=role_name,
            permissions=permissions,
        )
        refresh_token = create_refresh_token(user_id=user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
