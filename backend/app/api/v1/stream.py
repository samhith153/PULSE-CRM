import asyncio
import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.api.deps import CurrentUser
from app.services.event_bus import event_bus

router = APIRouter()

HEARTBEAT_INTERVAL = 25  # seconds — keeps the connection alive through proxies/browsers


@router.get(
    "/dashboard",
    summary="SSE Stream for Dashboard",
    description="Maintains an open connection to stream AI and system events to the frontend.",
)
async def stream_dashboard_events(request: Request, current_user: CurrentUser):
    """
    Server-Sent Events (SSE) endpoint.
    Pushes real-time LEAD_SCORE_UPDATED / DEAL_AT_RISK events to the dashboard.
    Token auth is handled via ?token= query param (native EventSource can't set headers).
    """
    channel_name = f"user_events_{current_user.id}"

    async def event_generator():
        subscriber = await event_bus.subscribe(channel_name)
        try:
            while True:
                if await request.is_disconnected():
                    break

                try:
                    # Wait up to HEARTBEAT_INTERVAL seconds for an event
                    event = await asyncio.wait_for(subscriber.get(), timeout=HEARTBEAT_INTERVAL)
                    payload = json.dumps(event)
                    yield f"data: {payload}\n\n"
                except asyncio.TimeoutError:
                    # Send a comment-line keepalive so the connection stays open
                    yield ": ping\n\n"

        except asyncio.CancelledError:
            pass
        finally:
            await event_bus.unsubscribe(channel_name, subscriber)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # prevent nginx buffering
        },
    )
