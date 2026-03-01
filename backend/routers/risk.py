from fastapi import APIRouter
from models.schemas import RiskRequest, RiskResponse
from utils.weather import get_weather_forecast
from utils.calculations import get_city_tier, get_risk_level
from datetime import datetime

router = APIRouter()


def compute_budget_risk(total_cost: float, budget: float, quality_grade: str, tier: str) -> dict:
    score = 25.0
    buffer = (budget - total_cost) / budget if budget > 0 else 0

    if buffer < 0:
        score += 40  # cost exceeds budget
    elif buffer < 0.05:
        score += 30
    elif buffer < 0.10:
        score += 20
    elif buffer < 0.15:
        score += 10

    # Quality grade risk
    if quality_grade == "Luxury":
        score += 15
    elif quality_grade == "Premium":
        score += 8

    # Market volatility (Metro higher)
    if tier == "Metro":
        score += 8
    elif tier == "Tier2":
        score += 4

    score = min(100, max(0, score))
    level = get_risk_level(score)

    explanations = {
        "LOW": "Your budget has a comfortable buffer above the estimated cost. Material prices in your region are stable.",
        "MEDIUM": "Your budget is close to the estimated cost. Consider a 10-15% contingency reserve for unexpected expenses.",
        "HIGH": "Your budget risk is elevated. The estimated cost is very close to or exceeds your budget. We strongly recommend adding a contingency buffer.",
        "CRITICAL": "Your project budget is insufficient based on current estimates. Immediate review of scope or budget is required."
    }

    return {
        "category": "Budget Overrun Risk",
        "score": round(score, 1),
        "level": level,
        "explanation": explanations[level]
    }


def compute_delay_risk(start_date_str: str, end_date_str: str, floors: int, area_sqft: float,
                        rain_days: int, tier: str) -> dict:
    score = 20.0
    try:
        start = datetime.strptime(start_date_str, "%Y-%m-%d")
        end = datetime.strptime(end_date_str, "%Y-%m-%d")
        total_days = (end - start).days
        required_days = 180 + (area_sqft * floors / 500) + (floors * 15)
        tightness = required_days / total_days if total_days > 0 else 2.0

        if tightness > 1.3:
            score += 35
        elif tightness > 1.1:
            score += 20
        elif tightness > 0.9:
            score += 10
    except:
        score += 15

    # Weather impact on delay
    if rain_days > 10:
        score += 20
    elif rain_days > 5:
        score += 12
    elif rain_days > 2:
        score += 6

    if floors > 10:
        score += 15
    elif floors > 5:
        score += 8

    score = min(100, max(0, score))
    level = get_risk_level(score)

    explanations = {
        "LOW": "Your project timeline appears well-planned with adequate buffer for typical delays.",
        "MEDIUM": "Some timeline risk exists. Weather and material delivery could impact your schedule by 1-3 weeks.",
        "HIGH": "Your timeline is aggressive. Build in buffer for monsoon season and labor availability. Risk of 1-2 month delays.",
        "CRITICAL": "Timeline is extremely tight and delays are highly likely. Consider extending project end date by at least 2 months."
    }

    return {
        "category": "Schedule Delay Risk",
        "score": round(score, 1),
        "level": level,
        "explanation": explanations[level]
    }


def compute_labor_risk(area_sqft: float, floors: int, tier: str, state: str) -> dict:
    score = 15.0
    total_sqft = area_sqft * floors

    if total_sqft > 50000:
        score += 30
    elif total_sqft > 20000:
        score += 18
    elif total_sqft > 5000:
        score += 8

    # Metro has more labor competition
    if tier == "Metro":
        score += 15
    elif tier == "Tier3":
        score += 8

    # Season factor (Feb-May is peak season)
    month = datetime.now().month
    if month in [2, 3, 4, 5]:
        score += 12
    elif month in [6, 7, 8, 9]:  # monsoon
        score += 8

    score = min(100, max(0, score))
    level = get_risk_level(score)

    explanations = {
        "LOW": "Labor availability in your region is adequate for your project scale.",
        "MEDIUM": "Some labor shortage risk during peak season. Recommend pre-booking skilled workers 4-6 weeks in advance.",
        "HIGH": "Labor shortage risk is significant, especially for skilled trades (Mason, Electrician). Lock in contractor agreements now.",
        "CRITICAL": "Acute labor shortage likely in this region and season. Budget for 15-20% higher than standard labor rates."
    }

    return {
        "category": "Labor Shortage Risk",
        "score": round(score, 1),
        "level": level,
        "explanation": explanations[level]
    }


def compute_weather_risk(rain_days: int, city: str) -> dict:
    score = 10.0
    if rain_days > 12:
        score = 85
    elif rain_days > 8:
        score = 65
    elif rain_days > 5:
        score = 45
    elif rain_days > 2:
        score = 30
    else:
        score = 15

    level = get_risk_level(score)
    explanations = {
        "LOW": f"Weather conditions look favorable for construction in {city} for the next 2 weeks.",
        "MEDIUM": f"{rain_days} rain days predicted in {city}. Plan outdoor work around weather windows.",
        "HIGH": f"Heavy rainfall predicted ({rain_days} days) in {city}. Concrete work and excavation should be staggered.",
        "CRITICAL": f"Severe weather risk with {rain_days}+ rain days predicted. Consider temporary shelters and waterproofing measures immediately."
    }

    return {
        "category": "Weather Impact Risk",
        "score": round(score, 1),
        "level": level,
        "explanation": explanations[level]
    }


def compute_compliance_risk(project_type: str, floors: int, area_sqft: float, tier: str) -> dict:
    score = 10.0
    floor_height_m = floors * 3.0

    if floor_height_m > 45:
        score += 35
    elif floor_height_m > 15:
        score += 20
    elif floor_height_m > 10:
        score += 10

    if area_sqft > 20000:
        score += 20  # Green building rating required

    if project_type == "Infrastructure":
        score += 20
    elif project_type == "Commercial":
        score += 10

    if tier == "Metro":
        score += 10  # Stricter regulations in metro

    score = min(100, max(0, score))
    level = get_risk_level(score)

    explanations = {
        "LOW": "Your project meets standard compliance requirements for your location and type.",
        "MEDIUM": "Some compliance checks needed. Verify FSI limits and setback requirements with local municipal authority.",
        "HIGH": "Multiple compliance requirements apply. Fire safety NOC, structural audit, and green building certification may be mandatory.",
        "CRITICAL": "Critical compliance issues likely. Consult a licensed architect and structural engineer before proceeding."
    }

    return {
        "category": "Regulatory Compliance Risk",
        "score": round(score, 1),
        "level": level,
        "explanation": explanations[level]
    }


@router.post("/risk", response_model=RiskResponse)
async def assess_risk(request: RiskRequest):
    p = request.project
    tier = get_city_tier(p.city)

    # Get weather data
    weather = await get_weather_forecast(p.city, 16)
    rain_days = weather.get("rain_days_forecast", 2)

    budget_risk = compute_budget_risk(request.total_cost, request.budget, p.quality_grade, tier)
    delay_risk = compute_delay_risk(p.start_date, p.end_date, p.floors, p.area_sqft, rain_days, tier)
    labor_risk = compute_labor_risk(p.area_sqft, p.floors, tier, p.state)
    weather_risk = compute_weather_risk(rain_days, p.city)
    compliance_risk = compute_compliance_risk(p.project_type, p.floors, p.area_sqft, tier)

    overall = (
        budget_risk["score"] * 0.30 +
        delay_risk["score"] * 0.25 +
        labor_risk["score"] * 0.20 +
        weather_risk["score"] * 0.15 +
        compliance_risk["score"] * 0.10
    )

    warnings = []
    for risk in [budget_risk, delay_risk, labor_risk, weather_risk, compliance_risk]:
        if risk["score"] > 75:
            warnings.append(f"⚠️ {risk['category']}: CRITICAL — {risk['explanation']}")

    return {
        "budget_risk": budget_risk,
        "delay_risk": delay_risk,
        "labor_risk": labor_risk,
        "weather_risk": weather_risk,
        "compliance_risk": compliance_risk,
        "overall_risk": round(overall, 1),
        "warnings": warnings,
    }
