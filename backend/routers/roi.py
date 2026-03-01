from fastapi import APIRouter
from models.schemas import ROIRequest, ROIResponse
from typing import Optional

router = APIRouter()


@router.post("/roi", response_model=ROIResponse)
async def compute_roi(request: ROIRequest):
    total_construction = request.total_cost
    land = request.land_cost or 0
    soft_costs = total_construction * request.soft_costs_pct
    total_investment = total_construction + land + soft_costs

    yearly_cashflow = []
    cumulative = -total_investment

    annual_income = 0.0
    if request.expected_rental_yield_annual:
        annual_income = request.expected_rental_yield_annual
    elif request.expected_sale_price:
        annual_income = request.expected_sale_price * 0.05  # rough yield estimate

    maintenance = total_investment * 0.01  # 1% maintenance per year
    taxes = annual_income * 0.15  # 15% tax on rental income

    net_annual = annual_income - maintenance - taxes
    gross_roi = (annual_income / total_investment) * 100 if total_investment > 0 else 0
    net_roi = (net_annual / total_investment) * 100 if total_investment > 0 else 0

    breakeven = total_investment / net_annual if net_annual > 0 else 99

    # Calculate IRR approximation using NPV at different discount rates
    def npv(rate, cashflows):
        return sum(cf / (1 + rate) ** i for i, cf in enumerate(cashflows))

    cashflows_5yr = [-total_investment] + [net_annual] * 4 + [net_annual + (request.expected_sale_price or total_investment * 1.3)]
    cashflows_10yr = [-total_investment] + [net_annual] * 9 + [net_annual + (request.expected_sale_price or total_investment * 1.6)]

    def estimate_irr(cashflows):
        """Binary search for IRR (rate where NPV ≈ 0)"""
        lo, hi = 0.001, 2.0
        for _ in range(50):
            mid = (lo + hi) / 2
            if npv(mid, cashflows) > 0:
                lo = mid
            else:
                hi = mid
        return mid * 100

    irr_5yr = estimate_irr(cashflows_5yr)
    irr_10yr = estimate_irr(cashflows_10yr)

    # Yearly cashflow
    for year in range(1, 11):
        cumulative += net_annual
        if year == 1 and request.expected_sale_price:
            sale_yr = None
        else:
            sale_yr = None
        yearly_cashflow.append({
            "year": year,
            "annual_income": round(annual_income, 2),
            "expenses": round(maintenance + taxes, 2),
            "net_income": round(net_annual, 2),
            "cumulative_return": round(cumulative, 2),
            "total_investment": round(total_investment, 2),
        })

    comparison = {
        "fixed_deposit_roi": 7.0,
        "mutual_fund_roi": 12.0,
        "this_project_roi": round(irr_10yr, 1),
        "fd_10yr_value": round(total_investment * (1.07 ** 10), 2),
        "mf_10yr_value": round(total_investment * (1.12 ** 10), 2),
        "project_10yr_value": round(total_investment + net_annual * 10, 2),
    }

    return {
        "total_investment": round(total_investment, 2),
        "gross_roi_pct": round(gross_roi, 2),
        "net_roi_pct": round(net_roi, 2),
        "breakeven_years": round(breakeven, 1),
        "irr_5yr": round(irr_5yr, 2),
        "irr_10yr": round(irr_10yr, 2),
        "yearly_cashflow": yearly_cashflow,
        "comparison": comparison,
    }
