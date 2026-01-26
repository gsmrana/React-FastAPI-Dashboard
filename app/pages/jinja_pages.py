from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.core.users import current_active_user
from app.models.user import User


router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


# ---------------- Public Pages ----------------

@router.get("/home", response_class=HTMLResponse)
async def register_page(
    request: Request
):
    return templates.TemplateResponse(
        "index.htm", {
        "request": request,
    })

@router.get("/login", response_class=HTMLResponse)
async def login_page(
    request: Request
):
    return templates.TemplateResponse(
        "login.htm", {
        "request": request,
    })

@router.get("/register", response_class=HTMLResponse)
async def register_page(
    request: Request
):
    return templates.TemplateResponse(
        "register.htm", {
        "request": request,
    })


# ---------------- Protected Pages ----------------

@router.get("/document", response_class=HTMLResponse)
async def document_page(
    request: Request, 
    user: User = Depends(current_active_user),
):
    return templates.TemplateResponse(
        "document.htm", {
        "request": request,
    })

@router.get("/chatbot", response_class=HTMLResponse)
async def chatbot_page(
    request: Request, 
    user: User = Depends(current_active_user),
):
    return templates.TemplateResponse(
        "chatbot.htm", {
        "request": request,
    })

@router.get("/notepad", response_class=HTMLResponse)
async def notepad_page(
    request: Request,
    user: User = Depends(current_active_user),
):
    return templates.TemplateResponse(
        "notepad.htm", {
        "request": request,
    })

@router.get("/users", response_class=HTMLResponse)
async def user_list_page(
    request: Request, 
    user: User = Depends(current_active_user),
):
    return templates.TemplateResponse(
        "users.htm", {
        "request": request,
    })

@router.get("/appconfig", response_class=HTMLResponse)
async def config_page(
    request: Request, 
    user: User = Depends(current_active_user),
):
    return templates.TemplateResponse(
        "datatable.htm", {
        "request": request,
        "title": "Configurations",
    })
    
@router.get("/sysinfo", response_class=HTMLResponse)
async def system_page(
    request: Request, 
    user: User = Depends(current_active_user),
):  
    return templates.TemplateResponse(
        "datatable.htm", {
        "request": request,
        "title": "System Info",
    })
