from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.audit import AuditSchema


class NoteSchema(BaseModel, AuditSchema):
    id: int
    title: str
    content: str
    
    model_config = ConfigDict(from_attributes=True)

class UpdateNoteSchema(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class CreateNoteSchema(BaseModel):
    title: str
    content: str
