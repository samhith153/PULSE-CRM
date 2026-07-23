from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import Dict, Any
from datetime import datetime

from .config import config
from .models import SummariseRequest, SummariseResponse
from .agent import summarise_thread
from .database import get_summary, save_summary

# Create FastAPI app
app = FastAPI(
    title="Summarization API",
    description="Email summarisation, sentiment analysis, and intent detection",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "module": "summarization",
        "model": config.LLM_MODEL,
        "timestamp": datetime.now().isoformat()
    }

# Summarise endpoint
@app.post("/api/v1/summarization/summarise", response_model=SummariseResponse)
async def summarise(request: SummariseRequest):
    """Summarise an email thread."""
    try:
        # Check if already summarised
        existing = await get_summary(request.thread_id)
        if existing:
            return existing
        
        # Generate summary
        result = await summarise_thread(
            thread_id=request.thread_id,
            messages=request.messages,
            contact_id=request.contact_id,
            deal_id=request.deal_id
        )
        
        # Save to database
        await save_summary(result)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get summary endpoint
@app.get("/api/v1/summarization/summary/{thread_id}")
async def get_summary_by_thread(thread_id: str):
    """Get existing summary for a thread."""
    try:
        summary = await get_summary(thread_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run the app
if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=config.PORT,
        reload=True
    )