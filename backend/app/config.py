"""Centralized configuration via pydantic-settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # LLM Provider
    LLM_PROVIDER: str = "anthropic"
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL_ID: str = "claude-sonnet-4-5-20250929"
    BEDROCK_MODEL_ID: str = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"

    # RAG Engine
    RAG_ENGINE: str = "bm25"  # "bm25" or "chroma"

    # Agent tuning
    SQL_MAX_RETRIES: int = 1

    # Demo mode
    DEMO_MODE: bool = True

    # AWS (all optional)
    ENABLE_AWS: bool = False
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = ""
    DYNAMODB_TABLE: str = "bcbs-conversations"

    # Paths
    DATA_DIR: str = "../data"

    model_config = {
        "env_file": (".env", "../.env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
