from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import config


engine = create_async_engine(
    config.database_url,
    echo=False, # enable to SQL queries in console
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

async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(DbBase.metadata.create_all)

async def dispose_db_engine():
    await engine.dispose()

# dependency to get DB session
async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
