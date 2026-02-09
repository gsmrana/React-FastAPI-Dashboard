from pathlib import Path
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.core.users import current_active_user
from app.models.user import User


BASE_TEMPLATE_DIR = Path("app/templates")

router = APIRouter()
templates = Jinja2Templates(directory=str(BASE_TEMPLATE_DIR))


# ---------------- Serve Public Pages ----------------
@router.get("/public/{pagename}", response_class=HTMLResponse)
async def public_page(
    request: Request,
    pagename: str,
):
    template_name = f"public/{pagename}.html"
    if not (BASE_TEMPLATE_DIR / template_name).exists():
        raise HTTPException(status_code=404, detail="Page not found")
    
    return templates.TemplateResponse(
        request=request,
        name=template_name, 
        context={"request": request}
    )

# ---------------- Serve Private Pages ----------------
@router.get("/private/{pagename}", response_class=HTMLResponse)
async def private_page(
    request: Request,
    pagename: str,
    user: User = Depends(current_active_user)
):
    template_name = f"private/{pagename}.html"
    if not (BASE_TEMPLATE_DIR / template_name).exists():
        raise HTTPException(status_code=404, detail="Page not found")
    
    return templates.TemplateResponse(
        request=request,
        name=template_name, 
        context={"request": request}
    )
