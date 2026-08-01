"""
Shared Validation Utilities
Used by Pydantic schemas AND service layer for business-rule validation.
"""
import re
from typing import Optional


# ── Phone ─────────────────────────────────────────────────────────────────────

_PHONE_STRIP = re.compile(r"[\s\-\(\)\+\.]")


def validate_phone(value: Optional[str]) -> Optional[str]:
    """
    Strip formatting chars and validate that the result is 7-15 digits.
    Returns the cleaned number or raises ValueError.
    """
    if value is None:
        return None
    cleaned = _PHONE_STRIP.sub("", value)
    if not cleaned.isdigit():
        raise ValueError("Phone number must contain only digits (spaces, dashes, parentheses allowed).")
    if not (7 <= len(cleaned) <= 15):
        raise ValueError("Phone number must be between 7 and 15 digits.")
    return value  # Return original format, not stripped


# ── URL ───────────────────────────────────────────────────────────────────────

_URL_RE = re.compile(r"^https?://[^\s/$.?#].[^\s]*$", re.IGNORECASE)


def validate_url(value: Optional[str]) -> Optional[str]:
    """
    Validates that the URL starts with http:// or https://.
    """
    if value is None:
        return None
    if not _URL_RE.match(value):
        raise ValueError("URL must start with http:// or https:// and be a valid web address.")
    return value


# ── Email ─────────────────────────────────────────────────────────────────────

_EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")


def validate_email_format(value: str) -> str:
    """Lightweight email format check (Pydantic's EmailStr is more thorough)."""
    if not _EMAIL_RE.match(value):
        raise ValueError(f"'{value}' is not a valid email address.")
    return value.lower().strip()


# ── Slug ──────────────────────────────────────────────────────────────────────

def slugify(value: str, max_length: int = 100) -> str:
    """Convert a name to a URL-friendly slug."""
    slug = value.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug[:max_length]
