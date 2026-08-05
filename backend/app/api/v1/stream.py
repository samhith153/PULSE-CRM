import asyncio
import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.api.deps import CurrentUser
from app.services.event_bus import event_bus  # Integrates with your existing event bus

router = APIRouter()

@router.get(
    "/dashboard",
    summary="SSE Stream for Dashboard",
    description="Maintains an open connection to stream AI and system events to the frontend."
)
async def stream_dashboard_events(request: Request, current_user: CurrentUser):
    """
    Server-Sent Events (SSE) endpoint.
    Pushes real-time updates to the sales rep's dashboard.
    """
    async def event_generator():
        # Subscribe to the event bus specifically for this user's notifications
        channel_name = f"user_events_{current_user.id}"
        
        # We assume event_bus exposes a subscribe method returning an async iterator or queue
        subscriber = await event_bus.subscribe(channel_name)
        
        try:
            while True:
                # If the client disconnects (e.g., closes the browser tab), stop the generator
                if await request.is_disconnected():
                    break

                # Wait for the next event from the background AI workers
                event = await subscriber.get() 
                
                if event:
                    # The SSE specification strictly requires data to be formatted as 'data: <payload>\n\n'
                    # We serialize the dictionary payload to a JSON string
                    payload = json.dumps(event)
                    yield f"data: {payload}\n\n"
                
                # Prevent CPU blocking
                await asyncio.sleep(0.1)
                
        except asyncio.CancelledError:
            # Clean up the connection when the client drops unexpectedly
            pass
        finally:
            # Always unsubscribe to prevent memory leaks in the event bus
            await event_bus.unsubscribe(channel_name, subscriber)

    return StreamingResponse(
        event_generator(), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no" # Prevents reverse proxies like Nginx from buffering the stream
        }
    )