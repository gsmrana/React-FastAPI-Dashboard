from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.audit import AuditSchema


class LlmContent(BaseModel):
    id: int
    provider: int
    category: int
    is_active: bool
    
    title: str
    model_name: str
    api_endpoint: str
    api_key: str
    temperature : float
    notes: str

    is_starred: bool
    tags: Optional[str]

class LlmSchema(AuditSchema, LlmContent):
    model_config = ConfigDict(from_attributes=True)

class CreateLlmSchema(BaseModel):
    provider: int
    category: int
    is_active: Optional[bool] = True
    
    title: str
    model_name: str
    api_endpoint: str
    api_key: str
    temperature: float = 0.5
    notes: Optional[str] = ""

    is_starred: Optional[bool] = False
    tags: Optional[str] = ""

class UpdateLlmSchema(BaseModel):
    provider: Optional[int] = None
    category: Optional[int] = None
    is_active: Optional[bool] = None
    
    title: Optional[str] = None
    model_name: Optional[str] = None
    api_endpoint: Optional[str] = None
    api_key: Optional[str] = None
    temperature : Optional[float] = None
    notes: Optional[str] = None

    is_starred: Optional[bool] = None
    tags: Optional[str] = None  
