from pydantic import BaseModel
from typing import List, Optional


class ChatRequest(BaseModel):
    content: str

class ChatResponse(BaseModel):
    content: str
