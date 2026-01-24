from datetime import datetime
from sqlalchemy import Column, Boolean, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import DbBase


class Todo(DbBase):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    notes = Column(Text, default="")

    is_completed = Column(Boolean, default=False)
    is_starred = Column(Boolean, default=False)
    category = Column(Integer, default=0)  # e.g., 0: personal, 1: work, etc.
    repeat_type = Column(Integer, default=0)  # e.g., 0: none, 1: daily, 2: weekly, etc.
    duedate = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())
    deleted_at = Column(DateTime, nullable=True)

    created_by = Column(UUID(as_uuid=True), ForeignKey("user.id"))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), nullable=True)

    # relationships
    user = relationship("User", back_populates="todos")
