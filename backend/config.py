import os
from typing import Optional, List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # ── AI Stack ──────────────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None
    GROQ_API_KEY: str
    NVIDIA_API_KEY: str
    SARVAM_API_KEY: str
    TINYFISH_API_KEY: str

    # ── Data Sources ──────────────────────────────────────
    GEM_API_KEY: Optional[str] = "FREE_GEM_KEY"
    GEM_API_BASE: str = "https://api.gem.gov.in/v2"

    # ── Database ──────────────────────────────────────────
    # Default to local postgres container if not specified
    DATABASE_URL: str = "postgresql+asyncpg://darpan_user:darpan_password@localhost:5432/darpan"
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Auth ──────────────────────────────────────────────
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SECRET_KEY: str = "7a0d4c82b9e6f1a8c3d7e5b2a0c4f8d9b1a5e7c2d9b6f3a0c4e7f8d1b9a2c3e5" # 64-char hex default

    # ── RTI Filing Account ────────────────────────────────
    RTI_EMAIL: Optional[str] = None
    RTI_PASSWORD: Optional[str] = None
    RTI_APPLICANT_NAME: str = "Darpan Vigilance Foundation"
    RTI_APPLICANT_ADDRESS: str = "12, Sansad Marg, New Delhi, 110001"
    RTI_PHONE: str = "9876543210"

    # ── Messaging ─────────────────────────────────────────
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    WHATSAPP_API_KEY: Optional[str] = None
    WHATSAPP_PHONE_ID: Optional[str] = None
    RESEND_API_KEY: Optional[str] = None

    # ── App ───────────────────────────────────────────────
    ADMIN_EMAIL: str = "admin@darpan.gov.in"
    ENVIRONMENT: str = "development" # development | production
    FRONTEND_URL: str = "http://localhost:3000"
    SENTRY_DSN: Optional[str] = None

    @property
    def async_database_url(self) -> str:
        """Helper to get an async database URL for SQLAlchemy async engine."""
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://")
        
        # Remove query parameters from asyncpg URL to prevent errors
        if "?" in url:
            base_url, query_str = url.split("?", 1)
            # Remove parameters like sslmode, ssl, channel_binding
            params = query_str.split("&")
            filtered_params = [p for p in params if not any(k in p for k in ["sslmode", "ssl", "channel_binding"])]
            if filtered_params:
                url = base_url + "?" + "&".join(filtered_params)
            else:
                url = base_url
        return url

    @property
    def sync_database_url(self) -> str:
        """Helper to get a sync database URL for Alembic migrations."""
        url = self.DATABASE_URL
        if url.startswith("postgresql+asyncpg://"):
            return url.replace("postgresql+asyncpg://", "postgresql://")
        return url

# Load settings singleton
config = Settings()
