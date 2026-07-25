import logging
import json
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

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
    
    if thread_length >= 5:
        confidence += 0.3
    elif thread_length >= 3:
        confidence += 0.2
    elif thread_length >= 2:
        confidence += 0.1
    
    if has_response:
        confidence += 0.1
    
    return min(confidence, 0.95)

# =============================================
# Category Functions
# =============================================

def get_category_priority(category: str) -> int:
    """Get priority level for a category."""
    categories = {
        "urgent": 1,
        "sales": 2,
        "support": 3,
        "general": 4
    }
    return categories.get(category, 4)

def get_category_label(category: str) -> str:
    """Get human-readable category label."""
    labels = {
        "urgent": "🔥 Urgent",
        "sales": "💰 Sales",
        "support": "🛠️ Support",
        "general": "📝 General"
    }
    return labels.get(category, "📝 General")

def format_draft_reply(draft_reply: str, contact_name: str = None) -> str:
    """Format draft reply with contact name."""
    if contact_name:
        draft_reply = f"Hi {contact_name},\n\n{draft_reply}"
    return draft_reply

# =============================================
# Lead Score Mapping
# =============================================

def get_lead_score_from_category(category: str) -> int:
    """Get lead score impact from category."""
    category_weights = {
        "sales": 15,
        "urgent": 20,
        "support": -5,
        "general": 0
    }
    return category_weights.get(category, 0)

def get_lead_score_from_summary_word(summary_word: str) -> int:
    """Get lead score impact from summary word."""
    word_weights = {
        "demo_request": 25,
        "contract_signed": 30,
        "pricing_negotiation": 15,
        "interested": 20,
        "proposal": 15,
        "budget": 10,
        "meeting": 10,
        "follow_up": 5,
        "inquiry": 5,
        "introduction": 5,
        "positive": 5,
        "neutral": 0,
        "thank_you": 2,
        "referral": 10,
        "support": -5,
        "complaint": -15,
        "lost": -20,
        "negative": -10,
        "urgent": 10
    }
    return word_weights.get(summary_word, 0)

# =============================================
# ✅ NEW: Follow-up Functions
# =============================================

def get_follow_up_days(follow_up_timing: str) -> int:
    """Convert timing string to number of days."""
    timing_map = {
        "immediate": 0,
        "today": 0,
        "tomorrow": 1,
        "2_days": 2,
        "3_days": 3,
        "1_week": 7,
        "2_weeks": 14,
        "no_followup": -1
    }
    return timing_map.get(follow_up_timing, -1)

def get_follow_up_date(follow_up_timing: str) -> Optional[str]:
    """Get the suggested follow-up date."""
    days = get_follow_up_days(follow_up_timing)
    if days < 0:
        return None
    
    follow_up_date = datetime.now() + timedelta(days=days)
    return follow_up_date.strftime("%Y-%m-%d")

def get_follow_up_label(follow_up_timing: str) -> str:
    """Get human-readable label for follow-up timing."""
    labels = {
        "immediate": "⏰ Follow up immediately",
        "today": "📅 Follow up today",
        "tomorrow": "📅 Follow up tomorrow",
        "2_days": "📅 Follow up in 2 days",
        "3_days": "📅 Follow up in 3 days",
        "1_week": "📅 Follow up in 1 week",
        "2_weeks": "📅 Follow up in 2 weeks",
        "no_followup": "✅ No follow-up needed"
    }
    return labels.get(follow_up_timing, "📅 Follow up when convenient")

def get_follow_up_priority(follow_up_timing: str) -> int:
    """Get priority level for follow-up (lower number = higher priority)."""
    priority_map = {
        "immediate": 1,
        "today": 2,
        "tomorrow": 3,
        "2_days": 4,
        "3_days": 5,
        "1_week": 6,
        "2_weeks": 7,
        "no_followup": 8
    }
    return priority_map.get(follow_up_timing, 5)

def should_follow_up(follow_up_timing: str) -> bool:
    """Check if follow-up is needed."""
    return follow_up_timing != "no_followup"