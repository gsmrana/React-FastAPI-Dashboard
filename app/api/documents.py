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
from app.db.async_db import get_async_db
from app.models.user import User
from app.schemas.document import (
    DocumentRequest,
    DocumentSchema, 
    RenameRequest,
)


router = APIRouter()
logger = get_logger(__name__)
UPLOAD_DIR = Path(config.upload_dir)

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
    # db: AsyncSession = Depends(get_db),
):
    try:
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
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in getting document list: {str(e)}"
        )

@router.post("/documents/upload", response_model=List[DocumentSchema])
async def upload_files(
    files: list[UploadFile] = File(...),
    # user: User = Depends(current_active_user), # excluding user auth for external use
    # db: AsyncSession = Depends(get_db),
):
    try:
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
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in uploading files: {str(e)}"
        )

@router.get("/documents/download/{filename}", response_class=FileResponse)
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in downloading file: {str(e)}"
        )

@router.get("/documents/view/{filename}", response_class=FileResponse)
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in viewing file: {str(e)}"
        )

@router.put("/documents", response_model=DocumentSchema)
async def rename_file(
    doc: RenameRequest,
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_db),
):
    try:
        file_path = UPLOAD_DIR / doc.filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")        
        
        file_path.rename(UPLOAD_DIR / doc.new_filename)
        return DocumentSchema(
            id=0,
            filename=doc.new_filename,
            filepath=str(UPLOAD_DIR / doc.new_filename),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in renaming file: {str(e)}"
        )

@router.delete("/documents", response_model=DocumentSchema)
async def delete_file(
    doc: DocumentRequest,
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_db),
):
    try:
        file_path = UPLOAD_DIR / doc.filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found") 

        file_path.unlink()
        return DocumentSchema(
            id=0,
            filename=doc.filename,
            filepath=str(file_path),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in deleting file: {str(e)}"
        )
