import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ExpenseSchema(BaseModel):
    id: int
    title: str
    description: str
    date: datetime
    category: int
    payment_method: int
    amount: float

    created_at: datetime
    updated_at: Optional[datetime]
    deleted_at: Optional[datetime]
    created_by: uuid.UUID
    updated_by: Optional[uuid.UUID]
    deleted_by: Optional[uuid.UUID]

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
