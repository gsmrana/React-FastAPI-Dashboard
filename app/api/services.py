from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, Column
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.service import ServiceSchema, UpdateServiceSchema, CreateServiceSchema
from app.core.users import current_active_user
from app.db.async_db import get_async_db
from app.models.user import User
from app.models.service import Service


router = APIRouter()

@router.get("/services", response_model=List[ServiceSchema])
async def get_service_list(
    include_deleted: Optional[bool] = None, 
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    query = select(Service)
    if include_deleted is None or include_deleted is False:
        query = query.filter(Service.deleted_at == None)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/services", response_model=ServiceSchema)
async def create_service(
    create_service: CreateServiceSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    new_service = Service(
        **create_service.model_dump(),
        created_by=user.id
    )
    db.add(new_service)
    await db.commit()
    await db.refresh(new_service)
    return new_service

@router.get("/services/{service_id}", response_model=ServiceSchema)
async def get_service(
    service_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalars().first()
    if not service:
        raise HTTPException(404, f"Service id {service_id} not found")
    return service

@router.patch("/services/{service_id}", response_model=ServiceSchema)
async def update_service(
    service_id: int,
    updates: UpdateServiceSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalars().first()
    if not service:
        raise HTTPException(404, f"Service id {service_id} not found")
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(service, key, value)
    service.updated_by = user.id
    await db.commit()
    await db.refresh(service)
    return service

@router.delete("/services/{service_id}", response_model=ServiceSchema)
async def delete_service(
    service_id: int,
    hard_delete: bool = False,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalars().first()
    if not service:
        raise HTTPException(404, f"Service id {service_id} not found")
    if not hard_delete:
        service.deleted_by = user.id
        service.deleted_at = datetime.now(timezone.utc)
    else:
        await db.delete(service)
    await db.commit()
    await db.refresh(service)
    return service
