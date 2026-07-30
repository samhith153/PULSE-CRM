"""
main.py

Standalone FastAPI app entrypoint for local testing:
    uvicorn app.main:app --reload
"""

from fastapi import FastAPI

from .api import router as recommendation_router

app = FastAPI(title="PULSE — Recommendation Engine", version="0.1.0")
app.include_router(recommendation_router)


@app.get("/health")
def health():
    return {"status": "ok"}
