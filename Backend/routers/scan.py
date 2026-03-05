import os
import re
from pathlib import Path
from datetime import datetime
import time

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from bson import ObjectId

from config import settings
from database import get_db

router = APIRouter(prefix="/api/scan", tags=["scan"])

UPLOAD_DIR = Path(settings.upload_dir).resolve()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_SIZE = 500 * 1024 * 1024  # 500 MB
ALLOWED_EXT = (".dcm", ".dicom")
ALLOWED_MIME = "application/dicom"

def _allowed_file(filename: str, content_type: str | None) -> bool:
    if filename:
        ext = os.path.splitext(filename)[1].lower()
        if ext in ALLOWED_EXT:
            return True
    if content_type and content_type.strip().lower() == ALLOWED_MIME:
        return True
    return False

@router.get("")
async def list_scans():
    db = get_db()
    cursor = db.scans.find().sort("createdAt", -1)
    scans = []
    async for s in cursor:
        scans.append({
            "id": str(s["_id"]),
            "originalName": s.get("originalName", ""),
            "size": s.get("size", 0),
            "createdAt": s.get("createdAt"),
        })
    return scans

@router.get("/{id}")
async def get_scan(id: str):
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(404, "Scan not found")
    db = get_db()
    scan = await db.scans.find_one({"_id": oid})
    if not scan:
        raise HTTPException(404, "Scan not found")
    return {
        "id": str(scan["_id"]),
        "originalName": scan.get("originalName", ""),
        "size": scan.get("size", 0),
        "mimeType": scan.get("mimeType", "application/dicom"),
        "createdAt": scan.get("createdAt"),
    }

@router.get("/{id}/file")
async def get_scan_file(id: str):
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(404, "Scan not found")
    db = get_db()
    scan = await db.scans.find_one({"_id": oid})
    if not scan:
        raise HTTPException(404, "Scan not found")
    path = Path(scan["path"])
    if not path.is_absolute():
        path = UPLOAD_DIR / path
    else:
        path = Path(scan["path"])
    if not path.exists():
        raise HTTPException(404, "File not found on disk")
    try:
        path = path.resolve()
        upload_resolved = UPLOAD_DIR.resolve()
        path.relative_to(upload_resolved)
    except ValueError:
        raise HTTPException(403, "Invalid path")
    return FileResponse(
        path,
        media_type=scan.get("mimeType") or "application/dicom",
    )

@router.post("/upload")
async def upload_scan(file: UploadFile = File(...)):
    if not file.filename and not file.content_type:
        raise HTTPException(400, 'No DICOM file uploaded. Use form field "file".')
    if not _allowed_file(file.filename or "", file.content_type):
        raise HTTPException(400, "Only DICOM files (.dcm, .dicom) are allowed")
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(400, "File too large")
    safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", file.filename or "scan")
    safe_name = f"{int(time.time() * 1000)}-{safe_name}"
    dest = UPLOAD_DIR / safe_name
    dest.write_bytes(content)
    db = get_db()
    doc = {
        "originalName": file.filename or "scan",
        "path": str(dest.resolve()),
        "size": len(content),
        "mimeType": file.content_type or "application/dicom",
        "createdAt": datetime.utcnow(),
    }
    r = await db.scans.insert_one(doc)
    return {
        "ok": True,
        "uploaded": [
            {
                "id": str(r.inserted_id),
                "originalName": doc["originalName"],
                "size": doc["size"],
                "createdAt": doc["createdAt"],
            }
        ],
    }
}
