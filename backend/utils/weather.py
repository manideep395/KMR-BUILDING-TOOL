import httpx
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
with open(DATA_DIR / "material_prices.json") as f:
    PRICES_DB = json.load(f)

CITY_COORDS = PRICES_DB.get("city_coordinates", {})

OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"


async def get_city_coordinates(city: str):
    if city in CITY_COORDS:
        return CITY_COORDS[city]["lat"], CITY_COORDS[city]["lon"]
    return 17.385, 78.486  # default Hyderabad


async def get_weather_forecast(city: str, forecast_days: int = 16):
    """Fetch precipitation forecast from Open-Meteo API."""
    try:
        lat, lon = await get_city_coordinates(city)
        url = f"{OPEN_METEO_BASE}?latitude={lat}&longitude={lon}&daily=precipitation_sum&forecast_days={forecast_days}&timezone=Asia%2FKolkata"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                daily = data.get("daily", {})
                precip = daily.get("precipitation_sum", [])
                rain_days = sum(1 for p in precip if p and p > 1.0)
                return {
                    "rain_days_forecast": rain_days,
                    "forecast_days": forecast_days,
                    "precipitation_data": precip,
                    "city": city,
                    "lat": lat,
                    "lon": lon,
                }
    except Exception as e:
        pass
    return {
        "rain_days_forecast": 2,
        "forecast_days": forecast_days,
        "precipitation_data": [],
        "city": city,
        "error": "Weather API unavailable, using estimate",
    }
