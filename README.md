# FastAPI Dashboard
A FastAPI based dashboard WebApp.

## Install Python package manager UV
https://docs.astral.sh/uv/getting-started/installation

Linux
```
sudo apt install python3 python3-pip python3-venv -y
```

## Environment setup (UV)

Setup packages
```
uv sync
cd frontend
npm install
```

## Environment setup (pip)
1. Install required packages in a Python virtual environment.

Windows
```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Linux
```
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r requirements.txt
```

## Run the WebApp
1. Test the standalone app from the command line.

Run backend
```
uv run fastapi run app/main.py --host 0.0.0.0 --port 3000 --reload
or
uv run uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload

```

Run frontend (React)
```
cd frontend
npm run build
npm run dev

```

2. Create a systemd daemon and run it.
```
sudo cp script/dashboard.service /etc/systemd/system/dashboard-daemon.service
sudo systemctl daemon-reload
sudo systemctl restart dashboard-daemon.service
```

3. Navigate to: http://localhost:3000
