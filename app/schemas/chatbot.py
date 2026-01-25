from pydantic import BaseModel
from typing import Optional


class LLM_Info(BaseModel):
    provider: str
    model_name: str
    temperature: Optional[float] = None

class ChatRequest(BaseModel):
    prompt: str
    model_name: Optional[str] = None

class ChatResponse(BaseModel):
    content: str
    llm_info: Optional[LLM_Info] = None
