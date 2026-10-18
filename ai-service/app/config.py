import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    AI_SERVICE_SECRET: str = os.getenv("AI_SERVICE_SECRET", "nirantar_internal_ai_secret_token_789456")
    NODE_BACKEND_URL: str = os.getenv("NODE_BACKEND_URL", "http://localhost:5000")

settings = Settings()
