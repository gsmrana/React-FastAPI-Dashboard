import os
import sys
import time
import shutil
import logging
import platform
from pathlib import Path
from datetime import datetime
from fastapi import ( 
    FastAPI, Request, HTTPException,
    status, UploadFile, Depends, Form, File,
)
from fastapi.responses import (
    HTMLResponse, RedirectResponse, FileResponse,
    JSONResponse, PlainTextResponse, StreamingResponse
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from openai import AzureOpenAI

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(filename)s:%(lineno)d - %(message)s",
    level=logging.INFO,
    datefmt="%Y-%m-%d %H:%M:%S"
)

from app.core.config import config
from app.core.auth import auth_manager
from app.models.uimodels import UploadResponse
from app.db.database import SessionLocal, engine
from app.db.models import (
    Base, User, UserContent
)


REACT_BUILD_DIR = Path(__file__).parent / "static"
JINJA_TEMPLATE_DIR = Path(__file__).parent / "templates"

async def lifespan(app: FastAPI):
    global vector_store
    vector_store = True
    logging.info(f"{config.APP_NAME} {config.APP_VERSION}")
    logging.info(f"APP_PORT: {config.APP_PORT}, DEBUG: {config.APP_DEBUG}, " + 
                f"LOG_LEVEL: {config.LOG_LEVEL}, ENV: {config.ENV_PATH}")
    logging.info(f"Serving React build from: {REACT_BUILD_DIR}")
    logging.info(f"Serving Jinja templates from: {JINJA_TEMPLATE_DIR}")
    logging.info(f"✅ FastAPI app started successfully.")
    logging.getLogger().setLevel(config.LOG_LEVEL)
    yield
    print(f"{config.APP_NAME} app exited.")

app = FastAPI(title=config.APP_NAME, version=config.APP_VERSION, lifespan=lifespan)
app.mount("/assets", StaticFiles(directory=str(REACT_BUILD_DIR / "assets")), name="assets")
templates = Jinja2Templates(directory=str(JINJA_TEMPLATE_DIR))
app.add_middleware(
    CORSMiddleware, 
    allow_credentials=True,
    allow_origins=['*'], 
    allow_methods=['*'], 
    allow_headers=['*'])

Base.metadata.create_all(bind=engine)
webpad_storage_text = ""
aiclient = AzureOpenAI(
    azure_endpoint=config.AZUREAI_ENDPOINT_URL,
    api_key=config.AZUREAI_ENDPOINT_KEY,
    api_version=config.AZUREAI_API_VERSION,
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/health")
async def health_check():
    return {
        "app_name": config.APP_NAME,
        "app_version": config.APP_VERSION,
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
    }

# serve React frontend app
# @app.get("/{full_path:path}")
# async def serve_react_app(full_path: str):
#     if "." in full_path: # file request 
#         file_path = REACT_BUILD_DIR / full_path
#         if file_path.exists():
#             return FileResponse(file_path)
#     # serve index.html (for React Router)
#     return FileResponse(str(REACT_BUILD_DIR / "index.html"))

@app.get("/", response_class=HTMLResponse)
async def home_page(
    request: Request,
    db: Session = Depends(get_db)
):
    user = auth_manager.get_current_user(request, db)
    return templates.TemplateResponse("index.htm", {
        "request": request, 
        "user": user
    })

@app.get("/login", response_class=HTMLResponse)
async def login_page(
    request: Request, 
    back_url: str="/",
    db: Session = Depends(get_db),
):
    if back_url != "/":
        user = auth_manager.get_current_user(request, db)
        if user:
            return RedirectResponse(url=back_url, status_code=status.HTTP_302_FOUND)
    return templates.TemplateResponse("login.htm", {
        "request": request, 
        "back_url": back_url, 
        "msg": ""
    })

@app.post("/login", response_class=RedirectResponse)
async def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    remember: str = Form(None),
    back_url: str = Form("/"),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == username).first()
    if not user or not auth_manager.verify_password(password, user.hashed_password):
        return templates.TemplateResponse("login.htm", {"request": request, "msg": "Invalid credentials"})    
    response = RedirectResponse(url=back_url, status_code=status.HTTP_302_FOUND)    
    auth_manager.login_user(response, username, remember=(remember == "yes"))
    return response

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("register.htm", {
        "request": request, 
        "msg": "",
        "title": "Register",
    })

@app.post("/register", response_class=RedirectResponse)
async def register(
    request: Request, 
    username: str = Form(...), 
    password: str = Form(...), 
    db: Session = Depends(get_db)
):
    if db.query(User).filter(User.username == username).first():
        return templates.TemplateResponse("register.htm", {
            "request": request,
            "msg": "User exists", 
            "title": "Register",
        })
    new_user = User(username=username, hashed_password=auth_manager.hash_password(password))
    db.add(new_user)
    db.commit()
    return RedirectResponse("/login", status_code=status.HTTP_302_FOUND)

@app.get("/logout", response_class=RedirectResponse)
async def logout():
    response = RedirectResponse("/", status_code=status.HTTP_302_FOUND)
    auth_manager.logout_user(response)
    return response

@app.get("/users", response_class=HTMLResponse)
async def users_page(
    request: Request, db: 
    Session = Depends(get_db)
):
    user = auth_manager.get_current_user(request, db)
    if not user:
        return RedirectResponse(url=f"/login?back_url={request.url.path}")
    users = db.query(User).all()
    db.commit()
    return templates.TemplateResponse("users.htm", {
        "request": request,
        "user": user,
        "users": users
        })

@app.get("/user/update/{user_id}", response_class=HTMLResponse)
async def user_update_page(
    user_id: int, 
    request: Request, 
    db: Session = Depends(get_db)
):
    user = auth_manager.get_current_user(request, db)
    if not user:
        return RedirectResponse(url="/login") 
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return templates.TemplateResponse("register.htm", {
        "request": request, 
        "user": user,
        "title": "Update",
    })

@app.post("/user/update", response_class=RedirectResponse)
async def user_update(
    request: Request, 
    user_id: int = Form(...), 
    username: str = Form(...), 
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = auth_manager.get_current_user(request, db)
    if not user:
        return RedirectResponse(url="/login")    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.username = username
    user.hashed_password=auth_manager.hash_password(password)
    db.commit()
    return RedirectResponse("/users", status_code=status.HTTP_303_SEE_OTHER)

@app.get("/user/delete/{user_id}", response_class=RedirectResponse)
async def user_delete(
    user_id: str,
    request: Request, 
    db: Session = Depends(get_db)
):
    user = auth_manager.get_current_user(request, db)
    if not user:
        return RedirectResponse(url="/login")    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    db.delete(user)
    db.commit()
    return RedirectResponse("/users", status_code=status.HTTP_302_FOUND)

@app.get("/environment", response_class=HTMLResponse)
async def settings_page(
    request: Request, 
    db: Session = Depends(get_db)
):
    user = auth_manager.get_current_user(request, db)
    if not user:
        return RedirectResponse(url=f"/login?back_url={request.url.path}")
    return templates.TemplateResponse("datatable.htm", {
        "request": request,
        "user": user,
        "title": "Environment Info",
        "datatable": config.to_json()
    })
    
@app.get("/system", response_class=HTMLResponse)
async def system_page(
    request: Request, 
    db: Session = Depends(get_db)
):
    user = auth_manager.get_current_user(request, db)
    if not user:
        return RedirectResponse(url=f"/login?back_url={request.url.path}")  
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
        "user": user,
        "title": "System Info",
        "datatable": sys_info
    })

@app.get("/upload", response_class=HTMLResponse)
async def upload_page(
    request: Request, 
    db: Session = Depends(get_db)
):
    user = auth_manager.get_current_user(request, db)
    if not user:
        return RedirectResponse(url=f"/login?back_url={request.url.path}")
    filenames = [
        p.name for p in Path(config.UPLOAD_DIR).iterdir() 
        if not p.name.startswith('.')
    ]
    return templates.TemplateResponse("upload.htm", {
        "request": request,
        "user": user,
        "filenames": filenames,
        "username": user.username,
    })
    
def copy_uploaded_files(files):
    filenames = []
    for file in files:
        # rename if file already exists
        file_path = Path(config.UPLOAD_DIR) / file.filename
        if file_path.exists():
            newname = f"{file_path.stem} - {int(time.time()) }{file_path.suffix}"      
            file_path = Path(config.UPLOAD_DIR) / newname

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        filenames.append(file.filename)
    return filenames
    
@app.post("/file/upload", response_class=HTMLResponse)
async def handle_upload(
    request: Request,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    user = auth_manager.get_current_user(request, db)
    if not user:
        return RedirectResponse(url="/login")
    uploaded_names = copy_uploaded_files(files)
    files_list = [
        p.name for p in Path(config.UPLOAD_DIR).iterdir() 
        if not p.name.startswith('.')
    ]
    return templates.TemplateResponse("upload.htm", {
        "request": request,
        "user": user,
        "message": f"Uploaded: {', '.join(uploaded_names)}",
        "filenames": files_list,
    })

@app.post("/public/file/upload", response_class=JSONResponse)
async def handle_upload_public(
    request: Request,
    files: list[UploadFile] = File(...)
):
    copy_uploaded_files(files)
    return {"detail": "ok"}
    
@app.get("/file/download/{filename}", response_class=FileResponse)
async def get_file(
    filename: str,
    request: Request = None,
    db: Session = Depends(get_db),
):
    user = auth_manager.get_current_user(request, db)
    if not user:
        return JSONResponse(
            content={"detail": "Not Authorized"},
            status_code=status.HTTP_401_UNAUTHORIZED)
    file_path = Path(config.UPLOAD_DIR) / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, filename=filename)

@app.get("/file/delete/{filename}", response_class=RedirectResponse)
async def delete_file(
    filename: str,
    request: Request = None,
    db: Session = Depends(get_db)
):
    user = auth_manager.get_current_user(request, db)
    if not user:
        return JSONResponse(
            content={"detail": "Not Authorized"},
            status_code=status.HTTP_401_UNAUTHORIZED)
    file_path = Path(config.UPLOAD_DIR) / filename
    if file_path.exists():
        file_path.unlink()
    return RedirectResponse(url="/upload", status_code=302)

@app.get("/webpad", response_class=HTMLResponse)
async def webpad_page(
    request: Request,
    db: Session = Depends(get_db)
):
    user = auth_manager.get_current_user(request, db)
    return templates.TemplateResponse("webpad.htm", {
        "request": request,
        "user": user,
        "text": webpad_storage_text
    })

@app.post("/webpad/save", response_class=RedirectResponse)
async def webpad_save(textarea: str = Form(...)):
    global webpad_storage_text
    webpad_storage_text = textarea
    return RedirectResponse("/webpad", status_code=status.HTTP_303_SEE_OTHER)

@app.post("/webpad/clear", response_class=RedirectResponse)
async def webpad_clear():
    global webpad_storage_text
    webpad_storage_text = ""
    return RedirectResponse("/webpad", status_code=status.HTTP_303_SEE_OTHER)

@app.post("/api/webpad", response_class=JSONResponse)
async def webpad_save(
    request: Request,
    userContent: UserContent,
    db: Session = Depends(get_db)
):
    user = auth_manager.get_current_user(request, db)
    if not user:
        return JSONResponse(
            content={"detail": "Not Authorized"},
            status_code=status.HTTP_401_UNAUTHORIZED)
    global webpad_storage_text
    webpad_storage_text = userContent.text
    return {"reply": "ok"}

@app.get("/chatbot", response_class=HTMLResponse)
async def chat_page(
    request: Request, 
    db: Session = Depends(get_db)
):
    user = auth_manager.get_current_user(request, db)
    if not user:
        return RedirectResponse(url=f"/login?back_url={request.url.path}")
    return templates.TemplateResponse("chatbot.htm", {
        "request": request,
        "user": user,
    })

@app.post('/api/chat')
async def chat_endpoint(
    request: Request,
    userContent: UserContent,
    db: Session = Depends(get_db)
):
    if not userContent.text.strip():
        raise HTTPException(
            detail='Empty prompt!', 
            status_code=status.HTTP_400_BAD_REQUEST)
    user = auth_manager.get_current_user(request, db)
    if not user:
        return JSONResponse(
            content={"detail": "Not Authorized"},
            status_code=status.HTTP_401_UNAUTHORIZED)
    response = aiclient.chat.completions.create(
        model=config.AZUREAI_DEPLOYMENT,
        messages=[
            { "role": "system", "content": "You are a helpful assistant." },
            { "role": "user", "content": userContent.text }
        ],
        max_tokens=4096,
        temperature=1.0,
        top_p=1.0
    )    
    content = "No response!"
    if response.choices:
        content = response.choices[0].message.content
    return content

@app.post('/api/chat-stream')
async def chat_stream_endpoint(
    request: Request,
    userContent: UserContent,
    db: Session = Depends(get_db)
):
    if not userContent.text.strip():
        raise HTTPException(
            detail='Empty prompt!', 
            status_code=status.HTTP_400_BAD_REQUEST)
    user = auth_manager.get_current_user(request, db)
    if not user:
        return JSONResponse(
            content={"detail": "Not Authorized"},
            status_code=status.HTTP_401_UNAUTHORIZED)        
    
    def chat_stream():
        response = aiclient.chat.completions.create(
            model=config.AZUREAI_DEPLOYMENT,
            messages=[
                { "role": "system", "content": "You are a helpful assistant." },
                { "role": "user", "content": userContent.text }
            ],
            max_tokens=4096,
            temperature=1.0,
            top_p=1.0,
            stream=True
        )         
        for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                yield content   # plain fetch-stream  
            
    return StreamingResponse(
        chat_stream(),
        media_type="text/plain")


# Entry point of this script run
if __name__ == "__main__":
    import uvicorn
    logging.info(f"{config.APP_NAME} listening on http://localhost:{config.APP_PORT}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(config.APP_PORT), reload=config.APP_DEBUG)
