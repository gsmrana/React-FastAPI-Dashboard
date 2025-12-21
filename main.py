import uvicorn
from app.core.config import config

# quick development run
if __name__ == "__main__":
    print(f"App listening on http://localhost:{config.APP_PORT}")
    uvicorn.run("app.app:app", 
                host="0.0.0.0", 
                port=int(config.APP_PORT), 
                reload=config.APP_DEBUG, 
                reload_dirs=["app"],
    )
