import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class NoteSchema(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    updated_at: Optional[datetime]
    deleted_at: Optional[datetime]
    created_by: uuid.UUID
    updated_by: Optional[uuid.UUID]
    deleted_by: Optional[uuid.UUID]

    model_config = ConfigDict(from_attributes=True)

class UpdateNoteSchema(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class CreateNoteSchema(UpdateNoteSchema):
    pass
