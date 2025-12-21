import sys
import platform
from pathlib import Path
from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import select, Column
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.core.users import current_active_user
from app.db.database import get_db
from app.models.tables import User


JINJA_TEMPLATE_DIR = Path("app/templates")

router = APIRouter()
templates = Jinja2Templates(directory=str(JINJA_TEMPLATE_DIR))


@router.get("/home", response_class=HTMLResponse)
async def home_page(
    request: Request, 
):
    return templates.TemplateResponse("index.htm", {
        "request": request, 
        "user": "Guest"
    })

@router.get("/login", response_class=HTMLResponse)
async def login_page(
    request: Request, 
    back_url: str="/pages/home",
):
    return templates.TemplateResponse("login.htm", {
        "request": request, 
        "back_url": back_url, 
        "msg": ""
    })

@router.get("/register", response_class=HTMLResponse)
async def register_page(
    request: Request
):
    return templates.TemplateResponse("register.htm", {
        "request": request, 
        "msg": "",
        "title": "Register",
    })

@router.get("/users", response_class=HTMLResponse)
async def user_list_page(
    request: Request, 
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User, Column("email"))
    )
    users = result.all()
    return templates.TemplateResponse("users.htm", {
        "request": request,
        "user": user.email.split("@")[0],
        "users": users,
        })

@router.get("/user/update/{user_id}", response_class=HTMLResponse)
async def user_update_page(
    user_id: int, 
    request: Request, 
    user: User = Depends(current_active_user),
):
    return templates.TemplateResponse("register.htm", {
        "request": request, 
        "user": user.email.split("@")[0],
        "title": "Update",
    })

@router.get("/config", response_class=HTMLResponse)
async def config_page(
    request: Request, 
    user: User = Depends(current_active_user),
):
    return templates.TemplateResponse("datatable.htm", {
        "request": request,
        "user": user.email.split("@")[0],
        "title": "Environment Info",
        "datatable": config.to_json()
    })
    
@router.get("/system", response_class=HTMLResponse)
async def system_page(
    request: Request, 
    user: User = Depends(current_active_user),
):
    sys_info = {
        "Node": platform.node(),
        "Platform": sys.platform,
        "OS": platform.platform(),
        "Version": platform.version(),
        "Arch": platform.machine(),
        "CPU": platform.processor(),  
        "Python": platform.python_version(),
    }    
    return templates.TemplateResponse("datatable.htm", {
        "request": request,
        "user": user.email.split("@")[0],
        "title": "System Info",
        "datatable": sys_info
    })

@router.get("/document", response_class=HTMLResponse)
async def document_page(
    request: Request, 
    user: User = Depends(current_active_user),
):
    filenames = [
        p.name for p in Path(config.UPLOAD_DIR).iterdir() 
        if not p.name.startswith('.')
    ]
    return templates.TemplateResponse("document.htm", {
        "request": request,
        "user": user.email.split("@")[0],
        "filenames": filenames,
    })

@router.get("/chatbot", response_class=HTMLResponse)
async def chatbot_page(
    request: Request, 
    user: User = Depends(current_active_user),
):
    return templates.TemplateResponse("chatbot.htm", {
        "request": request,
        "user": user.email.split("@")[0],
    })

@router.get("/notepad", response_class=HTMLResponse)
async def notepad_page(
    request: Request,
    user: User = Depends(current_active_user),
):
    return templates.TemplateResponse("notepad.htm", {
        "request": request,
        "user": user.email.split("@")[0],
    })
