import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.schemas import AIExplainRequest, AIChatRequest, AINegotiateRequest, AISuggestRequest
from utils import gemini_client as claude_client

router = APIRouter()


@router.post("/ai/explain")
async def ai_explain(request: AIExplainRequest):
    project_data = request.project.model_dump()
    calc_data = request.calculation_result
    explanation = await claude_client.get_explanation(project_data, calc_data, request.language)
    return {"explanation": explanation}


@router.post("/ai/chat")
async def ai_chat(request: AIChatRequest):
    """Streaming chat endpoint using Server-Sent Events."""
    project_data = request.project.model_dump()
    calc_data = request.calculation_result or {}

    async def generate():
        async for token in claude_client.stream_chat(
            project_data, calc_data, request.message, request.chat_history, request.language
        ):
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("/ai/negotiate")
async def ai_negotiate(request: AINegotiateRequest):
    project_data = request.project.model_dump()
    result = await claude_client.get_negotiation_advice(
        project_data, request.contractor_name, request.quoted_price,
        request.scope_of_work, request.your_budget
    )
    return result


@router.post("/ai/suggest")
async def ai_suggest(request: AISuggestRequest):
    project_data = request.project.model_dump()
    if request.suggestion_type == "blueprint":
        suggestions = await claude_client.get_blueprint_suggestions(project_data)
        return {"suggestions": suggestions, "type": "blueprint"}
    else:
        alternatives = await claude_client.get_green_alternatives(project_data)
        return {"alternatives": alternatives, "type": "green"}
