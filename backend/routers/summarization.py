import sys
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from fastapi import APIRouter, HTTPException
from ai.summarization.src.models import SummariseRequest, SummariseResponse
from ai.summarization.src.agent import summarise_thread as _summarise_thread
from ai.summarization.src.database import get_summary, save_summary

router = APIRouter(prefix="/api/v1/summarization", tags=["conversation-intelligence"])

@router.post("/summarise", response_model=SummariseResponse)
async def summarise(request: SummariseRequest):
    try:
        existing = await get_summary(request.thread_id)
        if existing:
            return existing

        result = await _summarise_thread(
            thread_id=request.thread_id,
            messages=request.messages,
            contact_id=request.contact_id,
            deal_id=request.deal_id
        )

        await save_summary(result)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/{thread_id}", response_model=SummariseResponse)
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
