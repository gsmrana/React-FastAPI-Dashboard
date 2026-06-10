from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, Column
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.users import current_active_user
from app.core.llm_cache import LlmCache, llm_cache, get_llm_cache
from app.db.async_db import get_async_db
from app.models.user import User
from app.models.llm_config import LlmConfig
from app.schemas.llm_config import LlmSchema, UpdateLlmSchema, CreateLlmSchema


router = APIRouter()


def _apply_group_filter(query, Model, user: User):
    if user.is_superuser:
        return query
    if user.group_id is not None:
        return query.filter(Model.group_id == user.group_id)
    return query.filter(Model.created_by == user.id)


def _check_access(resource, user: User) -> bool:
    if user.is_superuser:
        return True
    if user.group_id is not None:
        return resource.group_id == user.group_id
    return resource.created_by == user.id


@router.get("/llm-configs", response_model=List[LlmSchema])
async def get_llm_config_list(
    is_active: Optional[bool] = None,
    include_deleted: Optional[bool] = None,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    query = select(LlmConfig)
    query = _apply_group_filter(query, LlmConfig, user)
    if is_active is not None:
        query = query.filter(LlmConfig.is_active == is_active)
    if include_deleted is None or include_deleted is False:
        query = query.filter(LlmConfig.deleted_at == None)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/llm-configs", response_model=LlmSchema)
async def create_llm_config(
    create_llm: CreateLlmSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    new_llm = LlmConfig(
        **create_llm.model_dump(),
        created_by=user.id,
        group_id=user.group_id,
    )
    db.add(new_llm)
    await db.commit()
    await db.refresh(new_llm)
    await llm_cache.refresh()
    return new_llm

@router.get("/llm-configs/cached", response_model=List[LlmSchema])
async def get_cached_llm_configs(
    force_refresh: Optional[bool] = None,
    user: User = Depends(current_active_user),
    cache: LlmCache = Depends(get_llm_cache),
):
    """Get list of available LLM configs from cache"""
    if force_refresh:
        await cache.refresh()
    
    configs = cache.get_active_llm_configs()
    if not configs and not force_refresh:
        await cache.refresh()
        configs = cache.get_active_llm_configs()
    return list(configs.values())

@router.get("/llm-configs/{llm_id}", response_model=LlmSchema)
async def get_llm_config(
    llm_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(LlmConfig).where(LlmConfig.id == llm_id))
    llm = result.scalars().first()
    if not llm or not _check_access(llm, user):
        raise HTTPException(404, f"LLM config id {llm_id} not found")
    return llm

@router.patch("/llm-configs/{llm_id}", response_model=LlmSchema)
async def update_llm_config(
    llm_id: int,
    updates: UpdateLlmSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(LlmConfig).where(LlmConfig.id == llm_id))
    llm = result.scalars().first()
    if not llm or not _check_access(llm, user):
        raise HTTPException(404, f"LLM config id {llm_id} not found")
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(llm, key, value)
        llm.updated_by = user.id
    await db.commit()
    await db.refresh(llm)
    await llm_cache.refresh()
    return llm

@router.delete("/llm-configs/{llm_id}", response_model=LlmSchema)
async def delete_llm_config(
    llm_id: int,
    hard_delete: bool = False,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(LlmConfig).where(LlmConfig.id == llm_id))
    llm = result.scalars().first()
    if not llm or not _check_access(llm, user):
        raise HTTPException(404, f"LLM config id {llm_id} not found")
    if not hard_delete:
        llm.deleted_by = user.id
        llm.deleted_at = datetime.now(timezone.utc)
    else:
        await db.delete(llm)
    
    await db.commit()
    if not hard_delete:
        await db.refresh(llm)
    await llm_cache.refresh()
    return llm
