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

Production Run

```
uv run uvicorn app.app:app --host 0.0.0.0 --port 8000
```

- Browse: http://localhost:8000

## React Frontend

Install Node.JS v24 LTS and above

https://nodejs.org/en/download

Environment setup

```
cd frontend
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

## Linux Systemd Service

Create a systemd service

```
sudo cp script/dashboard.service /etc/systemd/system/dashboard-daemon.service
sudo systemctl daemon-reload
sudo systemctl restart dashboard-daemon.service
```
