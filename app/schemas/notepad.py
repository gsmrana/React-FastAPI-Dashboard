from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.audit import AuditSchema

class NoteContent(BaseModel):
    id: int
    title: str
    content: str
    category: int
    is_starred: int
    tags: Optional[str]

class NoteSchema(AuditSchema, NoteContent):
    model_config = ConfigDict(from_attributes=True)

class CreateNoteSchema(BaseModel):
    title: str
    content: str
    category: Optional[int] = 0
    is_starred: Optional[int] = 0
    tags: Optional[str] = ""

class UpdateNoteSchema(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[int] = None
    is_starred: Optional[int] = None
    tags: Optional[str] = None
