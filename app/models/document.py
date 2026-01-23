from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import DbBase


class Document(DbBase):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    filepath = Column(String)
    size_bytes = Column(Integer)
    tags = Column(String, default="Uploaded")

    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())
    deleted_at = Column(DateTime, nullable=True)

    created_by = Column(UUID(as_uuid=True), ForeignKey("user.id"))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), nullable=True)

    # relationships
    user = relationship("User", back_populates="documents")
