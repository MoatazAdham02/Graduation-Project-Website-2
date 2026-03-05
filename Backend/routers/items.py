from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime

from database import get_db

router = APIRouter(prefix="/api/items", tags=["items"])

class ItemCreate(BaseModel):
    name: str
    description: str = ""

@router.get("")
async def list_items():
    db = get_db()
    cursor = db.items.find().sort("createdAt", -1)
    items = []
    async for doc in cursor:
        items.append({
            "_id": str(doc["_id"]),
            "name": doc.get("name", ""),
            "description": doc.get("description", ""),
            "createdAt": doc.get("createdAt"),
        })
    return items

@router.post("")
async def create_item(body: ItemCreate):
    if not (body.name and body.name.strip()):
        raise HTTPException(400, "name is required")
    db = get_db()
    doc = {
        "name": body.name.strip(),
        "description": (body.description or "").strip(),
        "createdAt": datetime.utcnow(),
    }
    r = await db.items.insert_one(doc)
    return {
        "_id": str(r.inserted_id),
        "name": doc["name"],
        "description": doc["description"],
        "createdAt": doc["createdAt"],
    }
