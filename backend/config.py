from pathlib import Path
from pydantic_settings import BaseSettings

_ENV_FILE = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    # Anthropic (LLM chat, audit, planning)
    anthropic_api_key: str = ""

    # OpenAI (embeddings only)
    openai_api_key: str = ""

    # n8n
    n8n_base_url: str = "http://n8n:5678"
    n8n_api_key: str = ""

    # Qdrant
    qdrant_url: str = "http://qdrant:6333"
    qdrant_collection: str = "company_docs"

    # Postgres
    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_db: str = "meridian_clients"
    postgres_user: str = "meridian"
    postgres_password: str = "meridian_demo_2026"

    # App
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    class Config:
        env_file = str(_ENV_FILE)


settings = Settings()
