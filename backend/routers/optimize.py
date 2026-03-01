from fastapi import APIRouter, Request
from datetime import datetime, timedelta

router = APIRouter()


@router.post("/optimize")
async def optimize_resources(request: Request):
    try:
        body = await request.json()
        project = body.get("project", {})
        phases = body.get("phases", [])
        total_cost = float(body.get("total_cost", 0))
        priority = body.get("priority") or project.get("optimization_priority", "Balanced")

        optimized_phases = []
        total_cost_savings = 0.0
        total_days_savings = 0

        for phase in phases:
            orig_dur = int(phase.get("duration_days", 30))
            orig_workers = int(phase.get("workers", 10))
            phase_name = phase.get("phase", "Unknown")

            if priority == "Minimize Cost":
                opt_dur = int(orig_dur * 1.10)
                opt_workers = max(5, int(orig_workers * 0.85))
                cost_save = total_cost * 0.04
            elif priority == "Minimize Time":
                opt_dur = max(5, int(orig_dur * 0.80))
                opt_workers = int(orig_workers * 1.25)
                cost_save = -total_cost * 0.03
            else:  # Balanced
                opt_dur = max(5, int(orig_dur * 0.95))
                opt_workers = int(orig_workers * 1.05)
                cost_save = total_cost * 0.02

            total_cost_savings += cost_save
            total_days_savings += orig_dur - opt_dur

            optimized_phases.append({
                "phase": phase_name,
                "original_duration": orig_dur,
                "optimized_duration": opt_dur,
                "workers_original": orig_workers,
                "workers_optimized": opt_workers,
                "cost_savings": round(cost_save, 2),
            })

        # Material ordering calendar
        start_str = project.get("start_date", "2025-01-01")
        try:
            start = datetime.strptime(start_str, "%Y-%m-%d")
        except ValueError:
            start = datetime.now()

        area = float(project.get("area_sqft", 1000))
        floors = int(project.get("floors", 1))

        calendar = [
            {"item": "Cement", "quantity_bags": int(area * 0.4),
             "order_date": (start - timedelta(days=7)).strftime("%Y-%m-%d"),
             "delivery_date": start.strftime("%Y-%m-%d"),
             "notes": "Order in bulk for 10% discount"},
            {"item": "Steel TMT", "quantity_mt": round(area * floors * 5 / 1000, 1),
             "order_date": (start + timedelta(days=20)).strftime("%Y-%m-%d"),
             "delivery_date": (start + timedelta(days=25)).strftime("%Y-%m-%d"),
             "notes": "Order at structure phase start"},
            {"item": "Bricks", "quantity_1000s": int(area * floors * 3 / 1000),
             "order_date": (start + timedelta(days=50)).strftime("%Y-%m-%d"),
             "delivery_date": (start + timedelta(days=55)).strftime("%Y-%m-%d"),
             "notes": "Order regionally for cost savings"},
            {"item": "Sand", "quantity_cft": int(area * 1.2),
             "order_date": (start + timedelta(days=15)).strftime("%Y-%m-%d"),
             "delivery_date": (start + timedelta(days=18)).strftime("%Y-%m-%d"),
             "notes": "Verify river sand quality"},
            {"item": "Floor Tiles", "quantity_sqft": int(area * 1.08),
             "order_date": (start + timedelta(days=180)).strftime("%Y-%m-%d"),
             "delivery_date": (start + timedelta(days=190)).strftime("%Y-%m-%d"),
             "notes": "Order after flooring layout finalized"},
        ]

        if priority == "Minimize Cost":
            recommendations = [
                "Schedule brickwork during off-peak months (Oct-Jan) for 8-12% labor savings",
                "Bulk purchase cement 3 weeks before foundation to lock in current prices",
                "Use fly ash bricks instead of red bricks - saves Rs.45 per 1000 bricks",
                "Combine MEP rough-in with structure phase to eliminate idle time",
                "Source river sand directly from quarry (saves 15-20% vs dealer price)",
            ]
        elif priority == "Minimize Time":
            recommendations = [
                "Run Structure and MEP planning phases in parallel from Week 8",
                "Add night shifts for concrete curing monitoring (reduces curing wait time)",
                "Pre-fabricate roof slab formwork off-site to save 5 setup days",
                "Use ready-mix concrete (RMC) to eliminate on-site mixing time",
                "Deploy 25% more workers at peak Structure phase for faster completion",
            ]
        else:
            recommendations = [
                "Overlap Plastering start with MEP completion (saves 8 days)",
                "Bulk order materials in 3 tranches to balance storage cost vs discount",
                "Use 2-shift model for Foundation and Structure phases only",
                "Source materials from multiple vendors to hedge price and availability risk",
                "Weekly progress review meetings to catch delays early before they compound",
            ]

        savings_label = "saved" if total_cost_savings > 0 else "additional cost"
        speed_label = "faster" if total_days_savings > 0 else "extended"

        return {
            "optimized_phases": optimized_phases,
            "total_cost_savings": round(total_cost_savings, 2),
            "total_days_savings": total_days_savings,
            "material_order_calendar": calendar,
            "recommendations": recommendations,
            "summary": f"Optimization complete: Rs.{abs(total_cost_savings):,.0f} {savings_label} | {abs(total_days_savings)} days {speed_label}",
        }

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        return {"error": str(e), "traceback": tb, "optimized_phases": [], "total_cost_savings": 0,
                "total_days_savings": 0, "material_order_calendar": [], "recommendations": [], "summary": "Optimization failed."}
