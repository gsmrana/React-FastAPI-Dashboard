import sys
import platform
from typing import List
from fastapi import APIRouter, Depends
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from fastapi_users import exceptions
from fastapi_users.router.common import ErrorCode
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.models.user import User
from app.schemas.user import UserCreate, UserRead
from app.db.database import get_db
from app.core.users import (
    UserManager,
    current_active_superuser,
    get_user_manager,
)


router = APIRouter()

@router.get("/admin/config", response_class=JSONResponse)
async def app_config(
    user: User = Depends(current_active_superuser),
):
    return config.model_dump()

@router.get("/admin/system", response_class=JSONResponse)
async def system_info(
    user: User = Depends(current_active_superuser),
):
    sys_info = {
        "Node": platform.node(),
        "Platform": sys.platform,
        "OS": platform.platform(),
        "Version": platform.version(),
        "Arch": platform.machine(),
        "CPU": platform.processor(),  
        "Python": platform.python_version(),
    } 
    return sys_info

@router.get("/admin/users", response_model=List[UserRead])
async def user_list(
    offset: int = None,
    limit: int = None,
    admin: User = Depends(current_active_superuser),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(User)
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    users = result.scalars().all()
    return users

@router.post("/admin/users", response_model=UserRead)
async def admin_user_create(
    user_create: UserCreate,
    admin: User = Depends(current_active_superuser),
    user_manager: UserManager = Depends(get_user_manager),
):
    try:
        created_user = await user_manager.create(
            user_create,
            safe=False, 
        )
    except exceptions.UserAlreadyExists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorCode.REGISTER_USER_ALREADY_EXISTS,
        )
    except exceptions.InvalidPasswordException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": ErrorCode.REGISTER_INVALID_PASSWORD,
                "reason": e.reason,
            },
        )
    return created_user

@router.post("/admin/user-by-email", response_model=UserRead)
async def find_user_by_email(
    email: str,
    admin: User = Depends(current_active_superuser),
    user_manager: UserManager = Depends(get_user_manager),
):
    try:
        user = await user_manager.get_by_email(email)
        return user
    except exceptions.UserNotExists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="USER_NOT_FOUND.",
        )
