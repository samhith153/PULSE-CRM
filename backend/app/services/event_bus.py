"""In-process event bus used for local dispatch and tests.

Durable event processing is handled by EventWorker over the EventOutbox table.
"""
from __future__ import annotations

import asyncio
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from uuid import UUID

from app.core.logging import get_logger

logger = get_logger(__name__)


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
    actor_id: Optional[UUID] = None


class EventConsumer:
    async def handle(self, event: EventEnvelope) -> None:  # pragma: no cover - interface
        raise NotImplementedError


class EventBus:
    def __init__(self) -> None:
        self._consumers: dict[str, list[EventConsumer]] = defaultdict(list)
        self._queue: asyncio.Queue[EventEnvelope] = asyncio.Queue()
        self._subscribers: dict[str, set[asyncio.Queue[EventEnvelope]]] = defaultdict(set)
    async def subscribe(
        self,
        topic: str,
    ) -> asyncio.Queue[EventEnvelope]:
        subscriber: asyncio.Queue[EventEnvelope] = asyncio.Queue()
        self._subscribers[topic].add(subscriber)
        return subscriber

    async def unsubscribe(
        self,
        topic: str,
        subscriber: asyncio.Queue[EventEnvelope],
    ) -> None:
        subscribers = self._subscribers.get(topic)

        if not subscribers:
            return

        subscribers.discard(subscriber)

        if not subscribers:
            self._subscribers.pop(topic, None)
    def register(self, topic: str, consumer: EventConsumer) -> None:
        if consumer not in self._consumers[topic]:
            self._consumers[topic].append(consumer)

    async def publish(self, event: EventEnvelope) -> None:
        await self._queue.put(event)
        org_channel = f"org_events_{event.organization_id}"
        for q in self._subscribers.get(org_channel, []):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                pass
        for q in self._subscribers.get(event.topic, []):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                pass
        for q in self._subscribers.get("*", []):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                pass

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
        logger.info("In-process event dispatched", extra={"event_id": str(event.event_id), "event_type": event.event_type})


event_bus = EventBus()


def register_default_consumers() -> None:
    event_bus.register("*", LoggingEventConsumer())
