"""Application settings, loaded from environment variables (or a `.env` file).

Keeping configuration in one typed object means the rest of the code never reads
`os.environ` directly, and switching from a local SQLite file to a hosted database
in production only requires changing `DATABASE_URL`.
"""

import os
import tempfile
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ folder: .env and the local SQLite file live here no matter which
# directory the server is started from.
BACKEND_DIR = Path(__file__).resolve().parents[2]

# Vercel sets VERCEL=1 in every build and function environment.
ON_VERCEL = os.environ.get("VERCEL") == "1"

# Only for local development. Production refuses to start with this value.
DEV_SECRET_KEY = "dev-only-insecure-secret-change-me-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # On Vercel, settings come only from the dashboard's environment variables;
        # a stray local .env file must never override them.
        env_file=None if ON_VERCEL else BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "KINETIQ API"
    app_version: str = "1.0.0"
    # On Vercel's production deployment this defaults to "production".
    environment: str = "production" if os.environ.get("VERCEL_ENV") == "production" else "development"
    api_prefix: str = "/api"

    # Locally: backend/crm.db. On Vercel the code folder is read-only, so the
    # SQLite file lives in the writable temp folder (/tmp).
    database_url: str = (
        f"sqlite:///{(Path(tempfile.gettempdir()) / 'kinetiq.db').as_posix()}"
        if ON_VERCEL
        else "sqlite:///./crm.db"
    )
    # Create the demo account + sample leads on startup if missing. On by default
    # on Vercel, where the temporary SQLite file starts empty after a cold start.
    seed_demo_on_startup: bool = ON_VERCEL

    # Comma-separated so it is easy to set from a hosting dashboard.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    log_level: str = "INFO"

    # ---------- Auth ----------
    # Signs session tokens. MUST be overridden in production (checked at startup).
    secret_key: str = DEV_SECRET_KEY
    session_cookie_name: str = "crm_session"
    session_days: int = 7

    # ---------- Clive (AI assistant, powered by Groq) ----------
    # Read from the real environment or backend/.env. Never commit it.
    groq_api_key: str | None = None
    # Production Groq model with tool calling (see console.groq.com/docs/models).
    clive_model: str = "openai/gpt-oss-120b"
    # gpt-oss reasoning depth: low | medium | high. Medium chains lookups reliably.
    clive_reasoning_effort: str = "medium"

    @field_validator("secret_key", mode="before")
    @classmethod
    def blank_secret_uses_dev_default(cls, value):
        return value or DEV_SECRET_KEY

    @field_validator("groq_api_key", mode="before")
    @classmethod
    def blank_api_key_is_none(cls, value):
        return value or None

    @field_validator("database_url")
    @classmethod
    def anchor_relative_sqlite_path(cls, url: str) -> str:
        """Turn `sqlite:///./crm.db` into an absolute path inside backend/."""
        prefix = "sqlite:///"
        if url.startswith(prefix) and not url.startswith("sqlite:////"):
            path = url.removeprefix(prefix)
            if path and path != ":memory:" and not Path(path).is_absolute():
                return f"{prefix}{(BACKEND_DIR / path).resolve().as_posix()}"
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    def check_production_safety(self) -> None:
        """Refuse to start a production server with the public development secret."""
        if self.is_production and (self.secret_key == DEV_SECRET_KEY or len(self.secret_key) < 32):
            raise RuntimeError(
                "SECRET_KEY must be set to a random value of at least 32 characters in production."
            )


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (env is read only once per process)."""
    return Settings()


settings = get_settings()
