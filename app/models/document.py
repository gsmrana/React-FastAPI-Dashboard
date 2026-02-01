from sqlalchemy import Column, Integer, String
from app.db.async_db import DbBase
from app.models.audit_mixin import AuditMixin


class Document(DbBase, AuditMixin):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    filesize = Column(Integer, nullable=False)
    
    category = Column(Integer, default=0, nullable=False)  # e.g., 0: personal, 1: work, etc.
    is_starred = Column(Integer, default=0, nullable=False)  # e.g., 0: no, 1: yes
    tags = Column(String, default="", nullable=False)  # Comma-separated tags
    description = Column(String, default="", nullable=False)
