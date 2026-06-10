import uuid
from typing import Optional
from fastapi_users import schemas

class UserRead(schemas.BaseUser[uuid.UUID]):
    full_name: str
    group_id: Optional[int] = None
    group_role: Optional[str] = None

class AdminUserRead(UserRead):
    """Extended UserRead for admin endpoints — includes group name."""
    group_name: Optional[str] = None

class UserCreate(schemas.BaseUserCreate):
    full_name: Optional[str] = ""

class UserUpdate(schemas.BaseUserUpdate):
    full_name: Optional[str] = None
