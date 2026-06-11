from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, Column
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.expense import ExpenseSchema, UpdateExpenseSchema, CreateExpenseSchema
from app.core.users import current_active_user
from app.db.async_db import get_async_db
from app.api.common import apply_authorized_filter, is_authorized, resolve_group_id
from app.models.user import User
from app.models.expense import Expense


router = APIRouter()


@router.get("/expenses", response_model=List[ExpenseSchema])
async def expense_list(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    include_deleted: Optional[bool] = None,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    query = select(Expense)
    query = apply_authorized_filter(query, Expense, user)
    if from_date:
        query = query.filter(Expense.date >= from_date)
    if to_date:
        query = query.filter(Expense.date <= to_date)
    if include_deleted is None or include_deleted is False:
        query = query.filter(Expense.deleted_at == None)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/expenses", response_model=ExpenseSchema)
async def create_expense(
    create_expense: CreateExpenseSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    effective_group = resolve_group_id(
        create_expense.group_id,
        "group_id" in create_expense.model_fields_set,
        user,
    )
    data = create_expense.model_dump(exclude={"group_id"})
    new_expense = Expense(
        **data,
        created_by=user.id,
        group_id=effective_group,
    )
    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)
    return new_expense

@router.get("/expenses/{expense_id}", response_model=ExpenseSchema)
async def get_expense(
    expense_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalars().first()
    if not expense or not is_authorized(expense, user):
        raise HTTPException(404, f"Expense id {expense_id} not found")
    return expense

@router.patch("/expenses/{expense_id}", response_model=ExpenseSchema)
async def update_expense(
    expense_id: int,
    updates: UpdateExpenseSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalars().first()
    if not expense or not is_authorized(expense, user):
        raise HTTPException(404, f"Expense id {expense_id} not found")
    update_data = updates.model_dump(exclude_unset=True)
    if "group_id" in update_data:
        update_data["group_id"] = resolve_group_id(update_data["group_id"], True, user)
    for key, value in update_data.items():
        setattr(expense, key, value)
    expense.updated_by = user.id
    await db.commit()
    await db.refresh(expense)
    return expense

@router.delete("/expenses/{expense_id}", response_model=ExpenseSchema)
async def delete_expense(
    expense_id: int,
    hard_delete: bool = False,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalars().first()
    if not expense or not is_authorized(expense, user):
        raise HTTPException(404, f"Expense id {expense_id} not found")
    if not hard_delete:
        expense.deleted_by = user.id
        expense.deleted_at = datetime.now(timezone.utc)
    else:
        await db.delete(expense)
    await db.commit()
    if not hard_delete:
        await db.refresh(expense)
    return expense
