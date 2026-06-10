from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, Column
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.todo import TodoSchema, UpdateTodoSchema, CreateTodoSchema
from app.core.users import current_active_user
from app.db.async_db import get_async_db
from app.models.user import User
from app.models.todo import Todo


router = APIRouter()


def _apply_group_filter(query, Model, user: User):
    """Filter resources by group membership. Superusers see all."""
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


@router.get("/todos", response_model=List[TodoSchema])
async def get_todo_list(
    include_completed: Optional[bool] = None,
    include_deleted: Optional[bool] = None,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    query = select(Todo)
    query = _apply_group_filter(query, Todo, user)
    if include_deleted is None or include_deleted is False:
        query = query.filter(Todo.deleted_at == None)
    if include_completed is None or include_completed is False:
        query = query.filter(Todo.is_completed == False)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/todos", response_model=TodoSchema)
async def create_todo(
    create_todo: CreateTodoSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    new_todo = Todo(
        **create_todo.model_dump(),
        created_by=user.id,
        group_id=user.group_id,
    )
    db.add(new_todo)
    await db.commit()
    await db.refresh(new_todo)
    return new_todo

@router.get("/todos/{todo_id}", response_model=TodoSchema)
async def get_todo(
    todo_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Todo).where(Todo.id == todo_id))
    todo = result.scalars().first()
    if not todo or not _check_access(todo, user):
        raise HTTPException(404, f"Todo id {todo_id} not found")
    return todo

@router.patch("/todos/{todo_id}", response_model=TodoSchema)
async def update_todo(
    todo_id: int,
    updates: UpdateTodoSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Todo).where(Todo.id == todo_id))
    todo = result.scalars().first()
    if not todo or not _check_access(todo, user):
        raise HTTPException(404, f"Todo id {todo_id} not found")
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(todo, key, value)
    todo.updated_by = user.id
    await db.commit()
    await db.refresh(todo)
    return todo

@router.delete("/todos/{todo_id}", response_model=TodoSchema)
async def delete_todo(
    todo_id: int,
    hard_delete: bool = False,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Todo).where(Todo.id == todo_id))
    todo = result.scalars().first()
    if not todo or not _check_access(todo, user):
        raise HTTPException(404, f"Todo id {todo_id} not found")
    if not hard_delete:
        todo.deleted_by = user.id
        todo.deleted_at = datetime.now(timezone.utc)
    else:
        await db.delete(todo)
    await db.commit()
    if not hard_delete:
        await db.refresh(todo)
    return todo
