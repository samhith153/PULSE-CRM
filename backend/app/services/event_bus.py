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
    description: str | None = None
    payload: dict[str, Any] = field(default_factory=dict)
    source: str | None = None
    status: str | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)


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
        # SSE subscribers: channel_name -> set of asyncio.Queue
        self._subscribers: dict[str, set[asyncio.Queue]] = defaultdict(set)

        # Pending envelopes waiting to be dispatched to persistent consumers
        self._pending: list[EventEnvelope] = []

        # Persistent consumers registered at startup
        self._consumers: list[EventConsumer] = []

    # ------------------------------------------------------------------
    # SSE subscription API (used by stream.py)
    # ------------------------------------------------------------------

    async def subscribe(self, channel: str) -> asyncio.Queue:
        """Create and register a new queue for the given channel."""
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers[channel].add(q)
        logger.debug(
            "EventBus: subscribed to channel '%s' (total=%d)",
            channel, len(self._subscribers[channel]),
        )
        return q

    async def unsubscribe(self, channel: str, queue: asyncio.Queue) -> None:
        """Remove a subscriber queue from the channel."""
        self._subscribers[channel].discard(queue)
        if not self._subscribers[channel]:
            self._subscribers.pop(channel, None)
        logger.debug("EventBus: unsubscribed from channel '%s'", channel)

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

    # ------------------------------------------------------------------
    # Consumer dispatch API (used by EventWorker)
    # ------------------------------------------------------------------

    def register_consumer(self, consumer: EventConsumer) -> None:
        self._consumers.append(consumer)

    def enqueue(self, envelope: EventEnvelope) -> None:
        """Enqueue an envelope to be dispatched on the next dispatch_once() call."""
        self._pending.append(envelope)

    async def dispatch_once(self) -> None:
        """Fan-out all pending envelopes to registered consumers and clear the queue."""
        if not self._pending:
            return
        batch, self._pending = self._pending, []
        for envelope in batch:
            for consumer in self._consumers:
                try:
                    await consumer.handle(envelope)
                except Exception as exc:
                    logger.warning(
                        "EventBus: consumer %s raised for event %s: %s",
                        type(consumer).__name__, envelope.event_id, exc,
                    )


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

event_bus = EventBus()


def register_default_consumers() -> None:
    """
    Called once at application startup to wire up persistent consumers.
    Extend this function to register LoggingConsumer, MetricsConsumer, etc.
    Currently a no-op — consumers are instantiated per-event in EventWorker
    for database session scoping reasons.
    """
    pass
