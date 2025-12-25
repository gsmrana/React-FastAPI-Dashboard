from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables import User
from app.schemas.user import UserRead
from app.db.database import get_db
from app.core.users import (
    current_active_superuser,
    get_user_manager
)


router = APIRouter()

@router.get("/admin/users", response_model=List[UserRead])
async def get_all_users(
    admin: User = Depends(current_active_superuser),
    user_manager = Depends(get_user_manager),
):
    users = await user_manager.user_db.list()
    return users

@router.get("/admin/user_list", response_model=List[UserRead])
async def get_all_user_list(
    admin: User = Depends(current_active_superuser),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users
