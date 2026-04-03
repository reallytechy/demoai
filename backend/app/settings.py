"""
Application settings from environment (Render, Docker, or backend/.env).
Env file path is fixed to the backend root so `uvicorn` works from any CWD.
"""
from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Env: CORS_ALLOWED_ORIGINS — comma-separated, no wildcards (required; set in backend/.env or host env).
    cors_allowed_origins: str = Field(
        ...,
        description="Comma-separated browser origins allowed to call this API.",
    )

    # Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — optional until JWT is enforced.
    supabase_url: str = Field(default="", description="Supabase project URL.")
    supabase_service_role_key: str = Field(
        default="",
        description="Supabase service role key (server only).",
    )

    @field_validator("supabase_url", mode="before")
    @classmethod
    def normalize_supabase_url(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip().rstrip("/")
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
