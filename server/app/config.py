import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BACKEND_DIR = Path(__file__).parent.resolve()


@dataclass(frozen=True)
class Settings:
	database_url: str = os.getenv("DATABASE_URL")
	groq_api_key: str = os.getenv("GROQ_API_KEY", "")
	groq_model: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
	cors_origins: list[str] = field(
		default_factory=lambda: [
			origin.strip()
			for origin in os.getenv("CORS_ORIGINS", "").split(",")
			if origin.strip()
		]
	)

settings = Settings()
