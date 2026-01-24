from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.audit import AuditSchema


class ExpenseSchema(BaseModel, AuditSchema):
    id: int
    title: str
    description: str
    date: datetime
    category: int
    payment_method: int
    amount: float

    model_config = ConfigDict(from_attributes=True)

class UpdateExpenseSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    category: Optional[int] = None
    payment_method: Optional[int] = None
    amount: Optional[float] = None

class CreateExpenseSchema(BaseModel):
    title: str
    description: Optional[str] = ""
    date: datetime
    category: int
    payment_method: int
    amount: float
