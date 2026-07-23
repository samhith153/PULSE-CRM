import logging
import json
from datetime import datetime
from typing import Any, Dict

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def log_summarisation(
    thread_id: str,
    status: str,
    duration_ms: int,
    **kwargs
) -> None:
    """Structured logging for summarisation events."""
    log_entry = {
        "module": "summarization",
        "thread_id": thread_id,
        "status": status,
        "duration_ms": duration_ms,
        "timestamp": datetime.now().isoformat(),
        **kwargs
    }
    logger.info(json.dumps(log_entry))

def calculate_confidence(thread_length: int, has_response: bool) -> float:
    """Calculate confidence based on thread characteristics."""
    confidence = 0.5
    
    # More messages = more context = higher confidence
    if thread_length >= 5:
        confidence += 0.3
    elif thread_length >= 3:
        confidence += 0.2
    elif thread_length >= 2:
        confidence += 0.1
    
    # Has response = better context
    if has_response:
        confidence += 0.1
    
    return min(confidence, 0.95)