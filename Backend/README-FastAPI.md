# Running the FastAPI backend

The same API (auth, scan, items, health) is available as a **FastAPI** app so you can use Python instead of Node.

## Setup

From the `Backend` folder:

```bash
# Create a virtual environment (recommended)
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements-fastapi.txt
```

## Environment

Use the same `.env` as the Node backend (same `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`). Optional:

- `PORT` — default `8000`. Use `4000` if you want the frontend to work without changing `VITE_API_URL`.
- `UPLOAD_DIR` — directory for DICOM uploads (default `uploads/dicom`).

## Run

From the `Backend` folder:

```bash
# Default port 8000 — then set frontend VITE_API_URL=http://localhost:8000
uvicorn main:app --reload

# Or port 4000 — works with default frontend (VITE_API_URL=http://localhost:4000)
# Windows (PowerShell)
$env:PORT=4000; uvicorn main:app --reload
# Windows (CMD)
set PORT=4000 && uvicorn main:app --reload
# macOS/Linux
PORT=4000 uvicorn main:app --reload
```

API docs: **http://localhost:8000/docs** (or the port you use).

## Endpoints (same as Node)

- `GET /api/health` — health + DB status  
- `POST /api/auth/register` — register  
- `POST /api/auth/login` — login  
- `GET /api/auth/me` — current user (Bearer token)  
- `GET /api/scan` — list scans  
- `GET /api/scan/{id}` — scan metadata  
- `GET /api/scan/{id}/file` — DICOM file  
- `POST /api/scan/upload` — upload DICOM (form field `file`)  
- `GET /api/items`, `POST /api/items` — items CRUD  

Run **either** the Node server or the FastAPI app (same MongoDB and `.env`); don’t run both on the same port.
