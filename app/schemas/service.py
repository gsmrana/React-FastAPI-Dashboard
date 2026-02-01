from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.audit import AuditSchema


class ServiceContent(BaseModel):
    id: int
    name: str
    url: str
    username: str
    password: str
    notes: str
    
    is_starred: bool
    category: int
    tags: Optional[str]

class ServiceSchema(AuditSchema, ServiceContent):
    model_config = ConfigDict(from_attributes=True)

class CreateServiceSchema(BaseModel):
    name: str
    url: str
    username: Optional[str] = ""
    password: Optional[str] = ""
    notes: Optional[str] = ""

    is_starred: Optional[bool] = False
    category: Optional[int] = 0
    tags: Optional[str] = ""

class UpdateServiceSchema(BaseModel):
    name: Optional[str] = None
    url: str = None
    username: str = None
    password: str = None
    notes: str = None

    is_starred: Optional[bool] = None
    category: Optional[int] = None
    tags: Optional[str] = None
