import sys
import asyncio
from pathlib import Path

# Add project root dir to sys path
root_dir = Path(__file__).parent.parent
sys.path.append(str(root_dir))

from app.db.database import async_session_maker, engine
from app.core.users import UserManager, get_user_manager
from app.models.user import User, get_user_db
from app.schemas.user import UserCreate


ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "Admin1234"

async def seed_admin():
    print("--- Seeding Admin User ---")    
    async with async_session_maker() as session:
        user_db = get_user_db(session) 
        user_manager = UserManager(user_db)
        
        user_create = UserCreate(
            email=ADMIN_EMAIL,
            password=ADMIN_PASSWORD,
            is_superuser=True,
            is_active=True,
            is_verified=True,
        )

        try:
            created_user = await user_manager.create(
                user_create, 
                safe=False, 
                request=None
            )
            print(f"✅ Admin user created: {created_user.email}")
        except Exception as e:
            if "REGISTER_USER_ALREADY_EXISTS" in str(e) or "UniqueViolation" in str(e):
                print(f"⚠️  User {ADMIN_EMAIL} already exists.")
            else:
                print(f"❌ Error creating admin: {e}")
                raise
        await engine.dispose()
        break

if __name__ == "__main__":
    asyncio.run(seed_admin())
