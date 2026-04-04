import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import chat, dashboard, documents, reports
from app.settings import get_settings

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="DemoAI Financial Coach API",
    description="Multi-agent AI financial advisor with RAG",
    version="0.2.0",
)

_settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(reports.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(dashboard.router)


@app.get("/health")
async def health_check() -> dict:
    return {"status": "ok", "version": "0.2.0", "agents": ["orchestrator", "debt_analyzer", "savings_strategist", "budget_advisor", "payoff_optimizer"]}
