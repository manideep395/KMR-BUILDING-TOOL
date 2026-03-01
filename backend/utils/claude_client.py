import os
import json
from anthropic import AsyncAnthropic
from typing import AsyncGenerator

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

CLAUDE_MODEL = "claude-opus-4-5"


def build_system_prompt(project_data: dict, calc_data: dict = None, language: str = "English") -> str:
    p = project_data
    lang_note = "Respond in Hindi (Devanagari script)." if language == "Hindi" else "Respond in English."
    
    cost_info = ""
    risk_info = ""
    if calc_data:
        total = calc_data.get("total_project_cost", p.get("budget", 0))
        cost_info = f"\n- Calculated total cost: ₹{total:,.0f}"
        if "risk_scores" in calc_data:
            rs = calc_data["risk_scores"]
            risk_info = f"\n- Risk scores: Budget {rs.get('budget', 'N/A')}%, Delay {rs.get('delay', 'N/A')}%, Labor {rs.get('labor', 'N/A')}%"

    return f"""You are an expert AI construction consultant embedded in a construction intelligence platform. 
You are analyzing a {p.get('project_type', 'Residential')} project in {p.get('city', 'India')}, {p.get('state', 'India')}, India with:
- Project name: {p.get('project_name', 'Construction Project')}
- Total area: {p.get('area_sqft', 0):,.0f} sq ft across {p.get('floors', 1)} floors
- Budget: ₹{p.get('budget', 0):,.0f}
- Timeline: {p.get('start_date', 'TBD')} to {p.get('end_date', 'TBD')}
- Quality grade: {p.get('quality_grade', 'Standard')}
- Optimization mode: {p.get('optimization_priority', 'Balanced')}{cost_info}{risk_info}

Your audience includes both large construction companies and individual house builders.
Always explain in simple terms. Use Indian context (INR, Indian cities, Indian materials like OPC cement, TMT steel, AAC blocks).
Be specific, actionable, and practical. Never be vague. Format your response clearly.
{lang_note}"""


async def get_explanation(project_data: dict, calc_data: dict, language: str = "English") -> str:
    """Get a plain-language explanation of calculation results."""
    system = build_system_prompt(project_data, calc_data, language)
    total_cost = calc_data.get("total_project_cost", 0)
    
    prompt = f"""Provide a 3-5 sentence non-technical explanation of this construction project's analysis:
- Total Project Cost: ₹{total_cost:,.0f}
- Cost per sq ft: ₹{calc_data.get('cost_per_sqft', 0):,.0f}
- Project Duration: based on phase timeline

Highlight the biggest cost driver, key risks, and one actionable recommendation to optimize costs.
Keep it friendly and easy to understand for a homeowner."""

    try:
        message = await client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=512,
            system=system,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text
    except Exception as e:
        return f"AI explanation unavailable: {str(e)}"


async def stream_chat(project_data: dict, calc_data: dict, message: str,
                      chat_history: list, language: str = "English") -> AsyncGenerator[str, None]:
    """Stream a chat response from Claude."""
    system = build_system_prompt(project_data, calc_data, language)
    
    messages = []
    for h in chat_history[-10:]:  # last 10 messages
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    try:
        async with client.messages.stream(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            system=system,
            messages=messages
        ) as stream:
            async for text in stream.text_stream:
                yield text
    except Exception as e:
        yield f"AI chat unavailable: {str(e)}"


async def get_negotiation_advice(project_data: dict, contractor_name: str,
                                  quoted_price: float, scope: str, budget: float) -> dict:
    """Get contractor negotiation strategy from Claude."""
    system = build_system_prompt(project_data)
    prompt = f"""A contractor named "{contractor_name}" has quoted ₹{quoted_price:,.0f} for:
Scope: {scope}

The client's budget is ₹{budget:,.0f}.
Project context: {project_data.get('project_type')} in {project_data.get('city')}, {project_data.get('area_sqft')} sqft, {project_data.get('quality_grade')} grade.

Provide a detailed negotiation strategy including:
1. Fair market price range (based on typical rates)
2. Recommended counteroffer amount
3. Top 3 leverage points to use in negotiation
4. Red flags to watch for in this quote
5. A sample negotiation script (2-3 sentences to say to the contractor)

Format as JSON with keys: fair_market_range, recommended_counteroffer, leverage_points (list), red_flags (list), negotiation_script, summary"""

    try:
        message = await client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            system=system,
            messages=[{"role": "user", "content": prompt}]
        )
        text = message.content[0].text
        # try to parse JSON
        import re
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        return {"summary": text, "fair_market_range": f"₹{quoted_price*0.85:,.0f} - ₹{quoted_price*0.95:,.0f}",
                "recommended_counteroffer": quoted_price * 0.88, "leverage_points": [], "red_flags": [], "negotiation_script": text}
    except Exception as e:
        return {"summary": f"Negotiation AI unavailable: {str(e)}", "error": True}


async def get_blueprint_suggestions(project_data: dict) -> list:
    """Get architectural optimization suggestions from Claude."""
    system = build_system_prompt(project_data)
    prompt = f"""For a {project_data.get('project_type')} project:
- Area: {project_data.get('area_sqft')} sqft
- Floors: {project_data.get('floors')}
- Budget: ₹{project_data.get('budget'):,.0f}
- Quality: {project_data.get('quality_grade')}
- Location: {project_data.get('city')}

Provide exactly 5 architectural optimization suggestions as a JSON array.
Each suggestion: {{"title": str, "description": str, "feasibility_score": 1-10, "cost_impact": str, "savings_estimate": str}}
Focus on practical Indian construction improvements."""

    try:
        message = await client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            system=system,
            messages=[{"role": "user", "content": prompt}]
        )
        text = message.content[0].text
        import re
        arr_match = re.search(r'\[.*\]', text, re.DOTALL)
        if arr_match:
            return json.loads(arr_match.group())
        return [{"title": "Optimize Layout", "description": text[:200], "feasibility_score": 8,
                  "cost_impact": "Moderate", "savings_estimate": "5-10%"}]
    except Exception as e:
        return [{"title": "AI Unavailable", "description": str(e), "feasibility_score": 0, "cost_impact": "N/A", "savings_estimate": "N/A"}]


async def get_green_alternatives(project_data: dict, carbon_data: dict = None) -> list:
    """Get eco-friendly alternative suggestions from Claude."""
    system = build_system_prompt(project_data)
    prompt = f"""For a {project_data.get('project_type')} project in {project_data.get('city')}, {project_data.get('area_sqft')} sqft, {project_data.get('quality_grade')} grade:

Provide 5 green/eco-friendly construction alternatives as JSON array.
Each: {{"material": str, "alternative": str, "cost_delta_pct": number (+ for more expensive, - for cheaper), 
"carbon_saving_pct": number, "long_term_roi_years": number, "description": str}}
Examples: fly ash bricks, AAC blocks, solar panels, rainwater harvesting, double-glazed windows."""

    try:
        message = await client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            system=system,
            messages=[{"role": "user", "content": prompt}]
        )
        text = message.content[0].text
        import re
        arr_match = re.search(r'\[.*\]', text, re.DOTALL)
        if arr_match:
            return json.loads(arr_match.group())
        return []
    except Exception as e:
        return []


async def generate_executive_summary(project_data: dict, calc_data: dict) -> str:
    """Generate an executive summary paragraph for PDF report."""
    system = build_system_prompt(project_data, calc_data)
    prompt = f"""Write a professional 2-paragraph executive summary for a construction project report.
Project: {project_data.get('project_name')}, {project_data.get('project_type')} in {project_data.get('city')}.
Total Cost: ₹{calc_data.get('total_project_cost', 0):,.0f}, Area: {project_data.get('area_sqft')} sqft, Floors: {project_data.get('floors')}.
Include project highlights, cost analysis summary, and key recommendations. Keep professional."""
    
    try:
        message = await client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=512,
            system=system,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text
    except Exception as e:
        return f"Project: {project_data.get('project_name')} - Total Cost: ₹{calc_data.get('total_project_cost', 0):,.0f}"
