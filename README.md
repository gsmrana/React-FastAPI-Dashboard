# React FastAPI Dashboard

A React and FastAPI based Dashboard Web Application.

## FastAPI Backend + Jinja2 Frontend

Install UV (Python package manager)

https://docs.astral.sh/uv/getting-started/installation

Environment setup

```
uv python install
uv sync
```

Development Run

```
uv run fastapi run app/main.py --reload
```

Production Run

```
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Navigate to: http://localhost:8000

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

Navigate to: http://localhost:3000

Production Build

```
npm run build
```

Copy build to backend app

```
cp -r dist/* ../app/static/
```

## Linux Web Service

Create a systemd service and run it.

```
sudo cp script/dashboard.service /etc/systemd/system/dashboard-daemon.service
sudo systemctl daemon-reload
sudo systemctl restart dashboard-daemon.service
```
