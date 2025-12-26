from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.core.logger import get_logger
from app.schemas.notepad import NoteRequest, NoteResponse
from app.core.users import current_active_user
from app.db.database import get_db
from app.models.tables import User


router = APIRouter()
logger = get_logger(__name__)
stored_note = ""

@router.get("/notepad", response_model=NoteResponse)
async def get_note(
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_db),
):
    global stored_note
    return NoteResponse(content=stored_note)

@router.post("/notepad", response_model=NoteResponse)
async def save_note(
    note_request: NoteRequest,
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_db),
):
    global stored_note
    stored_note = note_request.content
    return NoteResponse(content=stored_note)

@router.delete("/notepad", response_model=NoteResponse)
async def clear_note(
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_db),
):
    global stored_note
    stored_note = ""
    return NoteResponse(content=stored_note)
