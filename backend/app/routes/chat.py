"""
Chat endpoint — sends user message through the LangGraph agent orchestrator.
Supports both regular JSON response and SSE streaming.
"""

import json
import logging
import uuid
from collections import defaultdict

from fastapi import APIRouter, HTTPException
from langchain_core.messages import HumanMessage
from sse_starlette.sse import EventSourceResponse

from app.agents.orchestrator import AGENT_DISPLAY_NAMES, get_graph
from app.models.chat import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

# In-memory session storage (demo mode — production uses Supabase)
_sessions: dict[str, list[dict]] = defaultdict(list)


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    """Send a message and get a response from the AI financial coach."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    graph = get_graph()

    # Build state with conversation history
    history = _sessions[req.session_id]
    messages = [HumanMessage(content=m["content"]) if m["role"] == "user"
                else HumanMessage(content=m["content"])  # simplified for demo
                for m in history[-20:]]  # keep last 20 messages
    messages.append(HumanMessage(content=req.message))

    state = {
        "messages": messages,
        "user_id": "demo-user",
        "financial_profile": {},
        "debt_records": [],
        "retrieved_context": "",
        "current_agent": "",
    }

    try:
        result = await _run_graph(graph, state)
    except Exception as e:
        logger.exception("Agent graph failed")
        raise HTTPException(status_code=500, detail=f"Agent error: {e}")

    # Extract response
    last_msg = result["messages"][-1]
    agent_name = getattr(last_msg, "name", None) or "orchestrator"
    content = last_msg.content if isinstance(last_msg.content, str) else str(last_msg.content)

    # Store in session
    _sessions[req.session_id].append({"role": "user", "content": req.message})
    _sessions[req.session_id].append({"role": "assistant", "content": content, "agent": agent_name})

    return ChatResponse(
        message=content,
        agent_name=agent_name,
        agent_display_name=AGENT_DISPLAY_NAMES.get(agent_name, agent_name),
        session_id=req.session_id,
    )


@router.post("/stream")
async def chat_stream(req: ChatRequest):
    """SSE streaming version of chat — streams tokens as they arrive."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    graph = get_graph()

    history = _sessions[req.session_id]
    messages = [HumanMessage(content=m["content"]) for m in history[-20:]]
    messages.append(HumanMessage(content=req.message))

    state = {
        "messages": messages,
        "user_id": "demo-user",
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
            _sessions[req.session_id].append({"role": "user", "content": req.message})
            _sessions[req.session_id].append({"role": "assistant", "content": content, "agent": agent_name})

            yield {"event": "done", "data": json.dumps({"session_id": req.session_id})}

        except Exception as e:
            logger.exception("Streaming agent error")
            yield {"event": "error", "data": json.dumps({"error": str(e)})}

    return EventSourceResponse(event_generator())


@router.get("/sessions/{session_id}/history")
async def get_history(session_id: str):
    """Get chat history for a session."""
    return {"session_id": session_id, "messages": _sessions.get(session_id, [])}


@router.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    """Clear a chat session."""
    _sessions.pop(session_id, None)
    return {"status": "cleared"}


async def _run_graph(graph, state: dict) -> dict:
    """Run the LangGraph synchronously in a thread (LangGraph is sync by default)."""
    import asyncio
    return await asyncio.to_thread(graph.invoke, state)
