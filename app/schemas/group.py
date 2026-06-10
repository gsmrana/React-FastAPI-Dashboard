import uuid
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class GroupMemberRead(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    group_role: Optional[str] = None

    model_config = {"from_attributes": True}


class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class GroupRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GroupWithMembers(GroupRead):
    members: List[GroupMemberRead] = []


class GroupInvite(BaseModel):
    email: str
