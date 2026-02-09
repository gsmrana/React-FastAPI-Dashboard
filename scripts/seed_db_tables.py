import sys
import asyncio
from pathlib import Path

# Add project root to Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import config
from app.core.logger import get_logger
from app.db.async_db import create_db_tables

logger = get_logger(Path(__file__).name)

async def create_database_tables(rebuild: bool=False):
    logger.info("--- Creating Database Tables ---")
    logger.info(f"Database URL: {config.database_url}")
    await create_db_tables(rebuild=rebuild)
    logger.info("Database tables created succesffuly.")

if __name__ == "__main__":
    # ensure psycopg driver compatibility on Windows
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    user_option = input("Do you want to include drop (clear data) and rebuilt all tables? (y/N): ")
    rebuild = True if user_option and user_option.lower() == "y" else False
    asyncio.run(create_database_tables(rebuild))
