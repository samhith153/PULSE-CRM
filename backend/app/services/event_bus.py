"""
In-memory event bus with queue-ready semantics.
"""
from __future__ import annotations

import asyncio
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import Awaitable, Callable, Optional
from uuid import UUID


@dataclass(slots=True)
class EventEnvelope:
    event_id: UUID
    organization_id: UUID
    aggregate_type: str
    aggregate_id: Optional[UUID]
    event_type: str
    topic: str
    title: str
    description: Optional[str]
    payload: Optional[dict]
    source: Optional[str]
    status: str
    created_at: datetime


class EventConsumer:
    async def handle(self, event: EventEnvelope) -> None:  # pragma: no cover - interface
        raise NotImplementedError


class EventBus:
    def __init__(self) -> None:
        self._consumers: dict[str, list[EventConsumer]] = defaultdict(list)
        self._queue: asyncio.Queue[EventEnvelope] = asyncio.Queue()

    def register(self, topic: str, consumer: EventConsumer) -> None:
        self._consumers[topic].append(consumer)

    async def publish(self, event: EventEnvelope) -> None:
        await self._queue.put(event)
        await self.dispatch_once()

    async def dispatch_once(self) -> None:
        if self._queue.empty():
            return
        event = await self._queue.get()
        consumers = list(self._consumers.get(event.topic, [])) + list(self._consumers.get("*", []))
        for consumer in consumers:
            await consumer.handle(event)
        self._queue.task_done()

    async def replay(self, events: list[EventEnvelope], topic: Optional[str] = None) -> None:
        for event in events:
            if topic and event.topic != topic:
                continue
            await self.publish(event)


class LoggingEventConsumer(EventConsumer):
    async def handle(self, event: EventEnvelope) -> None:
        # Queue-ready placeholder consumer. Real integrations can subscribe here.
        return None


event_bus = EventBus()

def register_default_consumers() -> None:
    event_bus.register("*", LoggingEventConsumer())
