import sys
import uuid
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
from app.models.group import Group
from app.schemas.user import UserCreate, UserRead, AdminUserRead, AdminUserUpdate
from app.schemas.group import GroupRead
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

@router.get("/admin/users", response_model=List[AdminUserRead])
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

    # fetch all referenced groups in one query
    group_ids = {u.group_id for u in users if u.group_id is not None}
    group_names: dict[int, str] = {}
    if group_ids:
        g_result = await db.execute(select(Group).where(Group.id.in_(group_ids)))
        for g in g_result.scalars().all():
            group_names[g.id] = g.name

    return [
        AdminUserRead(
            **UserRead.model_validate(u).model_dump(),
            group_name=group_names.get(u.group_id) if u.group_id else None,
        )
        for u in users
    ]

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

@router.post("/admin/user-by-email", response_model=AdminUserRead)
async def find_user_by_email(
    email: str,
    admin: User = Depends(current_active_superuser),
    user_manager: UserManager = Depends(get_user_manager),
    db: AsyncSession = Depends(get_async_db),
):
    try:
        user = await user_manager.get_by_email(email)
    except exceptions.UserNotExists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="USER_NOT_FOUND.",
        )
    group_name: str | None = None
    if user.group_id is not None:
        g_result = await db.execute(select(Group).where(Group.id == user.group_id))
        g = g_result.scalars().first()
        if g:
            group_name = g.name
    return AdminUserRead(
        **UserRead.model_validate(user).model_dump(),
        group_name=group_name,
    )


@router.get("/admin/groups", response_model=List[GroupRead])
async def list_groups(
    admin: User = Depends(current_active_superuser),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Group).order_by(Group.name))
    return result.scalars().all()


@router.patch("/admin/users/{user_id}", response_model=AdminUserRead)
async def user_update(
    user_id: uuid.UUID,
    payload: AdminUserUpdate,
    admin: User = Depends(current_active_superuser),
    user_manager: UserManager = Depends(get_user_manager),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.email is not None:
        user.email = payload.email
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.is_superuser is not None:
        user.is_superuser = payload.is_superuser
    if payload.is_verified is not None:
        user.is_verified = payload.is_verified
    if payload.password:
        user.hashed_password = user_manager.password_helper.hash(payload.password)

    if payload.remove_from_group:
        user.group_id = None
        user.group_role = None
    elif payload.group_id is not None:
        user.group_id = payload.group_id
        user.group_role = payload.group_role

    db.add(user)
    await db.commit()
    await db.refresh(user)

    group_name: str | None = None
    if user.group_id is not None:
        g_result = await db.execute(select(Group).where(Group.id == user.group_id))
        g = g_result.scalars().first()
        if g:
            group_name = g.name

    return AdminUserRead(
        **UserRead.model_validate(user).model_dump(),
        group_name=group_name,
    )


@router.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def user_delete(
    user_id: uuid.UUID,
    admin: User = Depends(current_active_superuser),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Block deletion if user owns a group
    g_result = await db.execute(select(Group).where(Group.owner_id == user_id))
    owned_group = g_result.scalars().first()
    if owned_group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User owns group '{owned_group.name}'. Reassign ownership or delete the group first.",
        )

    await db.delete(user)
    await db.commit()
