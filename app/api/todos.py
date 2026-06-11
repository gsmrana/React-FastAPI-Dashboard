from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, Column
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.todo import TodoSchema, UpdateTodoSchema, CreateTodoSchema
from app.core.users import current_active_user
from app.db.async_db import get_async_db
from app.api.common import apply_authorized_filter, is_authorized, resolve_group_id
from app.models.user import User
from app.models.todo import Todo


router = APIRouter()


@router.get("/todos", response_model=List[TodoSchema])
async def get_todo_list(
    include_completed: Optional[bool] = None,
    include_deleted: Optional[bool] = None,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    query = select(Todo)
    query = apply_authorized_filter(query, Todo, user)
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
    effective_group = resolve_group_id(
        create_todo.group_id,
        "group_id" in create_todo.model_fields_set,
        user,
    )
    data = create_todo.model_dump(exclude={"group_id"})
    new_todo = Todo(
        **data,
        created_by=user.id,
        group_id=effective_group,
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
    if not todo or not is_authorized(todo, user):
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
    if not todo or not is_authorized(todo, user):
        raise HTTPException(404, f"Todo id {todo_id} not found")
    update_data = updates.model_dump(exclude_unset=True)
    if "group_id" in update_data:
        update_data["group_id"] = resolve_group_id(update_data["group_id"], True, user)
    for key, value in update_data.items():
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
    if not todo or not is_authorized(todo, user):
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
