from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.audit import AuditSchema
from app.schemas.datetime_format import DbDatetime

class ExpenseContent(BaseModel):
    id: int
    title: str
    description: str
    transaction_datetime: DbDatetime
    category: int
    tags: Optional[str]
    location: Optional[str]
    
    payment_method: int
    amount: float
    currency: str

class ExpenseSchema(AuditSchema, ExpenseContent):
    model_config = ConfigDict(from_attributes=True)

class UpdateExpenseSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    transaction_datetime: Optional[DbDatetime] = None
    category: Optional[int] = None
    tags: Optional[str] = None
    location: Optional[str] = None
    
    payment_method: Optional[int] = None
    amount: Optional[float] = None
    currency: Optional[str] = None

class CreateExpenseSchema(BaseModel):
    title: str
    description: Optional[str] = ""
    transaction_datetime: DbDatetime
    category: int
    tags: Optional[str] = ""
    location: Optional[str] = ""
    
    payment_method: int
    amount: float
    currency: Optional[str] = "BDT"
