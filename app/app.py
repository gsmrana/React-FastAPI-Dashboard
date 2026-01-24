from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.exception_handlers import http_exception_handler

from app.core.config import config
from app.core.logger import get_logger
from app.db.database import create_db_and_tables, dispose_db_engine
from app.core.users import auth_backend, fastapi_users
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.api import admin, health, document, notepad
from app.api import todo, expense, chatbot
from app.pages import jinja_pages


API_PREFIX = "/api/v1"
REACT_BUILD_DIR = Path("app/static")
STATIC_ASSETS_DIR = REACT_BUILD_DIR / "assets"
logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # on startup
    logger.info(f"{config.app_name} {config.APP_VERSION}")
    logger.info(f"APP_PORT: {config.app_port}, " +
                f"DEBUG: {config.app_debug}, " + 
                f"LOG_LEVEL: {config.log_level}, " +
                f"ENV_FILE: {config.ENV_FILE}")
    logger.info(f"Serving React build from: {REACT_BUILD_DIR}")
    await create_db_and_tables()
    yield
    
    # on shutdown
    await dispose_db_engine()
    logger.warning(f"{config.app_name} app exited")

app = FastAPI(
    title=config.app_name, 
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
    allow_origins=config.allowed_origins, 
    allow_methods=['*'], 
    allow_headers=['*']
)

# include health routers
app.include_router(health.router, prefix="/health", tags=["health"])

# include auth and users routers
app.include_router(fastapi_users.get_auth_router(auth_backend), prefix='/auth/jwt', tags=["auth"])
app.include_router(fastapi_users.get_register_router(UserRead, UserCreate), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_reset_password_router(), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_verify_router(UserRead), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_users_router(UserRead, UserUpdate), prefix="/users", tags=["users"])

# include api routers
app.include_router(admin.router, prefix=API_PREFIX, tags=["admin"])
app.include_router(document.router, prefix=API_PREFIX, tags=["document"])
app.include_router(notepad.router, prefix=API_PREFIX, tags=["notepad"])
app.include_router(todo.router, prefix=API_PREFIX, tags=["todo"])
app.include_router(expense.router, prefix=API_PREFIX, tags=["expense"])
app.include_router(chatbot.router, prefix=API_PREFIX, tags=["chatbot"])

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

    return RedirectResponse(
        url="/pages/home", 
        status_code=status.HTTP_301_MOVED_PERMANENTLY,
    )

# custom HTTP exception handler
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    if exc.status_code == status.HTTP_401_UNAUTHORIZED:
        if request.url.path.startswith("/pages/"):
            return RedirectResponse(
                url=f"/pages/login?back_url={request.url.path}", 
                status_code=status.HTTP_302_FOUND,
            )
    return await http_exception_handler(request, exc)
