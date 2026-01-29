"""Application configuration settings."""
from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/designgen"

    # OpenAI
    openai_api_key: str = ""

    # Freepik (optional)
    freepik_api_key: str = ""

    # Storage paths
    storage_path: Path = Path("./storage")

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @property
    def templates_path(self) -> Path:
        return self.storage_path / "templates"

    @property
    def outputs_path(self) -> Path:
        return self.storage_path / "outputs"

    @property
    def thumbnails_path(self) -> Path:
        return self.storage_path / "thumbnails"

    def ensure_directories(self):
        """Create storage directories if they don't exist."""
        self.templates_path.mkdir(parents=True, exist_ok=True)
        self.outputs_path.mkdir(parents=True, exist_ok=True)
        self.thumbnails_path.mkdir(parents=True, exist_ok=True)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    settings = Settings()
    settings.ensure_directories()
    return settings
