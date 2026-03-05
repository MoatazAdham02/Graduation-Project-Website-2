import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database import get_client
from routers import auth, scan, items

@asynccontextmanager
async def lifespan(app: FastAPI):
    get_client().get_default_database()
    yield
    # optional: close client

app = FastAPI(title="COROnet API", lifespan=lifespan)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, list) and detail:
        detail = detail[0].get("msg", str(detail[0])) if isinstance(detail[0], dict) else str(detail[0])
    elif not isinstance(detail, str):
        detail = str(detail) if detail else "Error"
    return JSONResponse(status_code=exc.status_code, content={"error": detail})

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin] if settings.cors_origin else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    try:
        db = get_client().get_default_database()
        await db.command("ping")
        return {"ok": True, "database": "connected", "databaseOk": True}
    except Exception as e:
        return {"ok": False, "database": str(e), "databaseOk": False}

app.include_router(auth.router)
app.include_router(scan.router)
app.include_router(items.router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
