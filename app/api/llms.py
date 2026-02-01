from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, Column
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.llm import LlmSchema, UpdateLlmSchema, CreateLlmSchema
from app.core.users import current_active_user
from app.db.async_db import get_async_db
from app.models.user import User
from app.models.llm import Llm


router = APIRouter()

@router.get("/llms", response_model=List[LlmSchema])
async def get_llm_list(
    include_deleted: bool = False,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    query = select(Llm)
    if not include_deleted:
        query = query.filter(Llm.deleted_at == None)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/llms", response_model=LlmSchema)
async def create_llm(
    create_llm: CreateLlmSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    new_llm = Llm(
        **create_llm.model_dump(),
        created_by=user.id
    )
    db.add(new_llm)
    await db.commit()
    await db.refresh(new_llm)
    return new_llm

@router.get("/llms/{llm_id}", response_model=LlmSchema)
async def get_llm(
    llm_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Llm).where(Llm.id == llm_id))
    llm = result.scalars().first()
    if not llm:
        raise HTTPException(404, f"LLM id {llm_id} not found")
    return llm

@router.patch("/llms/{llm_id}", response_model=LlmSchema)
async def update_llm(
    llm_id: int,
    updates: UpdateLlmSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Llm).where(Llm.id == llm_id))
    llm = result.scalars().first()
    if not llm:
        raise HTTPException(404, f"LLM id {llm_id} not found")
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(llm, key, value)
    llm.updated_by = user.id
    await db.commit()
    await db.refresh(llm)
    return llm

@router.delete("/llms/{llm_id}", response_model=LlmSchema)
async def delete_llm(
    llm_id: int,
    hard_delete: bool = False,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Llm).where(Llm.id == llm_id))
    llm = result.scalars().first()
    if not llm:
        raise HTTPException(404, f"LLM id {llm_id} not found")
    if not hard_delete:
        llm.deleted_by = user.id
        llm.deleted_at = datetime.now(timezone.utc)
    else:
        await db.delete(llm)
    await db.commit()
    await db.refresh(llm)
    return llm
