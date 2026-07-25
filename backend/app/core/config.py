from functools import lru_cache
from typing import List, Optional

import secrets
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
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

    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(64))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 15

    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE: int = 1800

    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_SERVICE_KEY: Optional[str] = None

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000"
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: str = "*"
    CORS_ALLOW_HEADERS: str = "*"

    ENABLE_RATE_LIMIT: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 10

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
    GOOGLE_WEBHOOK_SECRET: Optional[str] = None
    GMAIL_TOKEN_ENCRYPTION_KEY: Optional[str] = None
    GOOGLE_OAUTH_SCOPES: str = (
        "https://www.googleapis.com/auth/gmail.readonly,"
        "https://www.googleapis.com/auth/gmail.modify"
    )

    ENABLE_AI: bool = True
    AI_PROVIDER: str = "rule_based"
    MODEL_NAME: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    SCORING_PROVIDER: str = "rule_based"
    AI_TIMEOUT: int = 30

    WEBHOOK_MAX_ATTEMPTS: int = 5
    WEBHOOK_TIMEOUT_SECONDS: int = 10

    STORAGE_PROVIDER: str = "local"
    LOCAL_STORAGE_PATH: str = "uploads"
    MAX_UPLOAD_SIZE_BYTES: int = 10485760
    ALLOWED_UPLOAD_CONTENT_TYPES: str = "image/jpeg,image/png,image/webp,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    FIRST_SUPERUSER_EMAIL: str = "admin@kalnet-pulse.com"
    FIRST_SUPERUSER_PASSWORD: str = "Admin@123456"
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
                missing.append("SECRET_KEY")
            if not self.GMAIL_TOKEN_ENCRYPTION_KEY:
                missing.append("GMAIL_TOKEN_ENCRYPTION_KEY")
            if missing:
                raise ValueError(f"Missing required production secrets: {', '.join(missing)}")
        return self

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

