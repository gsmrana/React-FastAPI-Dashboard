import io
import shutil
import mimetypes
from PIL import Image
from typing import List, Optional
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, UploadFile, Depends, File
from fastapi.responses import FileResponse, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.core.users import current_active_user
from app.db.async_db import get_async_db
from app.api.common import apply_authorized_filter, is_authorized, resolve_group_id
from app.models.user import User
from app.models.document import Document
from app.schemas.document import (
    DocumentRequest,
    DocumentSchema,
    DocumentGroupUpdateSchema,
    RenameRequest,
)

ICON_MAP = [
    [".pdf","file-pdf.svg"],
    [".xml",".html","file-xml.svg"],
    ["dir","file-dir.svg"],
    [".bin",".exe","file-bin.svg"],
    [".c",".cpp",".py",".cs",".js",".ts","file-code.svg"],
    [".jpg",".jpeg",".png",".webp","file-image.svg"],
    [".avi",".mp3",".mp4",".m3u","file-video.svg"],
]

router = APIRouter()
ICON_DIR = Path("app/static/icons")
UPLOAD_DIR = Path(config.data_dir, "uploaded")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
FILE_NOT_FOUND_EXC = HTTPException(status_code=404, detail="File not found")


def icon_filename(ext):
    for ext_list in ICON_MAP:
        if ext in ext_list:
            return ext_list[-1]
    return "file-text.svg"


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


def _doc_to_schema(doc: Document) -> DocumentSchema:
    file_path = Path(doc.filepath)
    filesize_str = get_formatted_size(doc.filesize) if doc.filesize else ""
    modified_at = None
    if file_path.exists():
        modified_at = datetime.fromtimestamp(file_path.stat().st_mtime)
    return DocumentSchema(
        id=doc.id,
        filename=doc.filename,
        filepath=doc.filepath,
        filesize=filesize_str,
        category=doc.category,
        is_starred=doc.is_starred,
        tags=doc.tags,
        description=doc.description,
        created_at=doc.created_at,
        modified_at=modified_at,
    )


@router.get("/documents", response_model=List[DocumentSchema])
async def document_list(
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    query = select(Document).filter(Document.deleted_at == None)
    query = apply_authorized_filter(query, Document, user)
    result = await db.execute(query)
    docs = result.scalars().all()
    return [_doc_to_schema(d) for d in docs]


@router.post("/documents/upload", response_model=List[DocumentSchema])
async def upload_files(
    files: list[UploadFile] = File(...),
    group_id: Optional[int] = None,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    effective_group = resolve_group_id(group_id, group_id is not None, user)
    created_docs = []
    for file in files:
        store_filepath = UPLOAD_DIR / file.filename
        store_filepath = get_unique_filename(store_filepath)

        with open(store_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        filesize = store_filepath.stat().st_size
        doc = Document(
            filename=store_filepath.name,
            filepath=str(store_filepath),
            filesize=filesize,
            created_by=user.id,
            group_id=effective_group,
        )
        db.add(doc)
        created_docs.append((doc, store_filepath))

    await db.commit()
    for doc, _ in created_docs:
        await db.refresh(doc)

    return [_doc_to_schema(doc) for doc, _ in created_docs]


@router.get("/documents/thumbnail/{filename}")
async def get_thumbnail(
    filename: str,
    width: int = 100,
    height: int = 100,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Document).where(Document.filename == filename, Document.deleted_at == None))
    doc = result.scalars().first()
    if not doc or not is_authorized(doc, user):
        raise FILE_NOT_FOUND_EXC

    file_path = Path(doc.filepath)
    if not file_path.exists():
        raise FILE_NOT_FOUND_EXC

    ext = file_path.suffix.lower()
    if ext in [".jpg", ".jpeg", ".png", ".webp"]:
        width = width if width > 10 else 10
        height = height if height > 10 else 10
        with Image.open(file_path) as img:
            img.thumbnail((width, height))
            buf = io.BytesIO()
            img.save(buf, format="WEBP")
            return Response(
                content=buf.getvalue(),
                media_type="image/webp",
            )
    return FileResponse(ICON_DIR / icon_filename(ext))


@router.get("/documents/view/{filename}", response_class=FileResponse)
async def view_file(
    filename: str,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Document).where(Document.filename == filename, Document.deleted_at == None))
    doc = result.scalars().first()
    if not doc or not is_authorized(doc, user):
        raise FILE_NOT_FOUND_EXC

    file_path = Path(doc.filepath)
    if not file_path.exists():
        raise FILE_NOT_FOUND_EXC

    media_type, _ = mimetypes.guess_type(file_path)
    headers = {"Content-Disposition": f"inline; filename={file_path.name}"}
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
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Document).where(Document.filename == filename, Document.deleted_at == None))
    doc = result.scalars().first()
    if not doc or not is_authorized(doc, user):
        raise FILE_NOT_FOUND_EXC

    file_path = Path(doc.filepath)
    if not file_path.exists():
        raise FILE_NOT_FOUND_EXC

    media_type, _ = mimetypes.guess_type(file_path)
    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type=media_type or "application/octet-stream"
    )


@router.patch("/documents/{document_id}/group", response_model=DocumentSchema)
async def update_document_group(
    document_id: int,
    body: DocumentGroupUpdateSchema,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Document).where(Document.id == document_id, Document.deleted_at == None))
    doc = result.scalars().first()
    if not doc or not is_authorized(doc, user):
        raise FILE_NOT_FOUND_EXC
    doc.group_id = resolve_group_id(body.group_id, True, user)
    doc.updated_by = user.id
    await db.commit()
    await db.refresh(doc)
    return _doc_to_schema(doc)


@router.patch("/documents", response_model=DocumentSchema)
async def update_filename(
    doc_req: RenameRequest,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Document).where(Document.filename == doc_req.filename, Document.deleted_at == None))
    doc = result.scalars().first()
    if not doc or not is_authorized(doc, user):
        raise FILE_NOT_FOUND_EXC

    old_path = Path(doc.filepath)
    if not old_path.exists():
        raise FILE_NOT_FOUND_EXC

    new_path = UPLOAD_DIR / doc_req.new_filename
    old_path.rename(new_path)

    doc.filename = doc_req.new_filename
    doc.filepath = str(new_path)
    doc.updated_by = user.id
    await db.commit()
    await db.refresh(doc)
    return _doc_to_schema(doc)


@router.delete("/documents", response_model=DocumentSchema)
async def delete_file(
    doc_req: DocumentRequest,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(Document).where(Document.filename == doc_req.filename, Document.deleted_at == None))
    doc = result.scalars().first()
    if not doc or not is_authorized(doc, user):
        raise FILE_NOT_FOUND_EXC

    file_path = Path(doc.filepath)
    if file_path.exists():
        file_path.unlink()

    doc.deleted_by = user.id
    doc.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(doc)
    return _doc_to_schema(doc)
