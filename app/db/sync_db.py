from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import config

sync_db_url = config.database_url.replace("+aiosqlite", "").replace("+asyncpg", "+psycopg2")

# --- Sync DB engine setup for Celery like tasks ---
sync_engine = create_engine(
    url=sync_db_url, 
    echo=config.database_debug # echo SQL queries to console
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False, 
    autoflush=False
)

@contextmanager
def get_sync_db():
    session = SyncSessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

def dispose_sync_db_engine():
    sync_engine.dispose()
