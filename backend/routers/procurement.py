from fastapi import APIRouter
from models.schemas import ProjectInput, ProcurementResponse
from utils.calculations import get_city_prices
from datetime import datetime, timedelta

router = APIRouter()

WASTE_RATES = {
    "Cement": {"rate": 0.04, "unit": "bags"},
    "Steel TMT": {"rate": 0.025, "unit": "MT"},
    "Floor Tiles": {"rate": 0.10, "unit": "sqft"},
    "Wall Tiles": {"rate": 0.10, "unit": "sqft"},
    "Paint": {"rate": 0.125, "unit": "liters"},
    "Sand": {"rate": 0.06, "unit": "cft"},
    "Aggregate": {"rate": 0.05, "unit": "cft"},
    "Bricks": {"rate": 0.08, "unit": "nos"},
    "Plumbing Pipes": {"rate": 0.05, "unit": "meters"},
    "Electrical Wire": {"rate": 0.08, "unit": "meters"},
}


def get_waste_level(rate: float) -> str:
    if rate < 0.05:
        return "green"
    elif rate < 0.10:
        return "amber"
    else:
        return "red"


@router.post("/procurement", response_model=ProcurementResponse)
async def procurement_plan(project: ProjectInput):
    cp = get_city_prices(project.city)
    start = datetime.strptime(project.start_date, "%Y-%m-%d")
    area = project.area_sqft
    floors = project.floors

    # Base quantities
    base_quantities = {
        "Cement": area * 0.42,
        "Steel TMT": area * floors * 5.5 / 1000,
        "Floor Tiles": area * 1.0,
        "Wall Tiles": area * floors * 0.4,
        "Paint": area * floors * 2.5 / 12,
        "Sand": area * 1.2,
        "Aggregate": area * 0.9,
        "Bricks": area * floors * 8,
        "Plumbing Pipes": area * floors * 0.5,
        "Electrical Wire": area * floors * 1.2,
    }

    unit_costs = {
        "Cement": cp["cement_per_bag"],
        "Steel TMT": cp["steel_per_mt"],
        "Floor Tiles": 80,
        "Wall Tiles": 70,
        "Paint": cp["paint_per_liter"],
        "Sand": cp["sand_per_cft"],
        "Aggregate": cp["aggregate_per_cft"],
        "Bricks": cp["bricks_per_1000"] / 1000,
        "Plumbing Pipes": 180,
        "Electrical Wire": 45,
    }

    order_delays = {
        "Cement": -7, "Steel TMT": 20, "Floor Tiles": 150, "Wall Tiles": 150,
        "Paint": 180, "Sand": -5, "Aggregate": -3, "Bricks": 40,
        "Plumbing Pipes": 80, "Electrical Wire": 80,
    }

    vendor_types = {
        "Cement": "national", "Steel TMT": "national", "Floor Tiles": "regional",
        "Wall Tiles": "regional", "Paint": "national", "Sand": "local",
        "Aggregate": "local", "Bricks": "local", "Plumbing Pipes": "regional",
        "Electrical Wire": "regional",
    }

    items = []
    total_cost = 0.0
    bulk_savings = 0.0

    for mat, base_qty in base_quantities.items():
        waste_info = WASTE_RATES.get(mat, {"rate": 0.05, "unit": "units"})
        waste_pct = waste_info["rate"]
        order_qty = base_qty * (1 + waste_pct)
        unit_cost = unit_costs.get(mat, 100)
        item_total = order_qty * unit_cost
        total_cost += item_total

        order_date = start + timedelta(days=order_delays.get(mat, 0))
        delivery_date = order_date + timedelta(days=5)

        bulk_available = mat in ["Cement", "Steel TMT", "Floor Tiles", "Bricks"]
        if bulk_available:
            bulk_savings += item_total * 0.05  # 5% bulk discount potential

        items.append({
            "material": mat,
            "required_qty": round(base_qty, 2),
            "unit": waste_info["unit"],
            "waste_pct": round(waste_pct * 100, 1),
            "order_qty": round(order_qty, 2),
            "order_date": order_date.strftime("%Y-%m-%d"),
            "delivery_date": delivery_date.strftime("%Y-%m-%d"),
            "vendor_type": vendor_types.get(mat, "regional"),
            "unit_cost": unit_cost,
            "total_cost": round(item_total, 2),
            "bulk_discount_available": bulk_available,
            "waste_level": get_waste_level(waste_pct),
        })

    smart_order = [
        {"material": item["material"], "order_qty": item["order_qty"],
         "unit": item["unit"], "order_date": item["order_date"],
         "vendor_type": item["vendor_type"], "total_cost": item["total_cost"]}
        for item in items
    ]

    return {
        "items": items,
        "total_procurement_cost": round(total_cost, 2),
        "potential_savings_bulk": round(bulk_savings, 2),
        "smart_order_list": smart_order,
    }
