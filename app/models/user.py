from fastapi.params import Depends
from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import DbBase, get_db


class User(SQLAlchemyBaseUserTableUUID, DbBase):
    __tablename__ = "users"
    
async def get_user_db(db: AsyncSession = Depends(get_db)):
    yield SQLAlchemyUserDatabase(db, User)
