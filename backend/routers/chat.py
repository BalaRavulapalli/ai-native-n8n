import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.chat import ChatRequest
from services.llm import llm_service
from services.workflow_parser import extract_workflow_json
from services.workflow_validator import validate_workflow
from services.setup_analyzer import analyze_setup_requirements
from services.suggestion_parser import extract_suggestions

router = APIRouter(tags=["chat"])


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Streaming chat endpoint.
    Streams text chunks, then sends workflow + setup data as final events.
    """

    async def generate():
        full_response = ""

        try:
            async for event in llm_service.chat_stream(
                user_message=request.message,
                conversation_history=[msg.model_dump() for msg in request.conversation_history],
                workflow_context=request.workflow_context,
            ):
                if event["type"] == "status":
                    yield f"data: {json.dumps({'type': 'status', 'step': event['step']})}\n\n"
                    continue

                chunk = event["content"]
                full_response += chunk
                yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"

            # After streaming, check for workflow JSON
            workflow = extract_workflow_json(full_response)
            if workflow:
                validation = validate_workflow(workflow)
                setup = analyze_setup_requirements(workflow)
                suggestions = extract_suggestions(full_response)

                workflow_event = json.dumps({
                    "type": "workflow",
                    "content": workflow,
                    "validation": validation.to_dict(),
                    "credentials": setup["credentials"],
                    "config_notes": setup["config_notes"],
                    "suggestions": suggestions,
                })
                yield f"data: {workflow_event}\n\n"

            # Send done event
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/chat/sync")
async def chat_sync(request: ChatRequest):
    """Non-streaming version for testing."""
    full_response = ""
    async for event in llm_service.chat_stream(
        user_message=request.message,
        conversation_history=[msg.model_dump() for msg in request.conversation_history],
        workflow_context=request.workflow_context,
    ):
        if event["type"] == "text":
            full_response += event["content"]

    workflow = extract_workflow_json(full_response)
    validation = None
    if workflow:
        validation = validate_workflow(workflow).to_dict()

    return {
        "response": full_response,
        "workflow": workflow,
        "validation": validation,
    }
