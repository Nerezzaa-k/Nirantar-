import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes.ai_routes import router as ai_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nirantar.ai")

app = FastAPI(
    title="Nirantar v3 AI Reasoning & Recommendation Service",
    description="Python FastAPI service providing AI-assisted risk explanation, reason classification, and intervention recommendations",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "nirantar-ai-service",
        "version": "3.0.0",
        "openai_configured": bool(settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY.strip()) > 10),
        "model": settings.OPENAI_MODEL
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
