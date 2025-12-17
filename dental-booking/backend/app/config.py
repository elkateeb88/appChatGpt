"""
Configuration management for the dental booking agent.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Supabase
    supabase_url: str
    supabase_key: str

    # OpenAI
    openai_api_key: str

    # Application
    default_language: str = "ar"
    environment: str = "development"
    backend_url: Optional[str] = "http://localhost:8001"
    session_path: Optional[str] = "./sessions"
    phone_number_id: Optional[str] = "default"
    log_level: Optional[str] = "info"
    port: Optional[int] = 8001

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from environment


# Global settings instance
settings = Settings()
