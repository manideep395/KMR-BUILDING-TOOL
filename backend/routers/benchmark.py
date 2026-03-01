import json
from fastapi import APIRouter
from models.schemas import BenchmarkRequest, BenchmarkResponse
from pathlib import Path
from utils.calculations import get_city_tier

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent / "data"
with open(DATA_DIR / "benchmarks.json") as f:
    BENCHMARKS = json.load(f)


@router.post("/benchmark", response_model=BenchmarkResponse)
async def benchmark_project(request: BenchmarkRequest):
    p = request.project
    tier = get_city_tier(p.city)
    total_cost = request.total_cost
    cost_per_sqft = total_cost / p.area_sqft if p.area_sqft > 0 else 0

    bench = BENCHMARKS["cost_per_sqft"].get(p.project_type, BENCHMARKS["cost_per_sqft"]["Residential"])
    grade = bench.get(p.quality_grade, bench["Standard"])

    industry_avg = grade["industry_avg"]
    regional_avg = grade["regional_metro"] if tier == "Metro" else (grade["regional_tier2"] if tier == "Tier2" else grade["regional_tier3"])
    best_in_class = grade["best_in_class"]

    dev_industry = ((cost_per_sqft - industry_avg) / industry_avg) * 100 if industry_avg else 0
    dev_regional = ((cost_per_sqft - regional_avg) / regional_avg) * 100 if regional_avg else 0

    # Category comparison
    cat_dist = BENCHMARKS["category_distribution"]
    category_comparison = []
    for cat_item in request.material_costs:
        cat = cat_item["category"]
        your_cost = cat_item["total"] / p.area_sqft if p.area_sqft else 0
        pct = cat_dist.get(cat, 0.08)
        ind_cost = industry_avg * pct
        reg_cost = regional_avg * pct
        bic_cost = best_in_class * pct
        dev = ((your_cost - ind_cost) / ind_cost) * 100 if ind_cost else 0

        insight = ""
        if dev > 15:
            insight = f"Your {cat} cost is {dev:.0f}% above industry average. Consider getting 3 competing quotes."
        elif dev < -10:
            insight = f"Your {cat} cost is {abs(dev):.0f}% below industry average — great value!"
        else:
            insight = f"Your {cat} cost is in line with industry standards."

        category_comparison.append({
            "category": cat,
            "your_cost": round(your_cost, 2),
            "industry_avg": round(ind_cost, 2),
            "regional_avg": round(reg_cost, 2),
            "best_in_class": round(bic_cost, 2),
            "deviation_from_industry": round(dev, 1),
            "deviation_from_regional": round(((your_cost - reg_cost) / reg_cost) * 100 if reg_cost else 0, 1),
            "insight": insight,
        })

    if dev_regional > 20:
        overall = f"Your project costs {dev_regional:.1f}% above the regional average for {p.city}. Major optimization opportunity exists in material sourcing and vendor selection."
    elif dev_regional > 10:
        overall = f"Costs are moderately above regional benchmark by {dev_regional:.1f}%. Consider bulk purchasing and local sourcing to reduce costs."
    elif dev_regional < -10:
        overall = f"Excellent! Your project is {abs(dev_regional):.1f}% below regional average — you are getting great value for money."
    else:
        overall = f"Your project costs are well-aligned with the regional benchmark for {p.city} — good planning!"

    return {
        "cost_per_sqft": round(cost_per_sqft, 2),
        "industry_avg_per_sqft": round(industry_avg, 2),
        "regional_avg_per_sqft": round(regional_avg, 2),
        "best_in_class_per_sqft": round(best_in_class, 2),
        "deviation_industry": round(dev_industry, 1),
        "deviation_regional": round(dev_regional, 1),
        "category_comparison": category_comparison,
        "overall_insight": overall,
    }
