from fastapi import APIRouter
from app.schemas.notepad import NoteRequest, NoteResponse


router = APIRouter()
stored_note = ""

@router.get("/notepad", response_model=NoteResponse)
async def get_note():
    global stored_note
    return NoteResponse(content=stored_note)

@router.post("/notepad", response_model=NoteResponse)
async def save_note(
    note_request: NoteRequest
):
    global stored_note
    stored_note = note_request.content
    return NoteResponse(content=stored_note)

@router.delete("/notepad", response_model=NoteResponse)
async def clear_note():
    global stored_note
    stored_note = ""
    return NoteResponse(content=stored_note)
