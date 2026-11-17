import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import yaml
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(BASE_DIR / ".env"), extra="ignore")

    PROJECT_NAME: str = "CivicSphere AI & ClimAct Twin API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://civic_admin:civic_secret_2026@localhost:5432/civicsphere_db"
    DUCKDB_MEMORY_LIMIT: str = "4GB"
    DUCKDB_THREADS: int = 4

    # Security
    SECRET_KEY: str = "civicsphere-hackathon-supersecret-jwt-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Paths (always resolve relative to BASE_DIR regardless of launch directory)
    COUNTRY_CONFIG_PATH: str = str(BASE_DIR / "config" / "countries" / "bangladesh.yaml")
    DATA_DIR: str = str(BASE_DIR / "data")
    POLICY_CORPUS_DIR: str = str(BASE_DIR / "docs" / "policy_corpus")

    @field_validator("DATA_DIR", "COUNTRY_CONFIG_PATH", "POLICY_CORPUS_DIR", mode="after")
    @classmethod
    def resolve_paths(cls, v: str) -> str:
        p = Path(v)
        if not p.is_absolute():
            return str((BASE_DIR / p).resolve())
        return str(p.resolve())

    # External APIs
    GEMINI_API_KEY: Optional[str] = None
    OPENAQ_API_KEY: Optional[str] = None


settings = Settings()


def load_country_config() -> Dict[str, Any]:
    config_path = Path(settings.COUNTRY_CONFIG_PATH)
    if not config_path.exists():
        config_path = BASE_DIR / "config" / "countries" / "bangladesh.yaml"
    if config_path.exists():
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    return {}


country_config = load_country_config()
