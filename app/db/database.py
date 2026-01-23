from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import config
from app.core.logger import get_logger


logger = get_logger(__name__)

engine = create_async_engine(
    config.database_url,
    echo=config.database_debug, # echo SQL queries to console
    connect_args={"check_same_thread": False} # required for SQLite
)

async_session_maker = async_sessionmaker(
    bind=engine, 
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

# base class for all Db models (tables)
class DbBase(DeclarativeBase):
    pass

# dependency to get DB session - defined before model imports to avoid circular import
async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

# Import all DB models after DbBase and get_db are defined to avoid circular import
# These must be imported for SQLAlchemy to discover them for create all tables
from app.models.user import User
from app.models.document import Document
from app.models.notepad import Notepad

async def create_db_and_tables():
    async with engine.begin() as conn:
        if config.database_rebuild:
            logger.warning(f"Dropping all database tables (schema changes will be applied, existing data will be lost)")
            await conn.run_sync(DbBase.metadata.drop_all)

        logger.warning(f"Syncing database tables (creating new tables, existing data will be preserved)")
        await conn.run_sync(DbBase.metadata.create_all)

async def dispose_db_engine():
    logger.info(f"Disposing database engine")
    await engine.dispose()
