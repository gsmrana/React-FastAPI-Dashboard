from sqlalchemy import Column, Boolean, Integer, String
from app.db.async_db import DbBase
from app.models.audit_mixin import AuditMixin


class Service(DbBase, AuditMixin):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    url = Column(String, default="", nullable=False)
    username = Column(String, default="", nullable=False)
    password = Column(String, default="", nullable=False)
    notes = Column(String, default="", nullable=False)
    
    is_starred = Column(Boolean, default=False, nullable=False)
    category = Column(Integer, default=0, nullable=False)
    tags = Column(String, default="", nullable=False)  # Comma-separated tags
