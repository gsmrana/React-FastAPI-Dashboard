import shutil
import mimetypes
from typing import List
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, Depends, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.core.logger import get_logger
from app.core.users import current_active_user
from app.db.database import get_db
from app.models.tables import User
from app.schemas.document import (
    DocRequest,
    DocResponse, 
    UpdateRequest,
)


router = APIRouter()
logger = get_logger(__name__)
UPLOAD_DIR = Path(config.UPLOAD_DIR)
DATE_TIME_FORMAT = '%d-%b-%Y %I:%M %p'

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

@router.get("/documents", response_model=List[DocResponse])
async def get_documents(
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_db),
):
    try:
        documents = []
        for idx, file in enumerate(UPLOAD_DIR.iterdir()):
            filestat = file.stat()
            created_at = datetime.fromtimestamp(filestat.st_birthtime).strftime(DATE_TIME_FORMAT)
            documents.append(DocResponse(
                id=str(idx+1),
                filename=file.name,
                filesize=get_formatted_size(filestat.st_size),
                created_at=created_at,
            ))
        return documents
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in getting document list: {str(e)}"
        )

@router.post("/document-upload", response_model=List[DocResponse])
async def upload_files(
    files: list[UploadFile] = File(...),
    # user: User = Depends(current_active_user), # excluding user auth for external use
    # db: AsyncSession = Depends(get_db),
):
    try:
        filenames = []
        for file in files:
            store_filename = UPLOAD_DIR / file.filename
            store_filename = get_unique_filename(store_filename)

            with open(store_filename, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            filenames.append(store_filename)

        response = []
        for idx, filepath in enumerate(filenames):
            filestat = filepath.stat()
            response.append(DocResponse(
                id=str(idx+1),
                filename=filepath.name,
                filesize=get_formatted_size(filestat.st_size),
                created_at=datetime.fromtimestamp(filestat.st_birthtime).
                    strftime(DATE_TIME_FORMAT)
            ))
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in uploading files: {str(e)}"
        )

@router.get("/document-download/{filename}", response_class=FileResponse)
async def download_file(
    filename: str,
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_db),
):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        media_type, _ = mimetypes.guess_type(file_path)
        return FileResponse(
            path=file_path,
            filename=file_path.name,
            media_type=media_type or "application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in downloading file: {str(e)}"
        )

@router.get("/document-view/{filename}", response_class=FileResponse)
async def view_file(
    filename: str,
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_db),
):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
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
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in viewing file: {str(e)}"
        )

@router.put("/document", response_model=DocResponse)
async def update_file(
    request: UpdateRequest,
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_db),
):
    try:
        file_path = UPLOAD_DIR / request.filename
        if file_path.exists():
            file_path.rename(UPLOAD_DIR / request.new_filename)
        return DocResponse(
            id=request.id,
            filename=request.new_filename,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in renaming file: {str(e)}"
        )

@router.delete("/document", response_model=DocResponse)
async def delete_file(
    request: DocRequest,
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_db),
):
    try:
        file_path = UPLOAD_DIR / request.filename
        if file_path.exists():
            file_path.unlink()
        return DocResponse(
            id=request.id,
            filename=request.filename,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in deleting file: {str(e)}"
        )
