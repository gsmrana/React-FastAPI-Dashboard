from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import DbBase


class Notepad(DbBase):
    __tablename__ = "notepads"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    content = Column(Text, default="")

    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())
    deleted_at = Column(DateTime, nullable=True)

    created_by = Column(UUID(as_uuid=True), ForeignKey("user.id"))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), nullable=True)

    # relationships
    user = relationship("User", back_populates="notepads")
