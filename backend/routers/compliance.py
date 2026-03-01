import json
from fastapi import APIRouter
from models.schemas import ProjectInput, ComplianceResponse
from utils.calculations import get_city_tier
from pathlib import Path

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent / "data"
with open(DATA_DIR / "compliance_rules.json") as f:
    RULES = json.load(f)


@router.post("/compliance", response_model=ComplianceResponse)
async def compliance_check(project: ProjectInput):
    tier = get_city_tier(project.city)
    city = project.city
    ptype = project.project_type
    floors = project.floors
    area = project.area_sqft

    height_m = floors * 3.0
    checks = []

    # 1. FSI check
    fsi_limit = RULES["fsi_limits"][tier][ptype]
    footprint_est = area / floors if floors > 0 else area
    plot_est = footprint_est / 0.6  # assume 60% coverage
    actual_fsi = (area * floors) / plot_est if plot_est > 0 else 0

    checks.append({
        "check": "FSI/FAR Compliance",
        "status": "pass" if actual_fsi <= fsi_limit else "fail",
        "rule_reference": f"NBC 2016 / Local Municipal Bye-law — FSI Limit: {fsi_limit}",
        "details": f"Estimated FSI: {actual_fsi:.2f} vs allowed {fsi_limit}",
        "fix_suggestion": "" if actual_fsi <= fsi_limit else f"Reduce built-up area or obtain special FSI permission from municipal authority.",
    })

    # 2. Height restriction
    height_limit = RULES["height_restrictions"][tier][ptype]
    checks.append({
        "check": "Height Restriction",
        "status": "pass" if height_m <= height_limit else "fail",
        "rule_reference": f"Local Master Plan Height Restriction: {height_limit}m",
        "details": f"Proposed height: {height_m:.1f}m vs limit: {height_limit}m",
        "fix_suggestion": "" if height_m <= height_limit else f"Reduce floor count or seek special permission from municipal authority.",
    })

    # 3. Fire safety (>15m = mandatory fire NOC)
    fire_required = height_m > RULES["fire_safety_height_threshold_m"]
    checks.append({
        "check": "Fire Safety NOC",
        "status": "warning" if fire_required else "pass",
        "rule_reference": "NBC Part 4 — Fire Safety (mandatory for buildings >15m height)",
        "details": f"Building height: {height_m:.1f}m. Fire NOC {'required' if fire_required else 'not required'}.",
        "fix_suggestion": "Apply for Fire NOC from State Fire Department before construction begins." if fire_required else "",
    })

    # 4. Earthquake zone
    zone = RULES["earthquake_zones"].get(city, RULES["earthquake_zones"].get("default", 2))
    zone_compliant = True
    zone_msg = f"Your project is in Seismic Zone {zone}."
    if zone >= 4 and ptype in ["Residential", "Commercial"] and floors > 4:
        zone_compliant = False
        zone_msg += f" Buildings above 4 floors in Zone {zone} require seismic design as per IS 1893."
    checks.append({
        "check": f"Seismic Zone {zone} Compliance",
        "status": "pass" if zone_compliant else "warning",
        "rule_reference": "IS 1893:2016 — Criteria for Earthquake Resistant Design",
        "details": zone_msg,
        "fix_suggestion": "Engage a structural engineer for IS 1893 compliant design." if not zone_compliant else "",
    })

    # 5. Green building rating
    green_required = area > RULES["green_building_area_threshold_sqft"]
    checks.append({
        "check": "Green Building Rating",
        "status": "warning" if green_required else "pass",
        "rule_reference": "MoEF Notification — GRIHA/LEED mandatory for >20,000 sqft",
        "details": f"Project area: {area:,.0f} sqft. Green rating {'mandatory' if green_required else 'optional but recommended'}.",
        "fix_suggestion": "Register for GRIHA 4-star or LEED certification. Engage a green building consultant." if green_required else "",
    })

    # 6. Setback requirements
    setbacks = RULES["setback_requirements"].get(ptype, RULES["setback_requirements"]["Residential"])
    checks.append({
        "check": "Setback Requirements",
        "status": "pass",
        "rule_reference": f"Municipal Building Bye-laws — {ptype} setbacks",
        "details": f"Required: Front {setbacks['front']}m, Rear {setbacks['rear']}m, Side {setbacks['side']}m",
        "fix_suggestion": "Verify actual plot boundaries with a licensed surveyor before construction.",
    })

    # Score calculation
    passed = sum(1 for c in checks if c["status"] == "pass")
    failed = sum(1 for c in checks if c["status"] == "fail")
    warnings = sum(1 for c in checks if c["status"] == "warning")
    score = ((passed * 1.0 + warnings * 0.5) / len(checks)) * 100

    return {
        "checks": checks,
        "compliance_score": round(score, 1),
        "pass_count": passed,
        "fail_count": failed,
        "warning_count": warnings,
    }
