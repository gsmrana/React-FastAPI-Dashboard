from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    llm_id: int
    message: str
    session_id: str = ""
    system_prompt: Optional[str] = "You are a helpful and concise AI assistant."

class ChatResponse(BaseModel):
    llm_id: int
    response: str
    session_id: str = ""
    message_count: int = 0

class HistoryResponse(BaseModel):
    session_id: str
    messages: list
    message_count: int

class SessionResponse(BaseModel):
    session_id: str
    message_count: int
