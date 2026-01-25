import sys
import asyncio
from pathlib import Path
from fastapi_users import exceptions
from fastapi_users.db import SQLAlchemyUserDatabase

# Add project root to Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import config
from app.core.logger import get_logger
from app.db.async_db import AsyncSessionLocal
from app.core.users import UserManager
from app.models.user import User
from app.schemas.user import UserCreate

logger = get_logger(Path(__file__).name)

ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "Admin1234"

async def create_superuser(email: str, password: str):
    logger.info("--- Seeding Admin User ---")
    logger.info(f"Database URL: {config.database_url}") 
    async with AsyncSessionLocal() as session:
        user_db = SQLAlchemyUserDatabase(session, User)
        user_manager = UserManager(user_db)
        user_create = UserCreate(
            email=email,
            password=password,
            is_superuser=True,
            is_active=True,
            is_verified=True,
        )

        try:
            logger.info(f"Creating superuser with email: {user_create.email}")
            created_user = await user_manager.create(user_create, safe=False, request=None)
            logger.warning(f"Superuser created successfully -> email: {created_user.email}, id: {created_user.id}")
        except exceptions.UserAlreadyExists:
            logger.warning(f"User already exists with email: {user_create.email}")
        except Exception as e:
            logger.error(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(create_superuser(ADMIN_EMAIL, ADMIN_PASSWORD))
