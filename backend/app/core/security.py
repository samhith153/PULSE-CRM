"""
Security Utilities
- JWT creation / verification
- Password hashing / verification
- Secure token generation (password-reset, email verify)
"""
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.exceptions import InvalidTokenException, TokenExpiredException
from app.core.logging import get_logger

logger = get_logger(__name__)

# ── Password hashing ──────────────────────────────────────────────────────────
# bcrypt with cost factor 12 (good balance of security vs. latency)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
)


def hash_password(plain_password: str) -> str:
    """Return bcrypt hash of the plain-text password."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if the plain-text password matches the stored hash."""
    return pwd_context.verify(plain_password, hashed_password)


def check_password_strength(password: str) -> tuple[bool, str]:
    """
    Enforce password policy:
      - Minimum 8 characters
      - At least one uppercase letter
      - At least one lowercase letter
      - At least one digit
      - At least one special character
    Returns (is_valid, reason).
    """
    if len(password) < 8:
        return False, "must be at least 8 characters long"
    if not any(c.isupper() for c in password):
        return False, "must contain at least one uppercase letter"
    if not any(c.islower() for c in password):
        return False, "must contain at least one lowercase letter"
    if not any(c.isdigit() for c in password):
        return False, "must contain at least one digit"
    special = set(r"""!@#$%^&*()_+-=[]{}|;':",.<>?/`~""")
    if not any(c in special for c in password):
        return False, "must contain at least one special character"
    return True, ""


# ── JWT ───────────────────────────────────────────────────────────────────────

def _build_payload(
    subject: str,
    token_type: str,
    expires_delta: timedelta,
    extra: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    payload: Dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": secrets.token_hex(16),  # JWT ID — unique per token
    }
    if extra:
        payload.update(extra)
    return payload


def create_access_token(
    user_id: UUID,
    organization_id: UUID,
    role: str,
    permissions: list[str],
) -> str:
    """Create a short-lived JWT access token."""
    payload = _build_payload(
        subject=str(user_id),
        token_type="access",
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        extra={
            "org": str(organization_id),
            "role": role,
            "permissions": permissions,
        },
    )
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: UUID) -> str:
    """Create a long-lived JWT refresh token."""
    payload = _build_payload(
        subject=str(user_id),
        token_type="refresh",
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT token.
    Raises TokenExpiredException or InvalidTokenException on failure.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError as exc:
        # Distinguish expired vs. invalid
        if "expired" in str(exc).lower():
            raise TokenExpiredException()
        logger.warning("JWT decode failure: %s", exc)
        raise InvalidTokenException()


def decode_access_token(token: str) -> Dict[str, Any]:
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise InvalidTokenException()
    return payload


def decode_refresh_token(token: str) -> Dict[str, Any]:
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise InvalidTokenException()
    return payload


# ── One-time secure tokens (password reset / email verification) ──────────────

def generate_secure_token() -> str:
    """Return a URL-safe 48-character secure random token."""
    return secrets.token_urlsafe(36)


def hash_token(token: str) -> str:
    """
    SHA-256 hash the token before storing in DB.
    Prevents exposure of reset tokens if the DB is compromised.
    """
    return hashlib.sha256(token.encode()).hexdigest()
