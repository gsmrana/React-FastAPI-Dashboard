from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import DbBase


class Expense(DbBase):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, default="")
    date = Column(DateTime, nullable=False)
    category = Column(Integer, nullable=False, index=True) # e.g., 0: food, 1: transport, etc.
    payment_method = Column(Integer, nullable=False, index=True) # e.g., 0: cash, 1: credit card, etc.
    amount = Column(Float, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())
    deleted_at = Column(DateTime, nullable=True)

    created_by = Column(UUID(as_uuid=True), ForeignKey("user.id"))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), nullable=True)

    # relationships
    user = relationship("User", back_populates="expenses")
