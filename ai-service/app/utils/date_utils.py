"""Date and time helper utilities."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Sequence, Union


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Attach UTC timezone to a naive datetime, or return None."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def days_since(dt: Optional[datetime]) -> int:
    """Compute whole days between now (UTC) and the given datetime."""
    if dt is None:
        return 0
    aware = ensure_utc(dt)
    return max(0, (datetime.now(timezone.utc) - aware).days)


def latest_timestamp(*items: Optional[datetime]) -> Optional[datetime]:
    """Return the most recent datetime from the given values."""
    latest = None
    for dt in items:
        aware = ensure_utc(dt)
        if aware is not None and (latest is None or aware > latest):
            latest = aware
    return latest


def best_time_slot_from_hours(hour_counts: dict[int, int]) -> Optional[str]:
    """Map the most frequent hour to a contact time slot string."""
    if not hour_counts:
        return None

    best_hour = max(hour_counts, key=hour_counts.get)

    if 8 <= best_hour < 10:
        return "08:00-10:00"
    elif 10 <= best_hour < 12:
        return "10:00-12:00"
    elif 14 <= best_hour < 16:
        return "14:00-16:00"
    elif 16 <= best_hour < 18:
        return "16:00-18:00"
    return "10:00-12:00"


def extract_hour_counts(items: Sequence[object], attr: str) -> dict[int, int]:
    """Count occurrence of hour-of-day from `attr` on each item."""
    hour_counts: dict[int, int] = {}
    for item in items or []:
        value = getattr(item, attr, None)
        if value is not None:
            hour_counts[value.hour] = hour_counts.get(value.hour, 0) + 1
    return hour_counts
