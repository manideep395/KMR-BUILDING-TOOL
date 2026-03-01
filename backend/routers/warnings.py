from fastapi import APIRouter
from models.schemas import WarningsRequest, WarningsResponse
from utils.weather import get_weather_forecast
from datetime import datetime

router = APIRouter()


@router.post("/warnings", response_model=WarningsResponse)
async def get_warnings(request: WarningsRequest):
    warnings = []
    p = request.project
    risk_scores = request.risk_scores or {}

    try:
        current = datetime.strptime(request.current_date, "%Y-%m-%d")
    except:
        current = datetime.now()

    # Weather forecast
    weather = await get_weather_forecast(p.city, 14)
    rain_days = weather.get("rain_days_forecast", 0)

    if rain_days > 8:
        warnings.append({
            "severity": "red",
            "category": "Weather",
            "message": f"🌧️ Heavy rainfall predicted for next {rain_days} days in {p.city}. Concrete pouring and excavation should be paused.",
            "recommendation": "Waterproof all exposed concrete. Halt excavation work. Pre-order polythene sheets for protection.",
        })
    elif rain_days > 4:
        warnings.append({
            "severity": "orange",
            "category": "Weather",
            "message": f"🌧️ {rain_days} rain days expected in {p.city} over next 2 weeks. Plan outdoor work carefully.",
            "recommendation": "Complete all outdoor concrete work in the next 3 days. Keep materials stored under shelter.",
        })

    # Check phase delays
    for phase in request.phases:
        try:
            phase_end = datetime.strptime(phase["end_date"], "%Y-%m-%d")
            if phase_end < current:
                days_late = (current - phase_end).days
                warnings.append({
                    "severity": "red" if days_late > 14 else "orange",
                    "category": "Schedule",
                    "message": f"⚠️ Phase '{phase['phase']}' is {days_late} days behind schedule. Handover may slip by {days_late * 1.5:.0f} days.",
                    "recommendation": f"Increase workforce for '{phase['phase']}' by 25%. Consider weekend shifts to recover lost time.",
                })
        except:
            pass

    # Labor shortage risk
    labor_score = risk_scores.get("labor", 0)
    if labor_score > 60:
        warnings.append({
            "severity": "orange" if labor_score < 80 else "red",
            "category": "Labor",
            "message": f"👷 Labor shortage risk is {'HIGH' if labor_score >= 80 else 'ELEVATED'} ({labor_score:.0f}/100) for {p.city} in current season.",
            "recommendation": "Pre-book skilled workers now. Consider engaging a sub-contractor as backup. Increase daily wage by 10% to attract workers.",
        })

    # Budget overrun warning
    budget_score = risk_scores.get("budget", 0)
    if budget_score > 70:
        warnings.append({
            "severity": "red" if budget_score > 85 else "orange",
            "category": "Budget",
            "message": f"📈 Budget overrun risk is HIGH ({budget_score:.0f}/100). Current estimates exceed planned budget.",
            "recommendation": "Review material specifications. Defer non-critical finishing items. Get 3 competitive quotes for major work packages.",
        })

    # Steel price spike check
    from pathlib import Path
    import json
    data_dir = Path(__file__).parent.parent / "data"
    with open(data_dir / "material_prices.json") as f:
        prices = json.load(f)
    
    city_prices = prices["cities"].get(p.city, list(prices["cities"].values())[0])
    prev_prices = city_prices.get("prev_month", {})
    if prev_prices:
        steel_now = city_prices.get("steel_per_mt", 0)
        steel_prev = prev_prices.get("steel_per_mt", steel_now)
        if steel_prev > 0:
            steel_change = ((steel_now - steel_prev) / steel_prev) * 100
            if steel_change > 10:
                warnings.append({
                    "severity": "orange",
                    "category": "Material Price",
                    "message": f"📈 Steel prices in {p.city} rose {steel_change:.1f}% this month (₹{steel_prev:,.0f} → ₹{steel_now:,.0f}/MT). Lock in rates now.",
                    "recommendation": f"Order your remaining steel requirements immediately to avoid further price increases. Consider forward booking.",
                })

    has_critical = any(w["severity"] == "red" for w in warnings)
    return {"warnings": warnings, "has_critical": has_critical}
