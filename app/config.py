"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""

    # App
    APP_NAME: str = "AI Lead Generation Platform"
    DEBUG: bool = True
    SECRET_KEY: str

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # OpenAI / LLM
    OPENAI_API_KEY: str
    DEFAULT_MODEL: str = "gpt-4o-mini"
    MAX_TOKENS: int = 2000
    TEMPERATURE: float = 0.3

    # Data Providers
    CLEARBIT_API_KEY: Optional[str] = None
    APOLLO_API_KEY: Optional[str] = None
    HUNTER_API_KEY: Optional[str] = None
    LUSHA_API_KEY: Optional[str] = None

    # Email Service Providers
    SENDGRID_API_KEY: Optional[str] = None
    AWS_SES_ACCESS_KEY: Optional[str] = None
    AWS_SES_SECRET_KEY: Optional[str] = None
    AWS_SES_REGION: str = "us-east-1"

    # CRM Integrations
    HUBSPOT_API_KEY: Optional[str] = None
    SALESFORCE_CLIENT_ID: Optional[str] = None
    SALESFORCE_CLIENT_SECRET: Optional[str] = None
    SALESFORCE_DOMAIN: Optional[str] = None

    # Email Configuration
    DEFAULT_FROM_EMAIL: str = "noreply@yourdomain.com"
    MAX_EMAILS_PER_DAY: int = 500
    EMAIL_SEND_DELAY_MIN: int = 30
    EMAIL_SEND_DELAY_MAX: int = 90

    # Lead Scoring
    MIN_QUALIFICATION_SCORE: int = 7
    MAX_ENRICHMENT_ATTEMPTS: int = 3

    # Security
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Monitoring
    ENABLE_PROMETHEUS: bool = True
    LOG_LEVEL: str = "INFO"

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
