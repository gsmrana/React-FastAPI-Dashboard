import sys
import asyncio
from pathlib import Path

# Add project root to Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import config
from app.core.logger import get_logger
from app.db.async_db import create_db_tables

logger = get_logger(Path(__file__).name)

async def create_database_tables():
    logger.info("--- Creating Database Tables ---")
    logger.info(f"Database URL: {config.database_url}")
    await create_db_tables(rebuild=True)
    logger.info("Database tables created succesffuly.")

if __name__ == "__main__":
    asyncio.run(create_database_tables())
