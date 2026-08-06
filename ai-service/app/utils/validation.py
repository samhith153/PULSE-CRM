"""Input validation helpers."""
from __future__ import annotations

import re
from typing import Optional


def validate_thread_id(thread_id: str) -> bool:
    """A valid thread id is non-empty and at least 3 characters."""
    return bool(thread_id) and len(thread_id) >= 3


def validate_message_direction(direction: str) -> bool:
    """Direction must be one of incoming/outgoing."""
    return direction in {"incoming", "outgoing"}


def is_valid_uuid(value: str) -> bool:
    """Check whether a string looks like a UUID (any hex variant)."""
    if not value:
        return False
    pattern = re.compile(
        r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    )
    return bool(pattern.match(value))


def clamp_score(score: float, lower: float = 0, upper: float = 100) -> float:
    """Clamp a numeric score into [lower, upper]."""
    return max(lower, min(upper, score))
