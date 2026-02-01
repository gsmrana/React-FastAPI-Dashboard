from sqlalchemy import Column, Boolean, Integer, String, Text, DateTime
from app.db.async_db import DbBase
from app.models.audit_mixin import AuditMixin


class Todo(DbBase, AuditMixin):
    __tablename__ = "todos"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, nullable=False)
    notes = Column(Text, default="", nullable=False)

    is_starred = Column(Boolean, default=False, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    category = Column(Integer, default=0, nullable=False)  # e.g., 0: personal, 1: work, etc.
    priority = Column(Integer, default=0, nullable=False)  # e.g., 0: low, 1: medium, 2: high
    tags = Column(String, default="", nullable=False)  # Comma-separated tags
    
    repeat_type = Column(Integer, default=0, nullable=False)  # e.g., 0: none, 1: daily, 2: weekly, etc.
    deadline_at = Column(DateTime(timezone=True), nullable=True)
    remind_at = Column(DateTime(timezone=True), nullable=True)
