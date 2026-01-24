from sqlalchemy import Column, Boolean, Integer, String, Text, DateTime
from app.db.database import DbBase
from app.models.audit_mixin import AuditMixin


class Todo(DbBase, AuditMixin):
    __tablename__ = "todos"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    notes = Column(Text, default="", nullable=False)

    is_completed = Column(Boolean, default=False, nullable=False)
    is_starred = Column(Boolean, default=False, nullable=False)
    category = Column(Integer, default=0, nullable=False)  # e.g., 0: personal, 1: work, etc.
    repeat_type = Column(Integer, default=0, nullable=False)  # e.g., 0: none, 1: daily, 2: weekly, etc.
    duedate = Column(DateTime, nullable=True)
