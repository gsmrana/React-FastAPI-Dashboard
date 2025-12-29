import os
from os import getenv
from dotenv import load_dotenv

APP_VERSION = "1.0.0"
DEFAULT_ENV = ".env"

ENV_PATH = getenv("FASTAPI_DASHBOARD_ENV_PATH", DEFAULT_ENV)
ENV_PATH = ENV_PATH if os.path.exists(ENV_PATH) else DEFAULT_ENV
if not load_dotenv(ENV_PATH):
    YELLOW_CLR, RESET_CMD = "\x1b[38;5;226m", "\x1b[0m"
    print(YELLOW_CLR + f'Failed to load .env file from path: "{ENV_PATH}"' + RESET_CMD)

class Config:
    # App Env variables
    ENV_PATH = ENV_PATH
    APP_VERSION = APP_VERSION        
    APP_NAME = getenv("APP_NAME", "FastAPI Dashboard")
    APP_PORT = getenv("APP_PORT", "8000")
    APP_DEBUG = getenv("APP_DEBUG", "True").lower() == "true"
    LOG_LEVEL = getenv("LOG_LEVEL", "INFO").upper()
    
    # Directory and Database
    UPLOAD_DIR = getenv("UPLOAD_DIR", "uploaded_files")
    DATABASE_URL = getenv("DATABASE_URL", "sqlite+aiosqlite:///./fastapi_app.db")       

    # Auth Configuration
    COOKIE_BASED_AUTH = getenv("COOKIE_BASED_AUTH", "True").lower() == "true"
    JWT_LIFETIME_SEC = getenv("JWT_LIFETIME_SEC", "86400") # 1 day
    JWT_SECRET_KEY = getenv("JWT_SECRET_KEY", "jwt-dev-secret")
    
    # OpenAI Compatible API
    OPENAI_ENDPOINT = getenv("OPENAI_ENDPOINT", "")
    OPENAI_API_KEY = getenv("OPENAI_API_KEY", "")
    OPENAI_LLM_MODEL = getenv("OPENAI_LLM_MODEL", "")

    # Anthropic API
    ANTHROPIC_ENDPOINT = getenv("ANTHROPIC_ENDPOINT", "")
    ANTHROPIC_LLM_MODEL = getenv("ANTHROPIC_LLM_MODEL", "")
    
    @staticmethod
    def to_json():
        json = {}
        for key, value in Config.__dict__.items():
            if key.startswith("__") or callable(value):
                continue
            if "key" in key.lower() and len(value) >= 8:
                masked = value[:4] + "*"*8 + value[-4:]
                value = f"[{len(value)}] {masked}"
            json[key] = value
        return json

config = Config()
os.makedirs(config.UPLOAD_DIR, exist_ok=True)
