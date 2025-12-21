from pathlib import Path
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse

from app.core.config import config
from app.core.logger import get_logger
from app.db.database import create_db_and_tables, dispose_db_engine
from app.core.users import auth_backend, fastapi_users
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.api import health, document, chatbot, notepad
from app.pages import jinja_pages


API_PREFIX = "/api/v1"
REACT_BUILD_DIR = Path("app/static")
STATIC_ASSETS_DIR = REACT_BUILD_DIR / "assets"
logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"{config.APP_NAME} {config.APP_VERSION}")
    logger.info(f"APP_PORT: {config.APP_PORT}, DEBUG: {config.APP_DEBUG}, " + 
                f"LOG_LEVEL: {config.LOG_LEVEL}, ENV: {config.ENV_PATH}")
    logger.info(f"Serving React build from: {REACT_BUILD_DIR}")
    if not Path(config.DATABASE_URL.split("./")[1]).exists():
        logger.warning("Creating new Database and Tables...")
        await create_db_and_tables()
    yield
    await dispose_db_engine()
    logger.warning(f"{config.APP_NAME} app exited")

app = FastAPI(
    title=config.APP_NAME, 
    version=config.APP_VERSION, 
    lifespan=lifespan
)

app.mount(
    "/assets", 
    StaticFiles(directory=str(STATIC_ASSETS_DIR)), 
    name="assets"
)

app.add_middleware(
    CORSMiddleware, 
    allow_credentials=True,
    allow_origins=['*'], 
    allow_methods=['*'], 
    allow_headers=['*']
)

# include auth routers
app.include_router(fastapi_users.get_auth_router(auth_backend), prefix='/auth/jwt', tags=["auth"])
app.include_router(fastapi_users.get_register_router(UserRead, UserCreate), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_reset_password_router(), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_verify_router(UserRead), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_users_router(UserRead, UserUpdate), prefix="/users", tags=["users"])

# include api routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(document.router, prefix=API_PREFIX, tags=["document"])
app.include_router(chatbot.router, prefix=API_PREFIX, tags=["chatbot"])
app.include_router(notepad.router, prefix=API_PREFIX, tags=["notepad"])

# include jinja pages routers
app.include_router(jinja_pages.router, prefix='/pages', tags=["pages"])

# serve React frontend
@app.get("/{full_path:path}")
async def serve_react_frontend(full_path: str):
    if "." in full_path: # file request 
        file_path = REACT_BUILD_DIR / full_path
        if file_path.exists():
            return FileResponse(file_path)

    react_home = REACT_BUILD_DIR / "index.html"
    if react_home.exists():
        return FileResponse(str(react_home))

    return RedirectResponse(url="/pages/home", status_code=301)
