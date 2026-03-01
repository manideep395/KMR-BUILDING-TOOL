from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date


class ProjectInput(BaseModel):
    project_name: str = "My Construction Project"
    project_type: str = "Residential"  # Residential/Commercial/Industrial/Infrastructure
    area_sqft: float = 1000.0
    floors: int = 2
    budget: float = 5000000.0
    currency: str = "INR"
    start_date: str = "2025-04-01"
    end_date: str = "2026-04-01"
    city: str = "Bangalore"
    state: str = "Karnataka"
    quality_grade: str = "Standard"  # Economy/Standard/Premium/Luxury
    optimization_priority: str = "Balanced"  # Minimize Cost/Minimize Time/Balanced


class MaterialCostItem(BaseModel):
    category: str
    quantity: float
    unit: str
    unit_rate: float
    total: float


class LaborItem(BaseModel):
    category: str
    count: int
    daily_wage: float
    phase: str
    total_days: int
    total_cost: float


class PhaseTimeline(BaseModel):
    phase: str
    start_date: str
    end_date: str
    duration_days: int
    workers: int


class MaterialQuantities(BaseModel):
    cement_bags: float
    steel_mt: float
    sand_cft: float
    aggregate_cft: float
    bricks_count: int
    paint_liters: float
    tiles_sqft: float


class CostVariants(BaseModel):
    optimistic: float
    most_likely: float
    pessimistic: float


class CalculationResponse(BaseModel):
    project_name: str
    material_costs: List[MaterialCostItem]
    labor: List[LaborItem]
    phases: List[PhaseTimeline]
    material_quantities: MaterialQuantities
    cost_variants: CostVariants
    total_material_cost: float
    total_labor_cost: float
    total_project_cost: float
    cost_per_sqft: float


class CPARequest(BaseModel):
    project: ProjectInput
    phases: List[PhaseTimeline]


class CPATask(BaseModel):
    id: str
    name: str
    duration: int
    dependencies: List[str]
    es: int = 0
    ef: int = 0
    ls: int = 0
    lf: int = 0
    slack: float = 0.0
    is_critical: bool = False
    workers: int = 0
    phase: str = ""


class CPAResponse(BaseModel):
    tasks: List[CPATask]
    critical_path: List[str]
    project_duration: int
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]


class SimulateRequest(BaseModel):
    project: ProjectInput
    base_cost: float
    base_duration_days: int
    budget_change_pct: float = 0.0
    timeline_change_pct: float = 0.0
    labor_availability_pct: float = 100.0
    material_price_spike_pct: float = 0.0
    weather_disruption_days: int = 0


class SimulateResponse(BaseModel):
    revised_total_cost: float
    revised_completion_date: str
    cost_change_pct: float
    days_change: int
    risk_score_change: float
    workforce_reallocation: str
    summary: str


class RiskRequest(BaseModel):
    project: ProjectInput
    total_cost: float
    budget: float


class RiskScore(BaseModel):
    category: str
    score: float
    level: str
    explanation: str


class RiskResponse(BaseModel):
    budget_risk: RiskScore
    delay_risk: RiskScore
    labor_risk: RiskScore
    weather_risk: RiskScore
    compliance_risk: RiskScore
    overall_risk: float
    warnings: List[str]


class BenchmarkRequest(BaseModel):
    project: ProjectInput
    total_cost: float
    material_costs: List[MaterialCostItem]


class BenchmarkComparison(BaseModel):
    category: str
    your_cost: float
    industry_avg: float
    regional_avg: float
    best_in_class: float
    deviation_from_industry: float
    deviation_from_regional: float
    insight: str


class BenchmarkResponse(BaseModel):
    cost_per_sqft: float
    industry_avg_per_sqft: float
    regional_avg_per_sqft: float
    best_in_class_per_sqft: float
    deviation_industry: float
    deviation_regional: float
    category_comparison: List[BenchmarkComparison]
    overall_insight: str


class OptimizeRequest(BaseModel):
    project: ProjectInput
    phases: List[PhaseTimeline]
    total_cost: float
    priority: str = "Balanced"


class OptimizedPhase(BaseModel):
    phase: str
    original_duration: int
    optimized_duration: int
    workers_original: int
    workers_optimized: int
    cost_savings: float


class OptimizeResponse(BaseModel):
    optimized_phases: List[OptimizedPhase]
    total_cost_savings: float
    total_days_savings: int
    material_order_calendar: List[Dict[str, Any]]
    recommendations: List[str]
    summary: str


class ProcurementItem(BaseModel):
    material: str
    required_qty: float
    unit: str
    waste_pct: float
    order_qty: float
    order_date: str
    delivery_date: str
    vendor_type: str
    unit_cost: float
    total_cost: float
    bulk_discount_available: bool
    waste_level: str


class ProcurementResponse(BaseModel):
    items: List[ProcurementItem]
    total_procurement_cost: float
    potential_savings_bulk: float
    smart_order_list: List[Dict[str, Any]]


class CarbonItem(BaseModel):
    category: str
    quantity_kg: float
    emission_factor: float
    co2_kg: float


class CarbonResponse(BaseModel):
    items: List[CarbonItem]
    total_co2_kg: float
    trees_to_offset: int
    avg_project_co2_kg: float
    comparison_to_avg: float
    green_suggestions: List[str]


class ComplianceCheck(BaseModel):
    check: str
    status: str  # pass/fail/warning
    rule_reference: str
    details: str
    fix_suggestion: str


class ComplianceResponse(BaseModel):
    checks: List[ComplianceCheck]
    compliance_score: float
    pass_count: int
    fail_count: int
    warning_count: int


class ROIRequest(BaseModel):
    project: ProjectInput
    total_cost: float
    expected_rental_yield_annual: Optional[float] = None
    expected_sale_price: Optional[float] = None
    land_cost: Optional[float] = 0.0
    soft_costs_pct: float = 0.10


class ROIResponse(BaseModel):
    total_investment: float
    gross_roi_pct: float
    net_roi_pct: float
    breakeven_years: float
    irr_5yr: float
    irr_10yr: float
    yearly_cashflow: List[Dict[str, Any]]
    comparison: Dict[str, Any]


class ContractorInput(BaseModel):
    name: str
    projects_completed: int
    on_time_projects: int
    within_budget_projects: int
    quality_complaints: int
    safety_incidents: int
    years_experience: int
    certifications: int
    project_value_crore: float


class ContractorScore(BaseModel):
    name: str
    on_time_rate: float
    cost_adherence_rate: float
    quality_score: float
    safety_score: float
    experience_score: float
    overall_score: float
    hire_confidence: str
    star_rating: float
    breakdown: Dict[str, float]


class ContractorRequest(BaseModel):
    contractors: List[ContractorInput]


class ContractorResponse(BaseModel):
    scores: List[ContractorScore]


class WarningItem(BaseModel):
    severity: str  # yellow/orange/red
    category: str
    message: str
    recommendation: str


class WarningsRequest(BaseModel):
    project: ProjectInput
    phases: List[PhaseTimeline]
    risk_scores: Dict[str, float]
    current_date: str


class WarningsResponse(BaseModel):
    warnings: List[WarningItem]
    has_critical: bool


class AIExplainRequest(BaseModel):
    project: ProjectInput
    calculation_result: Dict[str, Any]
    language: str = "English"


class AIChatRequest(BaseModel):
    project: ProjectInput
    calculation_result: Optional[Dict[str, Any]] = None
    message: str
    chat_history: List[Dict[str, str]] = []
    language: str = "English"


class AINegotiateRequest(BaseModel):
    project: ProjectInput
    contractor_name: str
    quoted_price: float
    scope_of_work: str
    your_budget: float


class AISuggestRequest(BaseModel):
    project: ProjectInput
    suggestion_type: str = "blueprint"  # blueprint/green


class ReportRequest(BaseModel):
    project: ProjectInput
    calculation_result: Dict[str, Any]
    risk_response: Optional[Dict[str, Any]] = None
    compliance_response: Optional[Dict[str, Any]] = None
    carbon_response: Optional[Dict[str, Any]] = None
    ai_summary: Optional[str] = None


class OptimizedPhase(BaseModel):
    phase: str
    original_duration: int
    optimized_duration: int
    workers_original: int
    workers_optimized: int
    cost_savings: float


class OptimizeRequest(BaseModel):
    project: ProjectInput
    phases: List[Dict[str, Any]]
    total_cost: float
    priority: Optional[str] = None


class OptimizeResponse(BaseModel):
    optimized_phases: List[OptimizedPhase]
    total_cost_savings: float
    total_days_savings: int
    material_order_calendar: List[Dict[str, Any]]
    recommendations: List[str]
    summary: str


class FindBuildersRequest(BaseModel):
    locality: str
    project_type: str = "Residential"


class BuilderItem(BaseModel):
    name: str
    specialty: str
    rating: float
    experience_years: int
    projects_completed: int
    contact: str


class FindBuildersResponse(BaseModel):
    locality: str
    builders: List[BuilderItem]

