"""
In-memory event bus for Server-Sent Events (SSE) and outbox event dispatch.

Responsibilities:
  - EventEnvelope: typed payload carried from the outbox worker to consumers
  - EventConsumer: base class for consumers (timeline, email, logging, etc.)
  - EventBus: fan-out broker used by the SSE stream endpoint and the outbox worker
  - event_bus: module-level singleton
  - register_default_consumers: startup hook (no-op, extend as needed)
"""
from __future__ import annotations

import asyncio
import logging
from abc import ABC, abstractmethod
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from uuid import UUID

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# EventEnvelope
# ---------------------------------------------------------------------------

@dataclass
class EventEnvelope:
    """Typed wrapper around a raw outbox event row."""
    event_id: UUID
    organization_id: UUID | None
    aggregate_type: str
    aggregate_id: UUID | None
    event_type: str
    topic: str
    title: str
    description: str | None
    payload: dict | None
    source: str | None
    status: str
    created_at: datetime
    actor_id: UUID | None = None


# ---------------------------------------------------------------------------
# EventConsumer
# ---------------------------------------------------------------------------

class EventConsumer(ABC):
    """Base class for event consumers. Implement `handle` to process events."""

    @abstractmethod
    async def handle(self, event: EventEnvelope) -> None:
        ...


# ---------------------------------------------------------------------------
# EventBus
# ---------------------------------------------------------------------------

class EventBus:
    """
    Dual-purpose in-memory broker:

    1. SSE subscriptions — frontend clients subscribe to a named channel and
       receive JSON payloads pushed by background workers.
    2. dispatch_once() — drains a pending queue of EventEnvelopes, fanning them
       out to any registered persistent consumers.
    """

    def __init__(self) -> None:
        self._consumers: dict[str, list[EventConsumer]] = defaultdict(list)
        self._queue: asyncio.Queue[EventEnvelope] = asyncio.Queue()
        self._subscribers: dict[str, set[asyncio.Queue[EventEnvelope]]] = defaultdict(set)
        # Pending envelopes waiting to be dispatched to persistent consumers
        self._pending: list[EventEnvelope] = []
        # Persistent consumers registered at startup
        self._persistent_consumers: list[EventConsumer] = []

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

    def register_consumer(self, consumer: EventConsumer) -> None:
        self._persistent_consumers.append(consumer)

    def enqueue(self, envelope: EventEnvelope) -> None:
        """Enqueue an envelope to be dispatched on the next dispatch_once() call."""
        self._pending.append(envelope)

    async def publish(self, channel: str, event: Any) -> None:
        """Broadcast an event dict to all SSE subscribers on the given channel."""
        queues = self._subscribers.get(channel, set())
        for q in list(queues):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                logger.warning(
                    "EventBus: queue full for channel '%s', dropping event", channel
                )

    def subscriber_count(self, channel: str) -> int:
        return len(self._subscribers.get(channel, set()))
    async def dispatch_once(self) -> None:
        """Fan-out all pending envelopes to registered consumers and clear the queue."""
        if not self._pending:
            return
        batch, self._pending = self._pending, []
        for envelope in batch:
            for consumer in self._persistent_consumers:
                try:
                    await consumer.handle(envelope)
                except Exception as exc:
                    logger.warning(
                        "EventBus: consumer %s raised for event %s: %s",
                        type(consumer).__name__, envelope.event_id, exc,
                    )


class LoggingEventConsumer(EventConsumer):
    async def handle(self, event: EventEnvelope) -> None:
        logger.info("In-process event dispatched", extra={"event_id": str(event.event_id), "event_type": event.event_type})


event_bus = EventBus()


def register_default_consumers() -> None:
    """
    Called once at application startup to wire up persistent consumers.
    Extend this function to register LoggingConsumer, MetricsConsumer, etc.
    Currently a no-op — consumers are instantiated per-event in EventWorker
    for database session scoping reasons.
    """
    pass
