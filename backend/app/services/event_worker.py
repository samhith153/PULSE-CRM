"""
Background event worker helpers.
"""
from __future__ import annotations

import asyncio
from typing import Optional

from app.services.event_bus import EventBus, event_bus


class EventWorker:
    def __init__(self, bus: Optional[EventBus] = None) -> None:
        self.bus = bus or event_bus

    async def run_once(self) -> None:
        await self.bus.dispatch_once()

    async def run_forever(self, sleep_seconds: float = 1.0) -> None:  # pragma: no cover - loop helper
        while True:
            await self.run_once()
            await asyncio.sleep(sleep_seconds)
