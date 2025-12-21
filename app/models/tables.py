import uuid
from datetime import datetime, timezone
from fastapi.params import Depends
from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import DbBase, get_db


class User(SQLAlchemyBaseUserTableUUID, DbBase):
    documents = relationship("Document", back_populates="user")

class Document(DbBase):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    status = Column(String, default="Uploaded")
    doc_name = Column(String, nullable=False)
    report_name = Column(String, default="")
    size_bytes = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    user = relationship("User", back_populates="documents")

async def get_user_db(db: AsyncSession = Depends(get_db)):
    yield SQLAlchemyUserDatabase(db, User)
