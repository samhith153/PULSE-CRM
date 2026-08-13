"""Configuration for the PULSE AI Service."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from dotenv import find_dotenv, load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

_THIS_DIR = Path(__file__).resolve().parent.parent.parent  # ai-service/
_ROOT_DIR = _THIS_DIR.parent  # project root
_ENV_FILES = [_THIS_DIR / ".env", _ROOT_DIR / ".env"]

for _f in reversed(_ENV_FILES):
    if _f.exists():
        load_dotenv(_f, override=True)

if not any(_f.exists() for _f in _ENV_FILES):
    discovered = find_dotenv(usecwd=True)
    if discovered:
        load_dotenv(discovered, override=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[str(p) for p in _ENV_FILES] or None,
        env_file_encoding="utf-8-sig",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "PULSE AI Service"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "AI microservice: lead scoring, recommendations, and conversation intelligence"
    ENVIRONMENT: str = "development"

    API_V1_PREFIX: str = "/api/v1"
    DOCS_URL: str = "/docs"
    REDOC_URL: str = "/redoc"
    OPENAPI_URL: str = "/openapi.json"

    AI_SERVICE_PORT: int = 8001
    HOST: str = "0.0.0.0"

    CORS_ORIGINS: str = "*"
    CORS_ALLOW_CREDENTIALS: bool = False

    # ── LLM (Conversation AI) ─────────────────────────────────────────────
    LLM_API_KEY: Optional[str] = None
    SUMMARIZATION_API_KEY: Optional[str] = None  # alias read from global .env
    LLM_MODEL: str = "llama-3.3-70b-versatile"
    LLM_TEMPERATURE: float = 0.3
    LLM_MAX_TOKENS: int = 800
    LLM_TIMEOUT: int = 30
    MIN_CONFIDENCE_THRESHOLD: float = 0.3
    MAX_RETRIES: int = 1

    @property
    def effective_llm_key(self) -> Optional[str]:
        """Return the LLM API key, preferring LLM_API_KEY then SUMMARIZATION_API_KEY."""
        return self.LLM_API_KEY or self.SUMMARIZATION_API_KEY

    # ── Scoring defaults ──────────────────────────────────────────────────
    DEFAULT_SCORE: int = 50

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
