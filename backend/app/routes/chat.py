"""
Chat endpoint — sends user message through the LangGraph agent orchestrator.
Supports both regular JSON response and SSE streaming.
"""

import json
import logging
import uuid
from collections import defaultdict

from fastapi import APIRouter, HTTPException, Request
from langchain_core.messages import HumanMessage
from sse_starlette.sse import EventSourceResponse

from app.agents.orchestrator import AGENT_DISPLAY_NAMES, get_graph
from app.models.chat import ChatRequest, ChatResponse


def _get_user_id(request: Request) -> str:
    return request.headers.get("x-user-id", "demo-user")

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

# In-memory session storage (demo mode — production uses Supabase)
_sessions: dict[str, list[dict]] = defaultdict(list)


@router.post("", response_model=ChatResponse)
async def chat(request: Request, req: ChatRequest) -> ChatResponse:
    """Send a message and get a response from the AI financial coach."""
    user_id = _get_user_id(request)
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    graph = get_graph()

    # Build state with conversation history
    session_key = f"{user_id}:{req.session_id}"
    history = _sessions[session_key]
    messages = [HumanMessage(content=m["content"]) if m["role"] == "user"
                else HumanMessage(content=m["content"])  # simplified for demo
                for m in history[-20:]]  # keep last 20 messages
    messages.append(HumanMessage(content=req.message))

    state = {
        "messages": messages,
        "user_id": user_id,
        "financial_profile": {},
        "debt_records": [],
        "retrieved_context": "",
        "current_agent": "",
    }

    try:
        result = await _run_graph(graph, state)
    except Exception as e:
        logger.exception("Agent graph failed")
        raise HTTPException(status_code=500, detail=_friendly_error(e))

    # Extract response
    last_msg = result["messages"][-1]
    agent_name = getattr(last_msg, "name", None) or "orchestrator"
    content = last_msg.content if isinstance(last_msg.content, str) else str(last_msg.content)

    # Store in session
    _sessions[session_key].append({"role": "user", "content": req.message})
    _sessions[session_key].append({"role": "assistant", "content": content, "agent": agent_name})

    return ChatResponse(
        message=content,
        agent_name=agent_name,
        agent_display_name=AGENT_DISPLAY_NAMES.get(agent_name, agent_name),
        session_id=req.session_id,
    )


@router.post("/stream")
async def chat_stream(request: Request, req: ChatRequest):
    """SSE streaming version of chat — streams tokens as they arrive."""
    user_id = _get_user_id(request)
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    graph = get_graph()

    session_key = f"{user_id}:{req.session_id}"
    history = _sessions[session_key]
    messages = [HumanMessage(content=m["content"]) for m in history[-20:]]
    messages.append(HumanMessage(content=req.message))

    state = {
        "messages": messages,
        "user_id": user_id,
        "financial_profile": {},
        "debt_records": [],
        "retrieved_context": "",
        "current_agent": "",
    }

    async def event_generator():
        try:
            result = await _run_graph(graph, state)
            last_msg = result["messages"][-1]
            agent_name = getattr(last_msg, "name", None) or "orchestrator"
            content = last_msg.content if isinstance(last_msg.content, str) else str(last_msg.content)

            # Send agent info
            yield {"event": "agent", "data": json.dumps({
                "agent_name": agent_name,
                "agent_display_name": AGENT_DISPLAY_NAMES.get(agent_name, agent_name),
            })}

            # Stream content in chunks (simulated chunking for demo)
            chunk_size = 20
            for i in range(0, len(content), chunk_size):
                yield {"event": "token", "data": json.dumps({
                    "content": content[i:i + chunk_size],
                })}

            # Store in session
            _sessions[session_key].append({"role": "user", "content": req.message})
            _sessions[session_key].append({"role": "assistant", "content": content, "agent": agent_name})

            yield {"event": "done", "data": json.dumps({"session_id": req.session_id})}

        except Exception as e:
            logger.exception("Streaming agent error")
            yield {"event": "error", "data": json.dumps({"error": _friendly_error(e)})}

    return EventSourceResponse(event_generator())


@router.get("/sessions/{session_id}/history")
async def get_history(request: Request, session_id: str):
    """Get chat history for a session."""
    user_id = _get_user_id(request)
    session_key = f"{user_id}:{session_id}"
    return {"session_id": session_id, "messages": _sessions.get(session_key, [])}


@router.delete("/sessions/{session_id}")
async def clear_session(request: Request, session_id: str):
    """Clear a chat session."""
    user_id = _get_user_id(request)
    session_key = f"{user_id}:{session_id}"
    _sessions.pop(session_key, None)
    return {"status": "cleared"}


def _friendly_error(e: Exception) -> str:
    """Convert raw API errors into human-readable messages."""
    msg = str(e).lower()

    if "quota" in msg or "insufficient_quota" in msg or "exceeded" in msg:
        return (
            "The AI service has run out of credits. "
            "Please check your API billing at the provider's dashboard "
            "(OpenRouter: openrouter.ai/credits, OpenAI: platform.openai.com/settings/organization/billing)."
        )
    if "401" in msg or "unauthorized" in msg or "invalid.*key" in msg or "invalid_api_key" in msg:
        return (
            "The AI API key is invalid or expired. "
            "Please check OPENROUTER_API_KEY or OPENAI_API_KEY in backend/.env and restart the server."
        )
    if "rate_limit" in msg or "429" in msg or "too many requests" in msg:
        return (
            "Too many requests — the AI service is rate-limiting us. "
            "Please wait a moment and try again."
        )
    if "timeout" in msg or "timed out" in msg:
        return (
            "The AI service took too long to respond. "
            "Please try again or use a faster model in backend/.env."
        )
    if "connection" in msg or "connect" in msg:
        return (
            "Cannot reach the AI service. "
            "Please check your internet connection and try again."
        )
    if "model" in msg and ("not found" in msg or "does not exist" in msg):
        return (
            "The configured AI model was not found. "
            "Please check OPENROUTER_MODEL in backend/.env and restart the server."
        )

    # Fallback — still clean it up
    return f"Something went wrong with the AI service. Details: {str(e)[:200]}"


async def _run_graph(graph, state: dict) -> dict:
    """Run the LangGraph synchronously in a thread (LangGraph is sync by default)."""
    import asyncio
    return await asyncio.to_thread(graph.invoke, state)
