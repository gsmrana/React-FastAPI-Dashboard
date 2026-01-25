from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, Column
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.core.logger import get_logger
from app.schemas.todo import TodoSchema, UpdateTodoSchema, CreateTodoSchema
from app.core.users import current_active_user
from app.db.async_db import get_async_db
from app.models.user import User
from app.models.todo import Todo


router = APIRouter()
logger = get_logger(__name__)

@router.get("/todos", response_model=List[TodoSchema])
async def get_todo_list(
    include_completed: bool = False,
    include_deleted: bool = False,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    query = select(Todo)
    if not include_deleted:
        query = query.filter(Todo.deleted_at == None)
    if not include_completed:
        query = query.filter(Todo.is_completed == False)
    result = await db.execute(query)
    todos = result.scalars().all()
    return [TodoSchema.model_validate(item) for item in todos]

@router.post("/todos", response_model=TodoSchema)
async def create_todo(
    create_todo: CreateTodoSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    new_todo = Todo(
        **create_todo.model_dump(),
        created_by=user.id
    )
    db.add(new_todo)
    await db.commit()
    await db.refresh(new_todo)
    return TodoSchema.model_validate(new_todo)

@router.get("/todos/{todo_id}", response_model=TodoSchema)
async def get_todo(
    todo_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Todo).where(Todo.id == todo_id))
    todo = result.scalars().first()
    if not todo:
        raise HTTPException(404, f"Todo id {todo_id} not found")
    return TodoSchema.model_validate(todo)

@router.put("/todos/{todo_id}", response_model=TodoSchema)
async def update_todo(
    todo_id: int,
    updates: UpdateTodoSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Todo).where(Todo.id == todo_id))
    todo = result.scalars().first()
    if not todo:
        raise HTTPException(404, f"Todo id {todo_id} not found")
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(todo, key, value)
    todo.updated_by = user.id
    await db.commit()
    await db.refresh(todo)
    return TodoSchema.model_validate(todo)

@router.delete("/todos/{todo_id}", response_model=TodoSchema)
async def delete_todo(
    todo_id: int,
    hard_delete: bool = False,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Todo).where(Todo.id == todo_id))
    todo = result.scalars().first()
    if not todo:
        raise HTTPException(404, f"Todo id {todo_id} not found")
    if not hard_delete:
        todo.deleted_by = user.id
        todo.deleted_at = datetime.now(timezone.utc)
    else:
        await db.delete(todo)
    await db.commit()
    await db.refresh(todo)
    return TodoSchema.model_validate(todo)
