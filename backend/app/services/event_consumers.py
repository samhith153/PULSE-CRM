"""
Event consumers for the queue-ready event bus.
"""
from __future__ import annotations

from app.services.event_bus import EventConsumer, EventEnvelope


class TimelineProjectionConsumer(EventConsumer):
    async def handle(self, event: EventEnvelope) -> None:
        return None


class EmailProjectionConsumer(EventConsumer):
    async def handle(self, event: EventEnvelope) -> None:
        return None
