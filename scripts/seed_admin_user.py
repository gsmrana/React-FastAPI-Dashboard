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
from app.schemas.user import UserCreate, UserUpdate

logger = get_logger(Path(__file__).name)

async def get_user_by_email(user_manager: UserManager, email: str):
    try:
        return await user_manager.get_by_email(email)
    except exceptions.UserNotExists:
        return None
    except Exception as e:
        logger.error(f"Exception: {e}")

async def create_superuser(email: str, password: str):
    logger.info("--- Seeding Admin User ---")
    logger.info(f"Database URL: {config.database_url}") 
    
    async with AsyncSessionLocal() as session:
        user_db = SQLAlchemyUserDatabase(session, User)
        user_manager = UserManager(user_db)

        try:
            user = await get_user_by_email(user_manager, email)
            if not user:
                user_create = UserCreate(
                    email=email,
                    password=password,
                    is_active=True,
                    is_superuser=True,
                    is_verified=True,
                )            
                logger.info(f"Creating superuser with email: {email}")
                created_user = await user_manager.create(user_create, safe=False)
                logger.warning(f"New user created with superuser privilage, " +
                                f"email: {created_user.email}, id: {created_user.id}")
            else:
                logger.warning(f"User already exists with email: {email}")
                user_option = input("Do you want to allow admin privilage to this user? (Y/n): ")
                if user_option and user_option.lower() != "y":
                    return
                user_update = UserUpdate(
                    is_active=True,
                    is_superuser=True,
                    is_verified=True,
                )
                updated_user = await user_manager.update(user_update, user, safe=False)
                logger.warning(f"User updated with superuser privilage, " +
                                f"email: {updated_user.email}, id: {updated_user.id}")
        except Exception as e:
            logger.error(f"Exception: {e}")

if __name__ == "__main__":
    # ensure psycopg driver compatibility on Windows
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    email = input("Enter email: ")
    password = input("Enter password: ")
    asyncio.run(create_superuser(email, password))
