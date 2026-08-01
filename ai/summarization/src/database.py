# src/database.py - Temporary in-memory storage
from typing import Optional
from .models import SummariseResponse

# In-memory storage for testing
_summaries = {}

async def get_summary(thread_id: str) -> Optional[SummariseResponse]:
    """Get existing summary from memory."""
    return _summaries.get(thread_id)

async def save_summary(summary: SummariseResponse) -> None:
    """Save summary to memory."""
    _summaries[summary.thread_id] = summary