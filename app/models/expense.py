from sqlalchemy import Column, Integer, Float, String, Text, DateTime
from app.db.async_db import DbBase
from app.models.audit_mixin import AuditMixin


class Expense(DbBase, AuditMixin):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, nullable=False)
    description = Column(Text, default="", nullable=False)
    transaction_datetime = Column(DateTime(timezone=True), nullable=False)
    category = Column(Integer, nullable=False) # e.g., 0: food, 1: transport, etc.
    tags = Column(String, default="", nullable=False)  # Comma-separated tags
    location = Column(String, default="", nullable=False)
    
    payment_method = Column(Integer, nullable=False) # e.g., 0: cash, 1: credit card, etc.
    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default="BDT")  # ISO currency code
