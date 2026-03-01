import io
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.schemas import ReportRequest
from utils.gemini_client import generate_executive_summary
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT

router = APIRouter()


@router.post("/report/generate")
async def generate_report(request: ReportRequest):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm,
                            topMargin=20*mm, bottomMargin=20*mm)

    styles = getSampleStyleSheet()
    AMBER = colors.HexColor("#F59E0B")
    DARK = colors.HexColor("#0A0C0F")
    CYAN = colors.HexColor("#06B6D4")

    title_style = ParagraphStyle("Title", parent=styles["Title"], fontSize=24, textColor=AMBER, alignment=TA_CENTER, spaceAfter=4)
    h1_style = ParagraphStyle("H1", parent=styles["Heading1"], fontSize=16, textColor=AMBER, spaceBefore=12, spaceAfter=6)
    h2_style = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=12, textColor=CYAN, spaceBefore=8, spaceAfter=4)
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, spaceAfter=4)
    label_style = ParagraphStyle("Label", parent=styles["Normal"], fontSize=9, textColor=colors.grey)

    p = request.project
    calc = request.calculation_result

    # Executive Summary
    exec_summary = await generate_executive_summary(p.model_dump(), calc)

    story = []

    # Header
    story.append(Paragraph("CONSTRUCTION INTELLIGENCE REPORT", title_style))
    story.append(Paragraph(f"Project: {p.project_name}", h1_style))
    story.append(Paragraph(f"{p.project_type} | {p.city}, {p.state} | {p.quality_grade} Grade", label_style))
    story.append(HRFlowable(width="100%", thickness=2, color=AMBER))
    story.append(Spacer(1, 6))

    # KPI Summary Table
    story.append(Paragraph("PROJECT KPIs", h1_style))
    kpi_data = [
        ["Metric", "Value"],
        ["Total Project Cost", f"₹{calc.get('total_project_cost', 0):,.0f}"],
        ["Cost per sq ft", f"₹{calc.get('cost_per_sqft', 0):,.0f}"],
        ["Total Area", f"{p.area_sqft:,.0f} sq ft"],
        ["Number of Floors", str(p.floors)],
        ["Project Budget", f"₹{p.budget:,.0f}"],
        ["Timeline", f"{p.start_date} → {p.end_date}"],
        ["Optimization Priority", p.optimization_priority],
    ]
    t = Table(kpi_data, colWidths=[80*mm, 80*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), AMBER),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#1A1C1F")),
        ("TEXTCOLOR", (0, 1), (-1, -1), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    # Executive Summary
    story.append(Paragraph("EXECUTIVE SUMMARY", h1_style))
    story.append(Paragraph(exec_summary, body_style))
    story.append(Spacer(1, 8))

    # Cost Breakdown
    story.append(Paragraph("MATERIAL COST BREAKDOWN", h1_style))
    mat_data = [["Category", "Quantity", "Unit", "Unit Rate (₹)", "Total (₹)"]]
    for item in calc.get("material_costs", []):
        mat_data.append([
            item["category"], str(item["quantity"]), item["unit"],
            f"₹{item['unit_rate']:,.0f}", f"₹{item['total']:,.0f}"
        ])
    mat_data.append(["TOTAL MATERIAL", "", "", "", f"₹{calc.get('total_material_cost', 0):,.0f}"])

    mt = Table(mat_data, colWidths=[50*mm, 25*mm, 20*mm, 35*mm, 35*mm])
    mt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), CYAN),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 1), (-1, -2), colors.HexColor("#1A1C1F")),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#F59E0B")),
        ("TEXTCOLOR", (0, 1), (-1, -2), colors.white),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.black),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(mt)
    story.append(Spacer(1, 10))

    # Phase Timeline
    story.append(Paragraph("PROJECT TIMELINE", h1_style))
    phase_data = [["Phase", "Start Date", "End Date", "Duration (days)", "Workers"]]
    for ph in calc.get("phases", []):
        phase_data.append([ph["phase"], ph["start_date"], ph["end_date"], str(ph["duration_days"]), str(ph["workers"])])
    pt = Table(phase_data, colWidths=[35*mm, 35*mm, 35*mm, 35*mm, 25*mm])
    pt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), AMBER),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#1A1C1F")),
        ("TEXTCOLOR", (0, 1), (-1, -1), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(pt)
    story.append(Spacer(1, 10))

    # Risk Assessment
    if request.risk_response:
        story.append(Paragraph("RISK ASSESSMENT", h1_style))
        risk_keys = ["budget_risk", "delay_risk", "labor_risk", "weather_risk", "compliance_risk"]
        risk_data = [["Risk Category", "Score", "Level", "Key Insight"]]
        for rk in risk_keys:
            rd = request.risk_response.get(rk, {})
            if rd:
                risk_data.append([rd.get("category", rk), f"{rd.get('score', 0):.0f}/100",
                                   rd.get("level", "N/A"), rd.get("explanation", "")[:60] + "..."])
        rt = Table(risk_data, colWidths=[40*mm, 20*mm, 20*mm, 85*mm])
        rt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EF4444")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#1A1C1F")),
            ("TEXTCOLOR", (0, 1), (-1, -1), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("PADDING", (0, 0), (-1, -1), 4),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(rt)
        story.append(Spacer(1, 10))

    # Carbon Footprint
    if request.carbon_response:
        story.append(Paragraph("CARBON FOOTPRINT", h1_style))
        cr = request.carbon_response
        story.append(Paragraph(f"Total CO₂ Emissions: {cr.get('total_co2_kg', 0):,.0f} kg CO₂e", body_style))
        story.append(Paragraph(f"Trees Required to Offset: {cr.get('trees_to_offset', 0):,} trees", body_style))
        story.append(Spacer(1, 8))

    # Compliance
    if request.compliance_response:
        story.append(Paragraph("COMPLIANCE SUMMARY", h1_style))
        comp = request.compliance_response
        story.append(Paragraph(f"Compliance Score: {comp.get('compliance_score', 0):.0f}/100", body_style))
        story.append(Paragraph(f"Passed: {comp.get('pass_count', 0)}  Failed: {comp.get('fail_count', 0)}  Warnings: {comp.get('warning_count', 0)}", body_style))
        story.append(Spacer(1, 8))

    # Footer
    story.append(HRFlowable(width="100%", thickness=1, color=AMBER))
    story.append(Paragraph("Generated by AI Construction Intelligence Platform • Powered by Gemini AI", label_style))

    doc.build(story)
    buf.seek(0)

    filename = f"{p.project_name.replace(' ', '_')}_Report.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
