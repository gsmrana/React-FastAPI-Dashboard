from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, Column
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.core.logger import get_logger
from app.schemas.expense import ExpenseSchema, UpdateExpenseSchema, CreateExpenseSchema
from app.core.users import current_active_user
from app.db.database import get_db
from app.models.user import User
from app.models.expense import Expense


router = APIRouter()
logger = get_logger(__name__)

@router.get("/expenses", response_model=List[ExpenseSchema])
async def expense_list(
    from_date: datetime = None,
    to_date: datetime = None,
    include_deleted: bool = False,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Expense)
    if from_date:
        query = query.filter(Expense.date >= from_date)
    if to_date:
        query = query.filter(Expense.date <= to_date)
    if not include_deleted:
        query = query.filter(Expense.deleted_at == None)
    result = await db.execute(query)
    expenses = result.scalars().all()
    return [ExpenseSchema.model_validate(item) for item in expenses]

@router.post("/expenses", response_model=ExpenseSchema)
async def create_expense(
    create_expense: CreateExpenseSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
):
    new_expense = Expense(
        **create_expense.model_dump(),
        created_by=user.id
    )
    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)
    return ExpenseSchema.model_validate(new_expense)

@router.get("/expenses/{expense_id}", response_model=ExpenseSchema)
async def get_expense(
    expense_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalars().first()
    if not expense:
        raise HTTPException(404, f"Expense id {expense_id} not found")
    return ExpenseSchema.model_validate(expense)

@router.put("/expenses/{expense_id}", response_model=ExpenseSchema)
async def update_expense(
    expense_id: int,
    updates: UpdateExpenseSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalars().first()
    if not expense:
        raise HTTPException(404, f"Expense id {expense_id} not found")
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(expense, key, value)
    expense.updated_by = user.id
    await db.commit()
    await db.refresh(expense)
    return ExpenseSchema.model_validate(expense)

@router.delete("/expenses/{expense_id}", response_model=ExpenseSchema)
async def delete_expense(
    expense_id: int,
    hard_delete: bool = False,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalars().first()
    if not expense:
        raise HTTPException(404, f"Expense id {expense_id} not found")
    if not hard_delete:
        expense.deleted_by = user.id
        expense.deleted_at = datetime.now(timezone.utc)
    else:
        await db.delete(expense)
    await db.commit()
    await db.refresh(expense)
    return ExpenseSchema.model_validate(expense)
