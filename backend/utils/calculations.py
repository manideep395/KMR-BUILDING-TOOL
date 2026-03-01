import json
import math
from datetime import datetime, timedelta
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

with open(DATA_DIR / "material_prices.json") as f:
    PRICES_DB = json.load(f)

with open(DATA_DIR / "labor_rates.json") as f:
    LABOR_DB = json.load(f)

with open(DATA_DIR / "benchmarks.json") as f:
    BENCHMARKS_DB = json.load(f)


def get_city_prices(city: str):
    cities = PRICES_DB["cities"]
    if city in cities:
        return cities[city]
    # fallback: find same state
    for c, data in cities.items():
        pass  # return first match for state
    return list(cities.values())[0]


def get_city_tier(city: str) -> str:
    cities = PRICES_DB["cities"]
    if city in cities:
        return cities[city].get("tier", "Tier2")
    return "Tier2"


def get_state_labor(state: str):
    states = LABOR_DB["states"]
    if state in states:
        return states[state]
    return LABOR_DB["default"]


def get_base_cost_per_sqft(project_type: str, quality_grade: str, tier: str) -> float:
    """Returns base cost per sqft based on type, grade, location tier."""
    benchmarks = BENCHMARKS_DB["cost_per_sqft"]
    type_data = benchmarks.get(project_type, benchmarks["Residential"])
    grade_data = type_data.get(quality_grade, type_data["Standard"])

    if tier == "Metro":
        return grade_data["regional_metro"]
    elif tier == "Tier3":
        return grade_data["regional_tier3"]
    else:
        return grade_data["regional_tier2"]


def compute_material_quantities(area_sqft: float, floors: int, project_type: str, quality_grade: str):
    """Compute material quantities based on area, floors, type, grade."""
    # Cement consumption
    cement_rate = 0.4 + (floors - 1) * 0.02  # bags per sqft, increases with floors
    cement_bags = area_sqft * cement_rate

    # Steel consumption by project type
    if project_type == "Residential":
        steel_rate = 4.5 + (floors - 1) * 0.2  # kg per sqft
    elif project_type in ["Commercial", "Infrastructure"]:
        steel_rate = 9.0 + (floors - 1) * 0.3
    else:  # Industrial
        steel_rate = 7.0 + (floors - 1) * 0.25

    steel_kg = area_sqft * steel_rate
    steel_mt = steel_kg / 1000

    # Sand and aggregate
    sand_cft = area_sqft * 1.2 + floors * area_sqft * 0.05
    aggregate_cft = area_sqft * 0.9 + floors * area_sqft * 0.04

    # Bricks
    if project_type in ["Residential", "Commercial"]:
        brick_rate = 8.0  # per sqft of wall area (approx 2* floor area for walls)
        bricks = int(area_sqft * floors * brick_rate * 0.3)
    else:
        bricks = int(area_sqft * floors * 4)

    # Paint
    paint_area = area_sqft * 2.5 * floors  # walls + ceiling
    paint_liters = paint_area / 12  # 1 liter covers ~12 sqft (2 coats)

    # Tiles
    tiles_sqft = area_sqft * 1.08  # 8% waste

    return {
        "cement_bags": round(cement_bags, 1),
        "steel_mt": round(steel_mt, 2),
        "sand_cft": round(sand_cft, 1),
        "aggregate_cft": round(aggregate_cft, 1),
        "bricks_count": bricks,
        "paint_liters": round(paint_liters, 1),
        "tiles_sqft": round(tiles_sqft, 1),
    }


def compute_material_costs(area_sqft: float, floors: int, project_type: str,
                            quality_grade: str, city_prices: dict, base_cost_per_sqft: float):
    """Compute detailed category-wise material costs."""
    total_material_budget = base_cost_per_sqft * area_sqft

    dist = BENCHMARKS_DB["category_distribution"]

    # Quality multipliers
    quality_mult = {"Economy": 0.80, "Standard": 1.0, "Premium": 1.25, "Luxury": 1.60}
    qm = quality_mult.get(quality_grade, 1.0)

    categories = []
    category_items = [
        ("Foundation", dist["Foundation"], "LS", 1),
        ("Structure", dist["Structure"], "LS", 1),
        ("Brickwork", dist["Brickwork"], "sqft", area_sqft * floors),
        ("Flooring", dist["Flooring"], "sqft", area_sqft),
        ("Roofing", dist["Roofing"], "sqft", area_sqft),
        ("Plastering", dist["Plastering"], "sqft", area_sqft * floors * 2),
        ("Painting", dist["Painting"], "sqft", area_sqft * floors * 2.5),
        ("Electrical", dist["Electrical"], "point", int(area_sqft / 50)),
        ("Plumbing", dist["Plumbing"], "point", int(area_sqft / 100)),
        ("Finishing", dist["Finishing"], "LS", 1),
    ]

    for name, pct, unit, qty in category_items:
        total = total_material_budget * pct * qm
        unit_rate = total / qty if qty > 0 else total
        categories.append({
            "category": name,
            "quantity": round(qty, 1),
            "unit": unit,
            "unit_rate": round(unit_rate, 2),
            "total": round(total, 2),
        })

    return categories


def compute_labor_requirements(area_sqft: float, floors: int, project_type: str,
                                 phases, labor_rates: dict, quality_grade: str):
    """Compute workforce requirements per phase."""
    phase_worker_ratios = {
        "Foundation": {"Mason": 0.3, "Helper": 0.4, "Supervisor": 0.1},
        "Structure": {"Mason": 0.35, "Helper": 0.35, "Carpenter": 0.1, "Supervisor": 0.1},
        "MEP": {"Electrician": 0.25, "Plumber": 0.25, "Helper": 0.3, "Supervisor": 0.1},
        "Finishing": {"Mason": 0.2, "Helper": 0.3, "Carpenter": 0.15, "Supervisor": 0.1},
        "Handover": {"Helper": 0.2, "Supervisor": 0.2},
    }

    # Scale workers by area and floors
    base_workers = max(8, int(area_sqft * floors / 800))

    labor_items = []
    for phase in phases:
        phase_name = phase["phase"]
        duration = phase["duration_days"]
        ratio_map = phase_worker_ratios.get(phase_name, {"Helper": 0.5, "Supervisor": 0.1})

        for role, ratio in ratio_map.items():
            count = max(1, int(base_workers * ratio))
            daily_wage = labor_rates.get(f"{role.lower()}_daily", labor_rates.get("mason_daily", 700))
            total_cost = count * daily_wage * duration
            labor_items.append({
                "category": role,
                "count": count,
                "daily_wage": daily_wage,
                "phase": phase_name,
                "total_days": duration,
                "total_cost": round(total_cost, 2),
            })

    return labor_items


def compute_phases(start_date_str: str, area_sqft: float, floors: int, project_type: str):
    """Compute phase-wise timeline."""
    start = datetime.strptime(start_date_str, "%Y-%m-%d")
    total_sqft = area_sqft * floors

    # Phase duration multipliers by project scale
    scale = total_sqft / 1000

    durations = {
        "Foundation": max(20, int(25 * scale * 0.6)),
        "Structure": max(30, int(45 * scale * 0.8)),
        "MEP": max(20, int(30 * scale * 0.5)),
        "Finishing": max(25, int(35 * scale * 0.6)),
        "Handover": max(7, int(10 * scale * 0.3)),
    }

    # Commercial/Industrial needs more structure time
    if project_type in ["Commercial", "Industrial", "Infrastructure"]:
        durations["Structure"] = int(durations["Structure"] * 1.3)
        durations["MEP"] = int(durations["MEP"] * 1.4)

    phases = []
    current = start
    phase_names = ["Foundation", "Structure", "MEP", "Finishing", "Handover"]
    worker_map = {"Foundation": 15, "Structure": 25, "MEP": 18, "Finishing": 20, "Handover": 8}

    for name in phase_names:
        dur = durations[name]
        end = current + timedelta(days=dur)
        phases.append({
            "phase": name,
            "start_date": current.strftime("%Y-%m-%d"),
            "end_date": end.strftime("%Y-%m-%d"),
            "duration_days": dur,
            "workers": worker_map.get(name, 10),
        })
        current = end

    return phases


def compute_cost_variants(total_cost: float):
    """Monte Carlo style 3 variants."""
    return {
        "optimistic": round(total_cost * 0.88, 2),
        "most_likely": round(total_cost, 2),
        "pessimistic": round(total_cost * 1.18, 2),
    }


def get_risk_level(score: float) -> str:
    if score < 30:
        return "LOW"
    elif score < 60:
        return "MEDIUM"
    elif score < 75:
        return "HIGH"
    else:
        return "CRITICAL"
