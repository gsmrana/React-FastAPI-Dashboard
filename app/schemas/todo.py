from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.audit import AuditSchema


class TodoSchema(BaseModel, AuditSchema):
    id: int
    title: str
    notes: str

    is_completed: bool
    is_starred: bool
    category: int
    repeat_type: int
    duedate: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class UpdateTodoSchema(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None

    is_completed: Optional[bool] = None
    is_starred: Optional[bool] = None
    category: Optional[int] = None
    repeat_type: Optional[int] = None
    duedate: Optional[datetime] = None

class CreateTodoSchema(BaseModel):
    title: str
    notes: Optional[str] = ""

    is_completed: Optional[bool] = False
    is_starred: Optional[bool] = False
    category: Optional[int] = 0
    repeat_type: Optional[int] = 0
    duedate: Optional[datetime] = None
