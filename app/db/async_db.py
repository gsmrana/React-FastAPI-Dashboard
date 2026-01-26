from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import config
from app.core.logger import get_logger


logger = get_logger(__name__)

# --- Async DB engine setup for FastAPI ---
async_engine = create_async_engine(
    config.database_url,
    echo=config.database_debug, # echo SQL queries to console
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine, 
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

# dependency to get DB session - defined BEFORE model imports to avoid circular import
async def get_async_db():
    async with AsyncSessionLocal() as session:
        yield session

# need to use as base class for all Db models
class DbBase(DeclarativeBase):
    pass

# Import all DB models AFTER DbBase and get_async_db are defined to avoid circular import
# These must be imported for SQLAlchemy to discover them for create all tables
from app.models.user import User
from app.models.document import Document
from app.models.notepad import Notepad
from app.models.todo import Todo
from app.models.expense import Expense

async def create_db_tables(rebuild: bool=False):
    async with async_engine.begin() as conn:
        if rebuild:
            logger.warning(f"Dropping all database tables (schema changes will be applied, existing data will be lost)")
            await conn.run_sync(DbBase.metadata.drop_all)

        logger.warning(f"Syncing database tables (creating new tables, existing data will be preserved)")
        await conn.run_sync(DbBase.metadata.create_all)

async def dispose_sync_db_engine():
    logger.info(f"Disposing async database engine")
    await async_engine.dispose()
