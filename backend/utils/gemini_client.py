import os
import json
import re
import asyncio
from typing import Any, AsyncGenerator, Optional

import google.genai as genai  # type: ignore[import-untyped]
from google.genai import types  # type: ignore[import-untyped]
from groq import Groq  # type: ignore[import-untyped]

# Configure Gemini client
_gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY", ""))
_groq = Groq(api_key=os.getenv("GROQ_API_KEY", ""))

GEMINI_MODEL = "gemini-1.5-flash"
GROQ_MODEL = "llama-3.1-8b-instant"  # fast, free-tier Groq model


def _format_error(e: Exception) -> str:
    """Return a short human-readable error message instead of raw API JSON."""
    msg = str(e)
    if "RESOURCE_EXHAUSTED" in msg or "429" in msg:
        return "AI quota exceeded — switching to backup AI provider."
    if "API_KEY" in msg or "INVALID_ARGUMENT" in msg:
        return "Invalid API key. Check your .env file."
    if "UNAVAILABLE" in msg or "503" in msg:
        return "AI service temporarily unavailable."
    return msg[:120] + "..." if len(msg) > 120 else msg  # type: ignore[index]


async def _generate_with_fallback(prompt: str, system: str) -> str:
    """Try Gemini first; fall back to Groq on any error."""
    loop = asyncio.get_running_loop()
    # 1. Try Gemini
    try:
        response = await loop.run_in_executor(
            None,
            lambda: _gemini.models.generate_content(  # type: ignore[arg-type]
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(system_instruction=system),
            )
        )
        return response.text or ""
    except Exception:
        pass  # Fall through to Groq

    # 2. Fall back to Groq
    try:
        completion = await loop.run_in_executor(
            None,
            lambda: _groq.chat.completions.create(  # type: ignore[arg-type]
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=1024,
                temperature=0.7,
            )
        )
        return completion.choices[0].message.content or ""
    except Exception as e:
        return f"[AI unavailable: {_format_error(e)}]"



def build_system_prompt(project_data: dict, calc_data: Optional[dict] = None, language: str = "English") -> str:
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
- Total Project Cost: Rs.{total_cost:,.0f}
- Cost per sq ft: Rs.{calc_data.get('cost_per_sqft', 0):,.0f}
- Project Duration: based on phase timeline

Highlight the biggest cost driver, key risks, and one actionable recommendation to optimize costs.
Keep it friendly and easy to understand for a homeowner."""
    return await _generate_with_fallback(prompt, system)


async def stream_chat(project_data: dict, calc_data: dict, message: str,
                      chat_history: list[Any], language: str = "English") -> AsyncGenerator[str, None]:
    """Stream a chat response from Gemini."""
    system = build_system_prompt(project_data, calc_data, language)

    # Build Gemini chat history format
    history: list[types.Content] = []
    for h in chat_history[-10:]:  # type: ignore[index]
        role = "user" if h["role"] == "user" else "model"
        history.append(types.Content(role=role, parts=[types.Part(text=h["content"])]))

    try:
        chat = _gemini.chats.create(
            model=GEMINI_MODEL,
            config=types.GenerateContentConfig(system_instruction=system),
            history=history,
        )
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: chat.send_message(message)  # type: ignore[arg-type]
        )
        text = response.text or ""
        chunk_size = 50
        for i in range(0, len(text), chunk_size):
            yield text[i:i + chunk_size]
    except Exception:
        # Fallback: use Groq for chat
        try:
            loop = asyncio.get_running_loop()
            msgs = [{"role": "system", "content": system}]
            for h in chat_history[-6:]:  # type: ignore[index]
                msgs.append({"role": h["role"], "content": h["content"]})
            msgs.append({"role": "user", "content": message})
            completion = await loop.run_in_executor(
                None,
                lambda: _groq.chat.completions.create(  # type: ignore[arg-type]
                    model=GROQ_MODEL, messages=msgs, max_tokens=1024, temperature=0.7
                )
            )
            text = completion.choices[0].message.content or ""
            for i in range(0, len(text), 50):
                yield text[i:i + 50]
        except Exception as e:
            yield f"AI chat unavailable: {_format_error(e)}"


async def get_negotiation_advice(project_data: dict, contractor_name: str,
                                  quoted_price: float, scope: str, budget: float) -> dict:
    """Get contractor negotiation strategy from Gemini."""
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

    text = await _generate_with_fallback(prompt, system)
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except Exception:
            pass
    return {
        "summary": text if text and not text.startswith("[AI") else "AI negotiation unavailable",
        "fair_market_range": f"Rs.{quoted_price*0.85:,.0f} - Rs.{quoted_price*0.95:,.0f}",
        "recommended_counteroffer": quoted_price * 0.88,
        "leverage_points": [],
        "red_flags": [],
        "negotiation_script": text
    }


async def get_blueprint_suggestions(project_data: dict) -> list:
    """Get architectural optimization suggestions from Gemini."""
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

    text = await _generate_with_fallback(prompt, system)
    arr_match = re.search(r'\[.*\]', text, re.DOTALL)
    if arr_match:
        try:
            return json.loads(arr_match.group())
        except Exception:
            pass
    return [{"title": "Optimize Layout", "description": text[:200] if text else "AI unavailable",
             "feasibility_score": 8, "cost_impact": "Moderate", "savings_estimate": "5-10%"}]


async def get_green_alternatives(project_data: dict, carbon_data: Optional[dict] = None) -> list:
    """Get eco-friendly alternative suggestions from Gemini."""
    system = build_system_prompt(project_data)
    prompt = f"""For a {project_data.get('project_type')} project in {project_data.get('city')}, {project_data.get('area_sqft')} sqft, {project_data.get('quality_grade')} grade:

Provide 5 green/eco-friendly construction alternatives as JSON array.
Each: {{"material": str, "alternative": str, "cost_delta_pct": number (+ for more expensive, - for cheaper),
"carbon_saving_pct": number, "long_term_roi_years": number, "description": str}}
Examples: fly ash bricks, AAC blocks, solar panels, rainwater harvesting, double-glazed windows."""

    try:
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: _client.models.generate_content(  # type: ignore[arg-type]
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(system_instruction=system),
            )
        )
        text = response.text or ""
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
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: _client.models.generate_content(  # type: ignore[arg-type]
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(system_instruction=system),
            )
        )
        return response.text or ""
        return response.text or ""
    except Exception as e:
        return f"Project: {project_data.get('project_name')} - Total Cost: ₹{calc_data.get('total_project_cost', 0):,.0f}"

async def find_nearby_builders(locality: str, project_type: str = "Residential") -> list:
    """Get a simulated list of local builders in a given locality using Gemini/Groq."""
    prompt = f"""You are a local construction contractor directory database operating in India.
Provide EXACTLY 4 highly realistic-sounding construction companies / builders that operate in or near '{locality}'.
Focus specifically on builders specializing in '{project_type}' projects.

Each builder must be formatted as a JSON object in an array:
{{
  "name": "Builder Name (e.g., Apex Constructions)",
  "specialty": "Short description of specialty (e.g., Premium Residential Homes)",
  "rating": a float between 3.5 and 5.0,
  "experience_years": integer between 3 and 35,
  "projects_completed": integer between 10 and 500,
  "contact": "A realistic-looking 10-digit Indian mobile number starting with 9 or 8 (e.g., '+91 98765 43210')"
}}

Respond with ONLY the JSON array. Do not include markdown formatting or extra text."""
    system = "You are a specialized contractor database API that returns only raw JSON lists of realistic contractor data based on locality."

    text = await _generate_with_fallback(prompt, system)
    arr_match = re.search(r'\[.*\]', text, re.DOTALL)
    if arr_match:
        try:
            return json.loads(arr_match.group())
        except Exception:
            pass

    # Safe fallback if AI fails or returns malformed response
    return [
        {"name": f"{locality} Premium Builders", "specialty": f"{project_type} Experts", "rating": 4.5, "experience_years": 12, "projects_completed": 45, "contact": "+91 98765 00001"},
        {"name": "Metro Infra Solutions", "specialty": "Turnkey Construction", "rating": 4.2, "experience_years": 8, "projects_completed": 20, "contact": "+91 98765 00002"},
        {"name": "Apex Constructions", "specialty": "Budget Homes & Renovations", "rating": 3.8, "experience_years": 5, "projects_completed": 15, "contact": "+91 98765 00003"}
    ]
