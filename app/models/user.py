from fastapi.params import Depends
from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.async_db import DbBase, get_async_db


class UserInfo():
    full_name = Column(String, default="", nullable=False)
    # group membership — use_alter=True breaks the circular FK with groups.owner_id
    group_id = Column(
        Integer,
        ForeignKey("groups.id", use_alter=True, name="fk_users_group_id"),
        nullable=True,
        index=True,
    )
    group_role = Column(String, nullable=True)  # "owner" | "member"

# add extended user info at last
class User(SQLAlchemyBaseUserTableUUID, UserInfo, DbBase):
    __tablename__ = "users"

async def get_user_db(db: AsyncSession = Depends(get_async_db)):
    yield SQLAlchemyUserDatabase(db, User)
