from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, Column
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.core.logger import get_logger
from app.schemas.notepad import NoteSchema, UpdateNoteSchema, CreateNoteSchema
from app.core.users import current_active_user
from app.db.database import get_db
from app.models.user import User
from app.models.notepad import Notepad


router = APIRouter()
logger = get_logger(__name__)

@router.get("/notepads", response_model=List[NoteSchema])
async def note_list(
    include_deleted: bool = False,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Notepad)
    if not include_deleted:
        query = query.filter(Notepad.deleted_at == None)
    result = await db.execute(query)
    notepads = result.scalars().all()
    return [NoteSchema.model_validate(item) for item in notepads]

@router.post("/notepads", response_model=NoteSchema)
async def create_note(
    create_note: CreateNoteSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
):
    new_note = Notepad(
        **create_note.model_dump(),
        created_by=user.id
    )
    db.add(new_note)
    await db.commit()
    await db.refresh(new_note)
    return NoteSchema.model_validate(new_note)

@router.get("/notepads/{note_id}", response_model=NoteSchema)
async def get_note(
    note_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Notepad).where(Notepad.id == note_id))
    notepad = result.scalars().first()
    if not notepad:
        raise HTTPException(404, f"Note id {note_id} not found")
    return NoteSchema.model_validate(notepad)

@router.put("/notepads/{note_id}", response_model=NoteSchema)
async def update_note(
    note_id: int,
    updates: UpdateNoteSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Notepad).where(Notepad.id == note_id))
    notepad = result.scalars().first()
    if not notepad:
        raise HTTPException(404, f"Note id {note_id} not found")
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(notepad, key, value)
    notepad.updated_by = user.id
    await db.commit()
    await db.refresh(notepad)
    return NoteSchema.model_validate(notepad)

@router.delete("/notepads/{note_id}", response_model=NoteSchema)
async def delete_note(
    note_id: int,
    hard_delete: bool = False,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Notepad).where(Notepad.id == note_id))
    notepad = result.scalars().first()
    if not notepad:
        raise HTTPException(404, f"Note id {note_id} not found")
    if not hard_delete:
        notepad.deleted_by = user.id
        notepad.deleted_at = datetime.now(timezone.utc)
    else:
        await db.delete(notepad)
    await db.commit()
    await db.refresh(notepad)
    return NoteSchema.model_validate(notepad)
