import sys
import platform
from typing import List
from pathlib import Path
from fastapi import APIRouter, Depends
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi_users import exceptions
from fastapi_users.router.common import ErrorCode
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.models.user import User
from app.schemas.user import UserCreate, UserRead
from app.db.async_db import get_async_db
from app.core.users import (
    UserManager,
    current_active_superuser,
    get_user_manager,
)

LOG_FILE_PATH = "logs/app.log"
router = APIRouter()

@router.get("/admin/sysinfo", response_class=JSONResponse)
async def get_system_info(
    admin: User = Depends(current_active_superuser)
):
    return {
        "Python": platform.python_version(),
        "Node": platform.node(),
        "Arch": platform.machine(),
        "Platform": sys.platform,
        "CPU": platform.processor(),
        "OS Name": platform.platform(),
        "OS Version": platform.version(),
    }

@router.get("/admin/appconfig", response_class=JSONResponse)
async def get_app_config(
    admin: User = Depends(current_active_superuser)
):
    return config.model_dump()

@router.get("/admin/applog/view", response_class=FileResponse)
async def view_applog(
    admin: User = Depends(current_active_superuser)
):
    log_file = Path(LOG_FILE_PATH)
    if not log_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Log file not found"
        )
    # 'inline' tells the browser: "Try to show this inside the window"
    headers = {
        "Content-Disposition": f"inline; filename={log_file.name}"
    }
    return FileResponse(
        path=log_file,
        filename=log_file.name,
        headers=headers,
        media_type='text/plain'
    )

@router.get("/admin/applog/download", response_class=FileResponse)
async def download_applog(
    admin: User = Depends(current_active_superuser)
):
    log_file = Path(LOG_FILE_PATH)
    if not log_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Log file not found"
        )
    return FileResponse(
        path=log_file,
        filename=log_file.name,
        media_type='text/plain'
    )

@router.get("/admin/users", response_model=List[UserRead])
async def user_list(
    offset: int = None,
    limit: int = None,
    admin: User = Depends(current_active_superuser),
    db: AsyncSession = Depends(get_async_db),
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
async def user_create(
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
