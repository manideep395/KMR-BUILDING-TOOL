from fastapi import APIRouter
from models.schemas import ProjectInput, CarbonResponse

router = APIRouter()

# Emission factors
CO2_CEMENT = 0.82   # kg CO2 per kg cement
CO2_STEEL = 1.85    # kg CO2 per kg steel
CO2_TRANSPORT = 0.25  # kg CO2 per tonne-km (diesel truck)
CO2_MACHINERY = 2.68  # kg CO2 per liter diesel
AVG_DISTANCE_KM = 45  # typical distance from city to construction site
TREE_OFFSET_KG_ANNUAL = 22  # kg CO2 absorbed per tree per year
PROJECT_YEARS_OFFSET = 10   # assume 10 years of tree growth for offset


@router.post("/carbon", response_model=CarbonResponse)
async def carbon_footprint(project: ProjectInput):
    area = project.area_sqft
    floors = project.floors

    # Material weights
    cement_bags = area * 0.42 * (1 + (floors - 1) * 0.02)
    cement_kg = cement_bags * 50.0
    steel_kg = area * floors * 5.5

    # Sand and aggregate (for transport calculation)
    sand_tonnes = (area * 1.2 * 0.036)  # cft to tonnes approx
    aggregate_tonnes = (area * 0.9 * 0.048)

    # CO2 from materials
    co2_cement = cement_kg * CO2_CEMENT
    co2_steel = steel_kg * CO2_STEEL

    # Transport CO2 (total material weight × avg distance)
    total_material_tonnes = cement_kg / 1000 + steel_kg / 1000 + sand_tonnes + aggregate_tonnes
    co2_transport = total_material_tonnes * AVG_DISTANCE_KM * CO2_TRANSPORT

    # Machinery (diesel consumption estimate by phase)
    total_phase_days = 60 + int(area * floors / 400)
    diesel_liters = total_phase_days * 25  # avg 25L/day for machinery
    co2_machinery = diesel_liters * CO2_MACHINERY

    # Total
    total_co2 = co2_cement + co2_steel + co2_transport + co2_machinery

    # Trees needed: total / (offset per year × 10 years)
    trees = int(total_co2 / (TREE_OFFSET_KG_ANNUAL * PROJECT_YEARS_OFFSET)) + 1

    # Average project comparison (₹1Cr residential ≈ 180 tonnes CO2)
    avg_co2 = 1200 * area * floors / 10000  # rough scaling by sqft
    comparison = ((total_co2 - avg_co2) / avg_co2) * 100 if avg_co2 > 0 else 0

    items = [
        {"category": "Cement Production", "quantity_kg": round(cement_kg, 1), "emission_factor": CO2_CEMENT, "co2_kg": round(co2_cement, 1)},
        {"category": "Steel Production", "quantity_kg": round(steel_kg, 1), "emission_factor": CO2_STEEL, "co2_kg": round(co2_steel, 1)},
        {"category": "Transportation", "quantity_kg": round(total_material_tonnes * 1000, 1), "emission_factor": CO2_TRANSPORT, "co2_kg": round(co2_transport, 1)},
        {"category": "Construction Machinery", "quantity_kg": round(diesel_liters, 1), "emission_factor": CO2_MACHINERY, "co2_kg": round(co2_machinery, 1)},
    ]

    green_suggestions = [
        "Use fly ash cement (PPC) instead of OPC — reduces CO₂ by 20-30% in cement production",
        "Source steel from electric arc furnace (EAF) mills — 60-70% lower CO₂ than blast furnace",
        "Optimize material delivery routes to minimize transport distances",
        "Use AAC (Autoclaved Aerated Concrete) blocks instead of clay bricks — saves 30% CO₂",
        "Install 5kW rooftop solar during construction to offset machinery power needs",
    ]

    return {
        "items": items,
        "total_co2_kg": round(total_co2, 1),
        "trees_to_offset": trees,
        "avg_project_co2_kg": round(avg_co2, 1),
        "comparison_to_avg": round(comparison, 1),
        "green_suggestions": green_suggestions,
    }
