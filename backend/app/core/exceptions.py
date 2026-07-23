"""
Domain Exception Hierarchy
All custom exceptions inherit from PulseCRMException.
HTTP layer maps these to proper status codes in exception_handlers.py.
"""
from typing import Any, Dict, Optional


class PulseCRMException(Exception):
    """Base exception for all application-level errors."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(message)


# ── 400 Bad Request ───────────────────────────────────────────────────────────

class ValidationException(PulseCRMException):
    """Raised when input data fails business-rule validation."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="VALIDATION_ERROR", details=details)


class DuplicateException(PulseCRMException):
    """Raised when a unique constraint would be violated."""
    def __init__(self, resource: str, field: str, value: str):
        super().__init__(
            message=f"{resource} with {field} '{value}' already exists.",
            code="DUPLICATE_RESOURCE",
            details={"resource": resource, "field": field, "value": value},
        )


class InvalidCredentialsException(PulseCRMException):
    """Raised on login failure."""
    def __init__(self):
        super().__init__(
            message="Invalid email or password.",
            code="INVALID_CREDENTIALS",
        )


class WeakPasswordException(PulseCRMException):
    """Raised when a password does not meet strength requirements."""
    def __init__(self, reason: str):
        super().__init__(
            message=f"Password is too weak: {reason}",
            code="WEAK_PASSWORD",
        )


# ── 401 Unauthorized ──────────────────────────────────────────────────────────

class UnauthorizedException(PulseCRMException):
    """Raised when a request lacks valid authentication."""
    def __init__(self, message: str = "Authentication required."):
        super().__init__(message, code="UNAUTHORIZED")


class TokenExpiredException(PulseCRMException):
    """Raised when a JWT token has expired."""
    def __init__(self):
        super().__init__(
            message="Token has expired. Please log in again.",
            code="TOKEN_EXPIRED",
        )


class InvalidTokenException(PulseCRMException):
    """Raised when a JWT token is malformed or has an invalid signature."""
    def __init__(self):
        super().__init__(
            message="Invalid or malformed token.",
            code="INVALID_TOKEN",
        )


# ── 403 Forbidden ─────────────────────────────────────────────────────────────

class ForbiddenException(PulseCRMException):
    """Raised when an authenticated user lacks the required permission."""
    def __init__(self, permission: Optional[str] = None):
        msg = (
            f"You do not have the '{permission}' permission to perform this action."
            if permission
            else "You do not have permission to perform this action."
        )
        super().__init__(msg, code="FORBIDDEN")


# ── 404 Not Found ─────────────────────────────────────────────────────────────

class NotFoundException(PulseCRMException):
    """Raised when a requested resource does not exist."""
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            message=f"{resource} with identifier '{identifier}' was not found.",
            code="NOT_FOUND",
            details={"resource": resource, "identifier": str(identifier)},
        )


# ── 409 Conflict ──────────────────────────────────────────────────────────────

class ConflictException(PulseCRMException):
    """Raised on state conflicts (e.g., deactivating an already inactive record)."""
    def __init__(self, message: str):
        super().__init__(message, code="CONFLICT")


# ── 422 Unprocessable Entity ──────────────────────────────────────────────────

class BusinessRuleException(PulseCRMException):
    """Raised when a business rule is violated."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="BUSINESS_RULE_VIOLATION", details=details)


# ── 429 Too Many Requests ─────────────────────────────────────────────────────

class RateLimitException(PulseCRMException):
    """Raised when the rate limit is exceeded."""
    def __init__(self):
        super().__init__(
            message="Too many requests. Please slow down.",
            code="RATE_LIMIT_EXCEEDED",
        )


# ── 500 Internal Server Error ─────────────────────────────────────────────────

class ServiceUnavailableException(PulseCRMException):
    """Raised when a downstream service (DB, email, etc.) is unreachable."""
    def __init__(self, service: str):
        super().__init__(
            message=f"Service '{service}' is currently unavailable.",
            code="SERVICE_UNAVAILABLE",
        )
