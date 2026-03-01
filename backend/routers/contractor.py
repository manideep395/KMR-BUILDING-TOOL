from fastapi import APIRouter
from models import schemas
from models.schemas import ContractorRequest, ContractorResponse

router = APIRouter()


def score_contractor(c):
    on_time = (c.on_time_projects / c.projects_completed * 100) if c.projects_completed else 0
    within_budget = (c.within_budget_projects / c.projects_completed * 100) if c.projects_completed else 0

    # Quality: penalize complaints (0 = perfect, scale inversely)
    quality_score = max(0, 100 - c.quality_complaints * 8)
    # Safety: penalize incidents
    safety_score = max(0, 100 - c.safety_incidents * 15)
    # Experience score
    exp_score = min(100, c.years_experience * 5 + c.certifications * 10)

    weighted = (
        on_time * 0.30 +
        within_budget * 0.25 +
        quality_score * 0.20 +
        safety_score * 0.15 +
        exp_score * 0.10
    )

    if weighted >= 80:
        confidence = "High"
        stars = 5.0
    elif weighted >= 65:
        confidence = "High"
        stars = 4.0
    elif weighted >= 50:
        confidence = "Medium"
        stars = 3.0
    elif weighted >= 35:
        confidence = "Medium"
        stars = 2.0
    else:
        confidence = "Low"
        stars = 1.0

    return {
        "name": c.name,
        "on_time_rate": round(on_time, 1),
        "cost_adherence_rate": round(within_budget, 1),
        "quality_score": round(quality_score, 1),
        "safety_score": round(safety_score, 1),
        "experience_score": round(exp_score, 1),
        "overall_score": round(weighted, 1),
        "hire_confidence": confidence,
        "star_rating": stars,
        "breakdown": {
            "On-Time Delivery": on_time,
            "Cost Adherence": within_budget,
            "Quality": quality_score,
            "Safety": safety_score,
            "Experience": exp_score,
        },
    }


@router.post("/contractor/score", response_model=ContractorResponse)
async def score_contractors(request: ContractorRequest):
    scores = [score_contractor(c) for c in request.contractors]
    return {"scores": scores}


@router.post("/contractor/find", response_model=schemas.FindBuildersResponse)
async def find_contractors(request: schemas.FindBuildersRequest):
    from utils.gemini_client import find_nearby_builders
    builders_list = await find_nearby_builders(request.locality, request.project_type)
    return {"locality": request.locality, "builders": builders_list}
