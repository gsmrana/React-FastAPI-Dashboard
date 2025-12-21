from pydantic import BaseModel
from typing import List, Optional


class NoteRequest(BaseModel):
    content: str

class NoteResponse(BaseModel):
    content: str
