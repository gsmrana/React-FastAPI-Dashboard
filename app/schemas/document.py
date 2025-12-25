from pydantic import BaseModel
from typing import List, Optional

class DocRequest(BaseModel):
    id: str
    filename: str

class DocResponse(BaseModel):
    id: str
    filename: str
    filesize: Optional[str] = None
    created_at: Optional[str] = None

class UpdateRequest(BaseModel):
    id: str
    filename: str
    new_filename: str
