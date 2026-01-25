from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.audit import AuditSchema
from app.schemas.datetime_format import DbDatetime


class TodoContent(BaseModel):
    id: int
    title: str
    notes: str

    is_starred: bool
    is_completed: bool
    category: int
    priority: int
    tags: Optional[str]
    
    repeat_type: int
    deadline_at: Optional[DbDatetime]
    remind_at: Optional[DbDatetime]

class TodoSchema(AuditSchema, TodoContent):
    model_config = ConfigDict(from_attributes=True)

class CreateTodoSchema(BaseModel):
    title: str
    notes: Optional[str] = ""

    is_completed: Optional[bool] = False
    is_starred: Optional[bool] = False
    category: Optional[int] = 0
    priority: Optional[int] = 0
    tags: Optional[str] = ""

    repeat_type: Optional[int] = 0
    deadline_at: Optional[DbDatetime] = None
    remind_at: Optional[DbDatetime] = None

class UpdateTodoSchema(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None

    is_completed: Optional[bool] = None
    is_starred: Optional[bool] = None
    category: Optional[int] = None
    priority: Optional[int] = None
    tags: Optional[str] = None  
    
    repeat_type: Optional[int] = None
    deadline_at: Optional[DbDatetime] = None
    remind_at: Optional[DbDatetime] = None
