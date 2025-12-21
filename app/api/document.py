import time
import shutil
import mimetypes
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, Depends, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.core.logger import get_logger
from app.core.users import current_active_user
from app.db.database import get_db
from app.models.tables import User
from app.schemas.document import (
    FileOperation,
    FileListResponse, 
)


router = APIRouter()
logger = get_logger(__name__)
UPLOAD_DIR = Path(config.UPLOAD_DIR)

@router.post("/document", response_model=FileListResponse)
async def upload_files(
    files: list[UploadFile] = File(...),
    # user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_db),
):
    try:
        filenames = []
        for file in files:
            # generate unique name if file already exists
            file_path = UPLOAD_DIR / file.filename
            if file_path.exists():
                newname = f"{file_path.stem} - {int(time.time()) }{file_path.suffix}"      
                file_path = UPLOAD_DIR / newname

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            filenames.append(file.filename)

        return FileListResponse(
            count=len(filenames),
            file_names=filenames,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error uploading file: {str(e)}"
        )    

@router.get("/documents", response_model=FileListResponse)
async def file_list(
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_db),
):
    try:
        filenames = []
        for file in UPLOAD_DIR.iterdir():
            filenames.append(file.name)

        return FileListResponse(
            count=len(filenames),
            file_names=filenames,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error getting file list: {str(e)}"
        )

@router.get("/document/{filename}", response_class=FileResponse)
async def download_file(
    filename: str,
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_db),
):
    try:
        file_path = UPLOAD_DIR / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        mime_type, _ = mimetypes.guess_type(file_path)
        return FileResponse(
            path=file_path,
            filename=file_path.name,
            media_type=mime_type or "application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error downloading file: {str(e)}"
        )

@router.delete("/document", response_model=FileOperation)
async def delete_file(
    request: FileOperation,
    user: User = Depends(current_active_user),
    # db: AsyncSession = Depends(get_db),
):
    try:
        file_path = UPLOAD_DIR / request.file_name
        if file_path.exists():
            file_path.unlink()
        return FileOperation(
            file_name=request.file_name,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error deleting file: {str(e)}"
        )
