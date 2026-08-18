from functools import lru_cache
from pathlib import Path
from typing import List, Optional

import secrets
from dotenv import find_dotenv, load_dotenv
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env: check backend/.env first, then walk up to project root
_THIS_DIR = Path(__file__).resolve().parent          # app/core/
_BACKEND_DIR = _THIS_DIR.parent.parent               # backend/
_ROOT_DIR = _BACKEND_DIR.parent                      # PULSE-CRM/

def _find_env_file() -> list[str]:
    """Return list of .env paths that actually exist (pydantic-settings accepts a list)."""
    candidates = [
        _BACKEND_DIR / ".env",
        _ROOT_DIR / ".env",
    ]
    found = [str(p) for p in candidates if p.exists()]
    # Also try find_dotenv as a fallback
    if not found:
        discovered = find_dotenv(usecwd=True)
        if discovered:
            found = [discovered]
    return found or [".env"]

_env_files = _find_env_file()

# Load into os.environ immediately so sub-imports also see the values
for _f in reversed(_env_files):          # load root first, backend overrides
    load_dotenv(_f, override=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_env_files,
        env_file_encoding="utf-8-sig",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "KALNET PULSE CRM"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Enterprise Sales & Marketing CRM API"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    API_V1_PREFIX: str = "/api/v1"
    DOCS_URL: str = "/docs"
    REDOC_URL: str = "/redoc"
    OPENAPI_URL: str = "/openapi.json"

    # Empty by default so production validation can detect an unset key.
    # In development an ephemeral per-process key is generated lazily (see
    # ``secret_key``) so dev keeps working out of the box; production must
    # set SECRET_KEY explicitly and fails fast at startup if it doesn't.
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 15

    DATABASE_URL: str
    DIRECT_URL: Optional[str] = None
    DATABASE_POOL_SIZE: int = 25
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_POOL_TIMEOUT: int = 20
    DATABASE_POOL_RECYCLE: int = 300

    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,https://pulse-crm-eight-pearl.vercel.app,https://pulse-crm-backend.onrender.com"
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: str = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    CORS_ALLOW_HEADERS: str = "Authorization,Content-Type,Accept,Origin,X-Requested-With,X-Request-ID"

    # Security response headers
    SECURITY_HEADERS_ENABLED: bool = True
    HSTS_MAX_AGE: int = 31536000

    ENABLE_RATE_LIMIT: bool = True
    RATE_LIMIT_PER_MINUTE: int = 600
    RATE_LIMIT_BURST: int = 200

    # Comma-separated IPs of trusted reverse proxies.  X-Forwarded-For is only
    # honored when the direct peer is one of these; otherwise a spoofed header
    # could bypass rate limits by rotating the IP per request.
    TRUSTED_PROXY_IPS: str = "127.0.0.1,::1"

    # Auth rate limiting (stricter than global)
    AUTH_RATE_LIMIT_PER_MINUTE: int = 20
    AUTH_RATE_LIMIT_BURST: int = 10
    PASSWORD_RESET_RATE_LIMIT_PER_MINUTE: int = 5
    PASSWORD_RESET_RATE_LIMIT_BURST: int = 3

    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@kalnet-pulse.com"
    SMTP_FROM_NAME: str = "KALNET PULSE CRM"
    SMTP_TLS: bool = True
    FRONTEND_BASE_URL: str = "http://localhost:3000"

    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: Optional[str] = None
    GOOGLE_AUTH_REDIRECT_URI: Optional[str] = "http://localhost:8000/api/v1/auth/google/callback"
    GMAIL_TOKEN_ENCRYPTION_KEY: Optional[str] = None
    GOOGLE_PROJECT_ID: Optional[str] = None
    FRONTEND_URL: str = "http://localhost:3000"
    GOOGLE_PUBSUB_TOPIC: Optional[str] = None
    GOOGLE_OAUTH_SCOPES: str = (
        "https://www.googleapis.com/auth/gmail.readonly,"
        "https://www.googleapis.com/auth/gmail.modify,"
        "https://www.googleapis.com/auth/gmail.send"
    )

    BREVO_WEBHOOK_SECRET: Optional[str] = None

    ENABLE_AI: bool = True
    AI_PROVIDER: str = "rule_based"
    MODEL_NAME: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    SCORING_PROVIDER: str = "rule_based"
    AI_TIMEOUT: int = 60

    # PULSE AI microservice (separate deployment). The backend calls this
    # service over HTTP for lead scoring, recommendations, and summarization.
    AI_SERVICE_URL: str = "http://localhost:8001"
    AI_SERVICE_TIMEOUT: float = 30.0

    # Assistant (Groq free tier)
    ASSISTANT_API_KEY: Optional[str] = None
    ASSISTANT_MODEL: str = "openai/gpt-oss-120b"

    WEBHOOK_MAX_ATTEMPTS: int = 5
    WEBHOOK_TIMEOUT_SECONDS: int = 10

    STORAGE_PROVIDER: str = "local"
    LOCAL_STORAGE_PATH: str = "uploads"
    MAX_UPLOAD_SIZE_BYTES: int = 10485760
    ALLOWED_UPLOAD_CONTENT_TYPES: str = "image/jpeg,image/png,image/webp,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    # ── Recommendation Engine Weights ──────────────────────────────────────
    DEAL_VALUE_WEIGHT: float = 0.15
    EMAIL_OPEN_WEIGHT: float = 0.15
    MEETING_WEIGHT: float = 0.20
    REP_WORKLOAD_WEIGHT: float = 0.10
    CONTACT_TIME_WEIGHT: float = 0.10

    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    FIRST_SUPERUSER_EMAIL: str = "admin@kalnet-pulse.com"
    FIRST_SUPERUSER_PASSWORD: str = Field(
        default="Admin@123456",
        description="Override via env FIRST_SUPERUSER_PASSWORD"
    )
    FIRST_SUPERUSER_FULL_NAME: str = "System Administrator"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def _coerce_debug(cls, value):
        if isinstance(value, bool):
            return value
        if value is None:
            return False
        text = str(value).strip().lower()
        return text in {"1", "true", "yes", "y", "on"}

    @model_validator(mode="after")
    def _validate_production_secrets(self):
        if self.is_production:
            missing = []
            if not self.SECRET_KEY:
                missing.append("SECRET_KEY (must be set explicitly in production; never use the dev ephemeral key)")
            if not self.GMAIL_TOKEN_ENCRYPTION_KEY:
                missing.append("GMAIL_TOKEN_ENCRYPTION_KEY (required in production; never fall back to SECRET_KEY)")
            if missing:
                raise ValueError(f"Missing required production secrets: {', '.join(missing)}")
            # Reject wildcard CORS in production
            if self.CORS_ALLOW_METHODS == "*":
                raise ValueError("CORS_ALLOW_METHODS must not be '*' in production")
            if self.CORS_ALLOW_HEADERS == "*":
                raise ValueError("CORS_ALLOW_HEADERS must not be '*' in production")
        return self

    _dev_secret_key: Optional[str] = None

    @property
    def secret_key(self) -> str:
        """Stable signing key.

        Returns SECRET_KEY when configured; otherwise (development only) an
        ephemeral random key for this process.  Production is guaranteed to
        have SECRET_KEY set by ``_validate_production_secrets``.
        """
        if self.SECRET_KEY:
            return self.SECRET_KEY
        if self._dev_secret_key is None:
            self._dev_secret_key = secrets.token_urlsafe(64)
        return self._dev_secret_key

    @property
    def trusted_proxy_ips_list(self) -> List[str]:
        return [ip.strip() for ip in self.TRUSTED_PROXY_IPS.split(",") if ip.strip()]

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def cors_methods_list(self) -> List[str]:
        return ["*"] if self.CORS_ALLOW_METHODS == "*" else [
            m.strip() for m in self.CORS_ALLOW_METHODS.split(",") if m.strip()
        ]

    @property
    def cors_headers_list(self) -> List[str]:
        return ["*"] if self.CORS_ALLOW_HEADERS == "*" else [
            h.strip() for h in self.CORS_ALLOW_HEADERS.split(",") if h.strip()
        ]

    @property
    def allowed_upload_content_types_list(self) -> List[str]:
        return [item.strip() for item in self.ALLOWED_UPLOAD_CONTENT_TYPES.split(",") if item.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

