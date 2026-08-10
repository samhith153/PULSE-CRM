import asyncio
import json
import weakref
from typing import Dict
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.api.deps import CurrentUser

router = APIRouter()

# ---------------------------------------------------------------------------
# In-process per-user SSE subscriber registry
# Each connected browser tab gets its own asyncio.Queue. When background
# workers want to push an event they call push_sse_event(user_id, payload).
# ---------------------------------------------------------------------------
_subscriber_registry: Dict[str, list] = {}


def push_sse_event(user_id: str, payload: dict) -> None:
    """Push a payload dict to every active SSE subscriber for this user."""
    queues = _subscriber_registry.get(str(user_id), [])
    for q in list(queues):
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            pass  # drop if consumer is too slow


@router.get(
    "/dashboard",
    summary="SSE Stream for Dashboard",
    description="Maintains an open connection to stream AI and system events to the frontend."
)
async def stream_dashboard_events(request: Request, current_user: CurrentUser):
    """
    Server-Sent Events (SSE) endpoint.
    Pushes real-time updates to the dashboard when background AI workers emit events.
    """
    user_id = str(current_user.id)
    queue: asyncio.Queue = asyncio.Queue(maxsize=50)

    # Register this subscriber
    if user_id not in _subscriber_registry:
        _subscriber_registry[user_id] = []
    _subscriber_registry[user_id].append(queue)

    async def event_generator():
        try:
            # Send an initial heartbeat so the browser knows the connection is alive
            yield ": heartbeat\n\n"

            while True:
                # Stop if the client disconnected
                if await request.is_disconnected():
                    break

                try:
                    # Wait up to 25 s for an event; send a keepalive comment if nothing arrives
                    event = await asyncio.wait_for(queue.get(), timeout=25.0)
                    payload = json.dumps(event)
                    yield f"data: {payload}\n\n"
                except asyncio.TimeoutError:
                    # SSE keepalive comment — keeps the connection open through proxies
                    yield ": keepalive\n\n"

        except (asyncio.CancelledError, GeneratorExit):
            pass
        finally:
            # Always clean up to prevent memory leaks
            try:
                _subscriber_registry[user_id].remove(queue)
                if not _subscriber_registry[user_id]:
                    del _subscriber_registry[user_id]
            except (KeyError, ValueError):
                pass

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )