import asyncio
import json
from dataclasses import asdict
from uuid import UUID

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.core.logging import get_logger
from app.core.security import decode_access_token
from app.services.event_bus import event_bus

logger = get_logger(__name__)
router = APIRouter()

@router.get(
    "/dashboard",
    summary="SSE Stream for Dashboard",
    description="Maintains an open connection to stream AI and system events to the frontend."
)
async def stream_dashboard_events(request: Request):
    """
    Server-Sent Events (SSE) endpoint.
    Pushes real-time updates to the sales rep's dashboard.

    NOTE: This endpoint intentionally does NOT use the CurrentUser
    dependency which would hold a DB session open for the entire
    stream duration.  Instead it decodes the JWT directly — only the
    user ID is needed to route events.

    The token must be presented in the ``Authorization: Bearer`` header.
    Query-string tokens are rejected (never put JWTs in URLs — they leak
    into access logs, browser history and Referer headers).
    """
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        from fastapi.responses import JSONResponse
        return JSONResponse(
            {"detail": "Missing Bearer token"},
            status_code=401,
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header[7:].strip()
    try:
        payload = decode_access_token(token)
        user_id = UUID(payload["sub"])
        org_id = UUID(payload["org"])
    except Exception:
        from fastapi.responses import JSONResponse
        return JSONResponse({"detail": "Invalid token"}, status_code=401)

    async def event_generator():
        channel_name = f"org_events_{org_id}"
        subscriber = await event_bus.subscribe(channel_name)

        try:
            while True:
                if await request.is_disconnected():
                    break

                try:
                    event = await asyncio.wait_for(subscriber.get(), timeout=15.0)
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
                    continue

                if event is not None:
                    data = asdict(event) if hasattr(event, "__dataclass_fields__") else event
                    yield f"data: {json.dumps(data, default=str)}\n\n"

        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.warning("SSE stream error for org %s: %s", org_id, exc)
        finally:
            await event_bus.unsubscribe(channel_name, subscriber)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )