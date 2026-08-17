"""
Notifications routes — list, unread count, mark-read, mark-all-read, dismiss.
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import StandardResponse
from app.schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get(
    "",
    response_model=StandardResponse[NotificationListResponse],
    summary="List the current user's notifications",
    dependencies=[Depends(require_permission("notification:read"))],
)
async def list_notifications(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    unread_only: bool = Query(default=False),
) -> dict:
    service = NotificationService(db)
    items, total, unread_count = await service.list_for_user(
        current_user.organization_id,
        current_user.id,
        page,
        page_size,
        unread_only=unread_only,
    )
    data = NotificationListResponse(
        items=[NotificationResponse.model_validate(item) for item in items],
        total=total,
        unread_count=unread_count,
    )
    return {"success": True, "message": "OK", "data": data}


@router.get(
    "/unread-count",
    response_model=StandardResponse[UnreadCountResponse],
    summary="Get the current user's unread notification count",
    dependencies=[Depends(require_permission("notification:read"))],
)
async def unread_count(current_user: CurrentUser, db: DBSession) -> dict:
    service = NotificationService(db)
    count = await service.unread_count(current_user.organization_id, current_user.id)
    return {"success": True, "message": "OK", "data": UnreadCountResponse(unread_count=count)}


@router.post(
    "/{notification_id}/read",
    response_model=StandardResponse[NotificationResponse],
    summary="Mark a single notification as read",
    dependencies=[Depends(require_permission("notification:read"))],
)
async def mark_read(notification_id: UUID, current_user: CurrentUser, db: DBSession) -> dict:
    service = NotificationService(db)
    notification = await service.mark_read(notification_id, current_user.organization_id, current_user.id)
    return {
        "success": True,
        "message": "Notification marked as read.",
        "data": NotificationResponse.model_validate(notification),
    }


@router.post(
    "/read-all",
    response_model=StandardResponse[dict],
    summary="Mark all of the current user's notifications as read",
    dependencies=[Depends(require_permission("notification:read"))],
)
async def mark_all_read(current_user: CurrentUser, db: DBSession) -> dict:
    service = NotificationService(db)
    updated = await service.mark_all_read(current_user.organization_id, current_user.id)
    return {"success": True, "message": "All notifications marked as read.", "data": {"updated": updated}}


@router.delete(
    "",
    response_model=StandardResponse[dict],
    summary="Dismiss (hide) all notifications for the current user",
    dependencies=[Depends(require_permission("notification:read"))],
)
async def dismiss_all_notifications(current_user: CurrentUser, db: DBSession) -> dict:
    service = NotificationService(db)
    dismissed = await service.dismiss_all(current_user.organization_id, current_user.id)
    return {"success": True, "message": "All notifications dismissed.", "data": {"dismissed": dismissed}}


@router.delete(
    "/{notification_id}",
    response_model=StandardResponse[NotificationResponse],
    summary="Dismiss (hide) a notification",
    dependencies=[Depends(require_permission("notification:read"))],
)
async def dismiss_notification(notification_id: UUID, current_user: CurrentUser, db: DBSession) -> dict:
    service = NotificationService(db)
    notification = await service.dismiss(notification_id, current_user.organization_id, current_user.id)
    return {
        "success": True,
        "message": "Notification dismissed.",
        "data": NotificationResponse.model_validate(notification),
    }
