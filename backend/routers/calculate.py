from fastapi import APIRouter
from models.schemas import ProjectInput, CalculationResponse
from utils.calculations import (
    get_city_prices, get_city_tier, get_state_labor,
    get_base_cost_per_sqft, compute_material_quantities,
    compute_material_costs, compute_labor_requirements,
    compute_phases, compute_cost_variants
)

router = APIRouter()


@router.post("/calculate", response_model=CalculationResponse)
async def calculate_project(project: ProjectInput):
    city_prices = get_city_prices(project.city)
    tier = get_city_tier(project.city)
    labor_rates = get_state_labor(project.state)

    base_cost_per_sqft = get_base_cost_per_sqft(project.project_type, project.quality_grade, tier)

    # Phase timeline
    phases = compute_phases(project.start_date, project.area_sqft, project.floors, project.project_type)

    # Material costs
    material_costs = compute_material_costs(
        project.area_sqft, project.floors, project.project_type,
        project.quality_grade, city_prices, base_cost_per_sqft
    )

    # Material quantities
    qty = compute_material_quantities(project.area_sqft, project.floors, project.project_type, project.quality_grade)

    # Labor requirements
    labor = compute_labor_requirements(
        project.area_sqft, project.floors, project.project_type,
        phases, labor_rates, project.quality_grade
    )

    total_material_cost = sum(item["total"] for item in material_costs)
    total_labor_cost = sum(item["total_cost"] for item in labor)
    total_project_cost = total_material_cost + total_labor_cost

    # Apply location multiplier
    tier_mult = {"Metro": 1.0, "Tier2": 0.92, "Tier3": 0.82}
    total_project_cost *= tier_mult.get(tier, 0.92)
    total_material_cost *= tier_mult.get(tier, 0.92)
    total_labor_cost *= tier_mult.get(tier, 0.92)

    cost_per_sqft = total_project_cost / project.area_sqft if project.area_sqft else 0
    cost_variants = compute_cost_variants(total_project_cost)

    return {
        "project_name": project.project_name,
        "material_costs": material_costs,
        "labor": labor,
        "phases": phases,
        "material_quantities": qty,
        "cost_variants": cost_variants,
        "total_material_cost": round(total_material_cost, 2),
        "total_labor_cost": round(total_labor_cost, 2),
        "total_project_cost": round(total_project_cost, 2),
        "cost_per_sqft": round(cost_per_sqft, 2),
    }
