from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse
from fastapi.exception_handlers import http_exception_handler

from app.core.config import config
from app.core.logger import get_logger
from app.db.async_db import create_db_tables, dispose_sync_db_engine
from app.core.users import auth_backend, fastapi_users
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.api import health, admin, documents, chatbot
from app.api import notepads, todos, expenses
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
    logger.info(f"Database URL: {config.database_url}")
    logger.info(f"Serving React build from: {REACT_BUILD_DIR}")
    await create_db_tables(rebuild=config.database_rebuild)
    yield
    
    # on shutdown
    await dispose_sync_db_engine()
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
app.include_router(fastapi_users.get_users_router(UserRead, UserUpdate), prefix="/users", tags=["user"])

# include api routers
app.include_router(admin.router, prefix=API_PREFIX, tags=["admin"])
app.include_router(documents.router, prefix=API_PREFIX, tags=["document"])
app.include_router(notepads.router, prefix=API_PREFIX, tags=["notepad"])
app.include_router(todos.router, prefix=API_PREFIX, tags=["todo"])
app.include_router(expenses.router, prefix=API_PREFIX, tags=["expense"])
app.include_router(chatbot.router, prefix=API_PREFIX, tags=["chatbot"])

# include jinja pages routers
app.include_router(jinja_pages.router, prefix='/pages', tags=["pages"])

# serve React frontend
@app.get("/{full_path:path}")
async def serve_react_frontend(request: Request, full_path: str):
    if "." in full_path: # file request 
        file_path = REACT_BUILD_DIR / full_path
        if file_path.exists():
            return FileResponse(file_path)

    # look for react home page
    react_home = REACT_BUILD_DIR / "index.html"
    if react_home.exists():
        return FileResponse(str(react_home))

    # look for jinja home page
    if request.url.path == "/":
        return await jinja_pages.home_page(request)

    # default response for all unknown path
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, 
        detail="Not found"
    )

# --- http exception handler ---
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """
    catches standard errors like 401 Unauthorized, 404 Not Found, 403 Forbidden
    """
    if exc.status_code == status.HTTP_401_UNAUTHORIZED:
        if request.url.path.startswith("/pages/"):
            return RedirectResponse(
                url=f"/pages/login?back_url={request.url.path}", 
                status_code=status.HTTP_302_FOUND,
            )
    return await http_exception_handler(request, exc)

# --- python exception handler ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catches any unhandled error (bug, db crash, division by zero).
    """
    # exc_info=True adds the full traceback/stack trace to the log
    logger.error(
        f"Exception occurred at {request.method} {request.url}, Error: {exc}",
        exc_info=False 
    )

    # return a response to the user
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc) if config.app_debug else "Internal Server Error"},
    )
