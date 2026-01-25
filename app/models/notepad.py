from sqlalchemy import Column, Integer, String, Text
from app.db.database import DbBase
from app.models.audit_mixin import AuditMixin


class Notepad(DbBase, AuditMixin):
    __tablename__ = "notepads"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    content = Column(Text, default="", nullable=False)
    category = Column(Integer, default=0, nullable=False)  # e.g., 0: personal, 1: work, etc.
    is_starred = Column(Integer, default=0, nullable=False)  # e.g., 0: no, 1: yes
    tags = Column(String, default="", nullable=False)  # Comma-separated tags
