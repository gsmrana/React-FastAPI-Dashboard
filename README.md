# React FastAPI Dashboard

A React and FastAPI based Dashboard Web Application.

## FastAPI Backend + Jinja2 Frontend

Install Python and UV Package Manager

https://docs.astral.sh/uv/getting-started/installation

```
winget install --id Python.Python.3.12
winget install --id=astral-sh.uv  -e
```

Install packages in a virtual environment

```
uv sync
cp .env.sample .env
```

Upgrade all packages

```
uv lock --upgrade
uv sync
```

Development Run

```
uv run main.py
```

- Browse: http://localhost:8000

Production Run - uvicorn

```
uv run uvicorn app.app:app --host 0.0.0.0 --port 8000
```

Production Run - Docker

```
docker build -t fastapi-dashboard .
docker run -d -p 8000:8000 --env-file .env --name fastapi-dashboard fastapi-dashboard
```

Production Run - Docker Compose

```
docker compose up
```

## React Frontend

Install Node.JS v24 LTS and above

https://nodejs.org/en/download

```
winget install Volta.Volta
volta install node@24
```

Install packages 

```
cd frontend
cp .env.example .env.local
npm install
```

Development Run

```
npm run dev
```

- Browse: http://localhost:3000

Production Build

```
npm run build
```

Copy build to backend app

```
cp -r -force dist/* ../app/static/
```

## Install and run systemd service (Linux)

Service Setup
```
sudo cp fastapiapp.service /etc/systemd/system/fastapiapp-daemon.service
sudo systemctl daemon-reload
sudo systemctl enable fastapiapp-daemon.service
```

Service Start/Restart
```
sudo systemctl restart fastapiapp-daemon.service
```

## Install and run launchd service (macOS)

Service Setup
```
sudo cp com.fastapiapp.service.plist /Library/LaunchDaemons/
sudo chown root:wheel /Library/LaunchDaemons/com.fastapiapp.service.plist
sudo chmod 644 /Library/LaunchDaemons/com.fastapiapp.service.plist
```

Service First Load
```
sudo launchctl load -w /Library/LaunchDaemons/com.fastapiapp.service.plist
```

Service Stop
```
sudo launchctl bootout system /Library/LaunchDaemons/com.fastapiapp.service.plist
```

Service Restart
```
sudo launchctl kickstart -k system/com.fastapiapp.service
```
