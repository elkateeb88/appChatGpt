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

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
