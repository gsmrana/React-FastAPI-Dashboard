import uuid
from typing import Literal, Optional
from pydantic import BaseModel
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


class AdminUserUpdate(BaseModel):
    """Admin-only payload for PATCH /admin/users/{user_id}."""
    email: Optional[str] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    is_verified: Optional[bool] = None
    group_id: Optional[int] = None
    group_role: Optional[Literal["owner", "member"]] = None
    remove_from_group: bool = False
