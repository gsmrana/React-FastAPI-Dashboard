import io
import shutil
import mimetypes
from PIL import Image
from typing import List
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, Depends, File
from fastapi.responses import FileResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.core.logger import get_logger
from app.core.users import current_active_user
from app.db.async_db import get_async_db
from app.models.user import User
from app.schemas.document import (
    DocumentRequest,
    DocumentSchema, 
    RenameRequest,
)

SOURCE_FILES = [".c",".cpp",".py",".cs"]
IMAGE_FILES = [".jpg",".jpeg",".png",".webp"]
VIDEO_FILES = [".avi",".mp3",".mp4",".m3u"]

router = APIRouter()
logger = get_logger(__name__)
ICON_DIR = Path("app/static/icons")
UPLOAD_DIR = Path(config.upload_dir)
FILE_NOT_FOUND_EXC = HTTPException(status_code=404, detail="File not found")

def get_icon_file(ext):
    icon_file = "file-text.svg"
    if ext in ".pdf":
        icon_file = "file-pdf.svg"
    elif ext in ".exe":
        icon_file = "file-bin.svg"
    elif ext in SOURCE_FILES:
        icon_file = "file-code.svg"
    elif ext in IMAGE_FILES:
        icon_file = "file-image.svg"
    elif ext in VIDEO_FILES:
        icon_file = "file-video.svg"
    return ICON_DIR / icon_file

def get_formatted_size(size_bytes):   
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024

def get_unique_filename(file_path):
    count = 1
    unique_filename = file_path
    while unique_filename.exists():
        unique_filename = file_path.with_name(f"{file_path.stem} ({count}){file_path.suffix}")
        count += 1
    return unique_filename

@router.get("/documents", response_model=List[DocumentSchema])
async def document_list(
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_async_db),
):
    documents = []
    for idx, file in enumerate(UPLOAD_DIR.iterdir()):
        filestat = file.stat()
        documents.append(DocumentSchema(
            id=str(idx+1),
            filename=file.name,
            filepath=str(file),
            filesize=get_formatted_size(filestat.st_size),
            created_at=datetime.fromtimestamp(filestat.st_ctime),
            modified_at=datetime.fromtimestamp(filestat.st_mtime),
        ))
    return documents

@router.post("/documents/upload", response_model=List[DocumentSchema])
async def upload_files(
    files: list[UploadFile] = File(...),
    # user: User = Depends(current_active_user), # excluding user auth for external use
    # db: AsyncSession = Depends(get_async_db),
):
    stored_files = []
    for file in files:
        store_filepath = UPLOAD_DIR / file.filename
        store_filepath = get_unique_filename(store_filepath)

        with open(store_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        stored_files.append(store_filepath)

    response = []
    for idx, filepath in enumerate(stored_files):
        filestat = filepath.stat()
        response.append(DocumentSchema(
            id=str(idx+1),
            filename=filepath.name,
            filepath=str(filepath),
            filesize=get_formatted_size(filestat.st_size),
            created_at=datetime.fromtimestamp(filestat.st_ctime),
            modified_at=datetime.fromtimestamp(filestat.st_mtime),
        ))
    return response

@router.get("/documents/thumbnail/{filename}")
async def get_thumbnail(
    filename: str,
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_async_db),
):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise FILE_NOT_FOUND_EXC
    
    ext = file_path.suffix.lower()
    if ext in [".jpg", ".jpeg", ".png", ".webp"]:
        with Image.open(file_path) as img:
            img.thumbnail((50, 50)) # Datatable row height
            buf = io.BytesIO()
            img.save(buf, format="WEBP")
            return Response(
                content=buf.getvalue(), 
                media_type="image/webp",
            )
    return FileResponse(get_icon_file(ext))

@router.get("/documents/view/{filename}", response_class=FileResponse)
async def view_file(
    filename: str,
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_async_db),
):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise FILE_NOT_FOUND_EXC
    
    # media_type helps the browser understand how to render it
    media_type, _ = mimetypes.guess_type(file_path)

    # 'inline' tells the browser: "Try to show this inside the window"
    headers = {
        "Content-Disposition": f"inline; filename={file_path.name}"
    }

    return FileResponse(
        path=file_path,
        filename=file_path.name,
        headers=headers,
        media_type=media_type or "application/octet-stream",
    )

@router.get("/documents/download/{filename}", response_class=FileResponse)
async def download_file(
    filename: str,
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_async_db),
):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise FILE_NOT_FOUND_EXC

    media_type, _ = mimetypes.guess_type(file_path)
    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type=media_type or "application/octet-stream"
    )

@router.patch("/documents", response_model=DocumentSchema)
async def update_filename(
    doc: RenameRequest,
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_async_db),
):
    file_path = UPLOAD_DIR / doc.filename
    if not file_path.exists():
        raise FILE_NOT_FOUND_EXC    
    
    file_path.rename(UPLOAD_DIR / doc.new_filename)
    return DocumentSchema(
        id=0,
        filename=doc.new_filename,
        filepath=str(UPLOAD_DIR / doc.new_filename),
    )

@router.delete("/documents", response_model=DocumentSchema)
async def delete_file(
    doc: DocumentRequest,
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_async_db),
):
    file_path = UPLOAD_DIR / doc.filename
    if not file_path.exists():
        raise FILE_NOT_FOUND_EXC

    file_path.unlink()
    return DocumentSchema(
        id=0,
        filename=doc.filename,
        filepath=str(file_path),
    )
