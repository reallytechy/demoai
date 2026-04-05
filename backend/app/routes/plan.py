"""Financial plan generation endpoints."""

import asyncio
import logging

from fastapi import APIRouter, HTTPException, Request

from app.services.financial_plan import generate_plan, get_plan

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/plan", tags=["plan"])


def _get_user_id(request: Request) -> str:
    return request.headers.get("x-user-id", "demo-user")


@router.post("/generate")
async def generate(request: Request):
    """Generate a personalized financial plan from uploaded documents."""
    user_id = _get_user_id(request)
    try:
        plan = await asyncio.to_thread(generate_plan, user_id)
        if "error" in plan:
            raise HTTPException(status_code=400, detail=plan["error"])
        return plan
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Plan generation failed")
        msg = str(e).lower()
        if "quota" in msg or "429" in msg:
            raise HTTPException(status_code=500, detail="AI service out of credits.")
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {str(e)[:200]}")


@router.get("")
async def get_latest(request: Request):
    """Get the latest generated plan."""
    user_id = _get_user_id(request)
    plan = get_plan(user_id)
    if not plan:
        return {"has_plan": False}
    return {"has_plan": True, **plan}
