import uvicorn
from app.core.config import config

# quick development run
if __name__ == "__main__":
    print(f"App listening on http://localhost:{config.app_port}")
    uvicorn.run("app.app:app", 
                host="0.0.0.0", 
                port=config.app_port, 
                reload=config.app_debug, 
                reload_dirs=["app"],
    )
