import os
from typing import List, Any, Dict
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


APP_VERSION = "1.0.0"
DEFAULT_ENV = ".env"

ENV_PATH = os.getenv("FASTAPI_DASHBOARD_ENV_PATH", DEFAULT_ENV)
ENV_PATH = ENV_PATH if os.path.exists(ENV_PATH) else DEFAULT_ENV
if not os.path.exists(ENV_PATH):
    YELLOW_CLR, RESET_CMD = "\x1b[38;5;226m", "\x1b[0m"
    print(YELLOW_CLR + f'Failed to load .env file from path: "{ENV_PATH}"' + RESET_CMD)

class Config(BaseSettings):
    # pydantic model config
    model_config = SettingsConfigDict(
        env_file=ENV_PATH,            # Read from .env if present
        env_file_encoding="utf-8",
        case_sensitive=False,         # Allows APP_PORT or app_port
        extra="ignore"                # Ignores extra vars
    )
    
    # app configs
    app_name: str = "FastAPI Dashboard"
    APP_VERSION: str = APP_VERSION
    app_port: int = 8000
    ENV_PATH: str = ENV_PATH
    app_debug: bool = False
    log_level: str = "INFO"
    allowed_origins: List[str] = ["*"]
    
    # dir and db and configs
    upload_dir: str = "uploaded_files"
    database_url: str = "sqlite+aiosqlite:///./fastapi_app.db"

    # auth configs
    cookie_based_auth: bool = True
    jwt_lifetime_sec: int = 86400 # 1 day
    jwt_secret_key: str = "jwt-dev-secret"
    
    # OpenAI compatible API
    openai_endpoint: str
    openai_api_key: str
    openai_llm_model: str

    # anthropic API
    anthropic_endpoint: str
    anthropic_llm_model: str 

    @classmethod
    @model_validator(mode='before')
    def strip_quotes(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        for key, value in values.items():
            if isinstance(value, str):
                values[key] = value.strip('"').strip("'")
        return values

config = Config()
os.makedirs(config.upload_dir, exist_ok=True)
