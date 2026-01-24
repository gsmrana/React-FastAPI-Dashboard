from sqlalchemy import Column, Integer, String
from app.db.database import DbBase
from app.models.audit_mixin import AuditMixin


class Document(DbBase, AuditMixin):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    filepath = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    tags = Column(String, default="Uploaded", nullable=False)
