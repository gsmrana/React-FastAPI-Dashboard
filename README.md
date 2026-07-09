# React FastAPI Dashboard

A React and FastAPI based Dashboard Web Application.

## Enviroment Setup

- Install [UV Package Manager](https://docs.astral.sh/uv/getting-started/installation)
- Install [Python 3.12](https://www.python.org/downloads/)


```powershell
winget install --id Python.Python.3.12
winget install --id=astral-sh.uv  -e
```

## FastAPI Backend + Jinja2 Dev Env Setup

Install packages in a virtual environment
```bash
uv sync
cp .env.sample .env
```

Upgrade all packages
```bash
uv lock --upgrade
uv sync
```

Development Run
```bash
uv run main.py
```

- Backend API URL: http://localhost:8000

Production Run - uvicorn
```bash
uv run uvicorn app.app:app --host 0.0.0.0 --port 8000
```

Production Run - Docker
```bash
docker build -t fastapi-dashboard .
docker run -d -p 8000:8000 --env-file .env --name fastapi-dashboard fastapi-dashboard
```

Production Run - Docker Compose
```bash
docker compose up
```

## React Frontend Dev Env Setup

- Install [Node.JS v24](https://nodejs.org/en/download)


```powershell
winget install Volta.Volta
volta install node@24
```

Install packages 
```bash
cd frontend
npm install
```

Development Run

```bash
cp .env.example .env.development (optional)
npm run dev
```

- Frontend URL: http://localhost:3000

Production Build
```bash
cp .env.example .env.production (optional)
npm run build
npm run preview
```

Copy build to backend app
```bash
cp -r -force dist/* ../app/static/
```

## Linux Systemd Service Setup

Install service
```bash
sudo cp fastapiapp.service /etc/systemd/system/fastapiapp-daemon.service
sudo systemctl daemon-reload
sudo systemctl enable fastapiapp-daemon.service
```

Service Start/Restart
```bash
sudo systemctl restart fastapiapp-daemon.service
```

## macOS Launchd Service Setup

Install service
```bash
sudo cp com.fastapiapp.service.plist /Library/LaunchDaemons/
sudo chown root:wheel /Library/LaunchDaemons/com.fastapiapp.service.plist
sudo chmod 644 /Library/LaunchDaemons/com.fastapiapp.service.plist
```

Service First Load
```bash
sudo launchctl load -w /Library/LaunchDaemons/com.fastapiapp.service.plist
```

Service Stop
```bash
sudo launchctl bootout system /Library/LaunchDaemons/com.fastapiapp.service.plist
```

Service Restart
```bash
sudo launchctl kickstart -k system/com.fastapiapp.service
```
