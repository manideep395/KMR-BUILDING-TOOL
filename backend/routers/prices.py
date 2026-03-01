import json
from fastapi import APIRouter
from pathlib import Path

router = APIRouter()
DATA_DIR = Path(__file__).parent.parent / "data"


@router.get("/prices/{city}")
async def get_prices(city: str):
    with open(DATA_DIR / "material_prices.json") as f:
        db = json.load(f)
    cities = db["cities"]
    if city in cities:
        data = cities[city].copy()
        data["city"] = city
        data["last_updated"] = db.get("last_updated", "2025-03-01")
    else:
        # fallback: first city
        city_key = list(cities.keys())[0]
        data = cities[city_key].copy()
        data["city"] = city
        data["note"] = f"Using {city_key} prices as closest match"
        data["last_updated"] = db.get("last_updated", "2025-03-01")
    return data


@router.get("/prices")
async def get_all_prices():
    with open(DATA_DIR / "material_prices.json") as f:
        db = json.load(f)
    return {"cities": list(db["cities"].keys()), "data": db["cities"], "last_updated": db.get("last_updated")}
