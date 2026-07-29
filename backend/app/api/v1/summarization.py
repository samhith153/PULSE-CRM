"""
Conversation Intelligence (Bhavani) — Email summarization endpoints.
POST /api/v1/summarization/summarise
GET  /api/v1/summarization/summary/{thread_id}
"""
from fastapi import APIRouter, HTTPException, status

from ai.summarization.src.agent import summarise_thread
from ai.summarization.src.database import get_summary, save_summary
from ai.summarization.src.models import SummariseRequest, SummariseResponse

router = APIRouter()


@router.post(
    "/summarise",
    response_model=SummariseResponse,
    summary="Summarize an email thread",
    description=(
        "Analyzes an email thread and returns a structured summary "
        "including sentiment, intent, key points, and suggested actions."
    ),
    status_code=status.HTTP_200_OK,
)
async def summarise(request: SummariseRequest):
    try:
        existing = await get_summary(request.thread_id)
        if existing:
            return existing

        result = await summarise_thread(
            thread_id=request.thread_id,
            messages=request.messages,
            contact_id=request.contact_id,
            deal_id=request.deal_id,
        )

        await save_summary(result)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/summary/{thread_id}",
    response_model=SummariseResponse,
    summary="Get cached summary by thread ID",
    description="Retrieves a previously generated summary from the in-memory cache.",
)
async def get_summary_by_thread(thread_id: str):
    try:
        summary = await get_summary(thread_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
