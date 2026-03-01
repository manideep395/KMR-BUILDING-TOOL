from fastapi import APIRouter
from models.schemas import SimulateRequest, SimulateResponse
from datetime import datetime, timedelta

router = APIRouter()


@router.post("/simulate", response_model=SimulateResponse)
async def simulate_scenario(request: SimulateRequest):
    base_cost = request.base_cost
    base_days = request.base_duration_days

    # Budget change
    budget_mult = 1.0 + (request.budget_change_pct / 100)
    material_adj = 1 + (request.material_price_spike_pct / 100)
    labor_adj = 1 - ((100 - request.labor_availability_pct) / 100) * 0.15

    revised_cost = base_cost * budget_mult * material_adj
    # Labor shortage increases cost
    if request.labor_availability_pct < 100:
        revised_cost *= (1 + (100 - request.labor_availability_pct) / 500)
    elif request.labor_availability_pct > 100:
        revised_cost *= (1 + (request.labor_availability_pct - 100) / 400)

    # Timeline change
    timeline_mult = 1.0 + (request.timeline_change_pct / 100)
    revised_days = int(base_days * timeline_mult)

    # Weather disruption adds days
    revised_days += request.weather_disruption_days

    # Labor shortage extends timeline
    if request.labor_availability_pct < 75:
        revised_days = int(revised_days * 1.25)
    elif request.labor_availability_pct < 100:
        revised_days = int(revised_days * 1.10)

    # Estimate completion date from today
    completion = datetime.now() + timedelta(days=revised_days)
    
    cost_change_pct = ((revised_cost - base_cost) / base_cost) * 100 if base_cost > 0 else 0
    days_change = revised_days - base_days

    # Risk score adjustment
    risk_change = 0
    if cost_change_pct > 20:
        risk_change += 25
    elif cost_change_pct > 10:
        risk_change += 12
    if request.weather_disruption_days > 14:
        risk_change += 20
    elif request.weather_disruption_days > 7:
        risk_change += 10
    if request.labor_availability_pct < 75:
        risk_change += 15

    workforce_msg = "Workforce remains unchanged."
    if request.labor_availability_pct < 100:
        shortage = 100 - request.labor_availability_pct
        workforce_msg = f"With {shortage:.0f}% labor shortage: extend work hours, source additional workers from neighbouring regions, or delay non-critical tasks."
    elif request.labor_availability_pct > 100:
        extra = request.labor_availability_pct - 100
        workforce_msg = f"With {extra:.0f}% extra workforce: consider parallel phasing to reduce timeline by up to {int(extra/5)} days."

    summary_parts = []
    if abs(cost_change_pct) > 0.5:
        direction = "increase" if cost_change_pct > 0 else "decrease"
        summary_parts.append(f"Cost will {direction} by {abs(cost_change_pct):.1f}% to ₹{revised_cost:,.0f}")
    if days_change != 0:
        direction = "extend" if days_change > 0 else "reduce"
        summary_parts.append(f"Timeline will {direction} by {abs(days_change)} days")
    if request.weather_disruption_days > 0:
        summary_parts.append(f"{request.weather_disruption_days} rain days will impact outdoor work")

    return {
        "revised_total_cost": round(revised_cost, 2),
        "revised_completion_date": completion.strftime("%Y-%m-%d"),
        "cost_change_pct": round(cost_change_pct, 2),
        "days_change": days_change,
        "risk_score_change": round(risk_change, 1),
        "workforce_reallocation": workforce_msg,
        "summary": ". ".join(summary_parts) if summary_parts else "No significant changes from this scenario.",
    }
