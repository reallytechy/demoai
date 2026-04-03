from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import reports
from app.settings import get_settings

app = FastAPI(
    title="Credit Score API",
    description="Backend for the Do AI credit score app",
    version="0.1.0",
)

_settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(reports.router)


@app.get("/health")
async def health_check() -> dict:
    return {"status": "ok"}
