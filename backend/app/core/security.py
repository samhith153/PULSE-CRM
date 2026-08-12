"""
Security Utilities
- JWT creation / verification
- Password hashing / verification via bcrypt directly
- Secure token generation (password-reset, email verify)
- Token revocation store (in-memory; survives per-process lifetime)
"""
import hashlib
import secrets
import threading
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from uuid import UUID

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import InvalidTokenException, TokenExpiredException
from app.core.logging import get_logger

logger = get_logger(__name__)

# ------------------------------------------------------------------
# Password hashing (bcrypt direct to avoid passlib backend conflicts)
# ------------------------------------------------------------------
BCRYPT_ROUNDS = 12


def hash_password(plain_password: str) -> str:
    """Return bcrypt hash of the plain-text password."""
    password = plain_password.encode("utf-8")
    hashed = bcrypt.hashpw(password, bcrypt.gensalt(rounds=BCRYPT_ROUNDS))
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if the plain-text password matches the stored hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


# ── Token Revocation Store ──────────────────────────────────────────────────
# In-memory set of revoked JWT JTIs.  Survives for the process lifetime.
# For multi-process deployments, swap this with Redis-backed storage.

class _TokenRevocationStore:
    """Thread-safe in-memory store for revoked token JTIs."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._revoked: set[str] = set()

    def revoke(self, jti: str) -> None:
        with self._lock:
            self._revoked.add(jti)

    def is_revoked(self, jti: str) -> bool:
        with self._lock:
            return jti in self._revoked

    def __len__(self) -> int:
        with self._lock:
            return len(self._revoked)


revoked_tokens = _TokenRevocationStore()


def revoke_token(token: str) -> bool:
    """Add a token's JTI to the revocation store. Returns True if successful."""
    try:
        payload = decode_token(token)
        jti = payload.get("jti")
        if jti:
            revoked_tokens.revoke(jti)
            logger.info("Token revoked", extra={"jti": jti})
            return True
    except Exception:
        logger.warning("Failed to revoke token")
    return False


def check_token_revoked(token: str) -> bool:
    """Return True if the token has been revoked."""
    try:
        payload = decode_token(token)
        jti = payload.get("jti")
        if jti and revoked_tokens.is_revoked(jti):
            return True
    except Exception:
        pass
    return False


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
    return jwt.encode(payload, settings.secret_key, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: UUID) -> str:
    """Create a long-lived JWT refresh token."""
    payload = _build_payload(
        subject=str(user_id),
        token_type="refresh",
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    return jwt.encode(payload, settings.secret_key, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT token.
    Raises TokenExpiredException or InvalidTokenException on failure.
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.ALGORITHM],
        )
        # Check revocation store
        jti = payload.get("jti")
        if jti and revoked_tokens.is_revoked(jti):
            raise InvalidTokenException("Token has been revoked")
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
