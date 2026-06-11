from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.datetime_format import DbDatetime


class DocumentSchema(BaseModel):
    id: int
    filename: str
    filepath: str
    filesize: Optional[int] = 0
    
    category: Optional[int] = 0
    is_starred: Optional[int] = 0
    tags: Optional[str] = ""
    description: Optional[str] = ""
    
    group_id: Optional[int] = None
    created_at: Optional[DbDatetime] = None
    modified_at: Optional[DbDatetime] = None

    model_config = ConfigDict(from_attributes=True)

class CreateDocumentSchema(BaseModel):
    filename: str
    category: Optional[int] = 0
    is_starred: Optional[int] = 0
    tags: Optional[str] = ""
    description: Optional[str] = ""
    group_id: Optional[int] = None

class UpdateDocumentSchema(BaseModel):
    filename: Optional[str] = None
    category: Optional[int] = None
    is_starred: Optional[int] = None
    tags: Optional[str] = None
    description: Optional[str] = None
    group_id: Optional[int] = None
