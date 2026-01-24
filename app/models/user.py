from fastapi.params import Depends
from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import relationship
from app.db.database import DbBase, get_db


class User(SQLAlchemyBaseUserTableUUID, DbBase):
    # Relationship with documents table
    documents = relationship("Document", back_populates="user")

    # Relationship with notepads table
    notepads = relationship("Notepad", back_populates="user")

    # Relationship with todos table
    todos = relationship("Todo", back_populates="user")

    # Relationship with expenses table
    expenses = relationship("Expense", back_populates="user")

async def get_user_db(db: AsyncSession = Depends(get_db)):
    yield SQLAlchemyUserDatabase(db, User)
