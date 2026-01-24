from sqlalchemy import Column, Integer, Float, String, Text, DateTime
from app.db.database import DbBase
from app.models.audit_mixin import AuditMixin


class Expense(DbBase, AuditMixin):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, default="", nullable=False)
    date = Column(DateTime, nullable=False)
    category = Column(Integer, nullable=False, index=True) # e.g., 0: food, 1: transport, etc.
    payment_method = Column(Integer, nullable=False, index=True) # e.g., 0: cash, 1: credit card, etc.
    amount = Column(Float, nullable=False)

