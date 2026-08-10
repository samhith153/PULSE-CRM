"""Task routes."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DBSession
from app.schemas.common import PaginatedResponse, StandardResponse
from app.schemas.task import TaskCreateRequest, TaskResponse, TaskUpdateRequest
from app.services.task_service import TaskService

router = APIRouter()


@router.get("", response_model=StandardResponse[PaginatedResponse[TaskResponse]], summary="List tasks")
async def list_tasks(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    owner_id: Optional[UUID] = Query(default=None),
    status: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None),
) -> dict:
    tasks, total = await TaskService(db).list(
        current_user,
        owner_id=owner_id,
        status=status,
        priority=priority,
        page=page,
        page_size=page_size,
    )
    return {
        "success": True,
        "message": "OK",
        "data": PaginatedResponse.create(data=[TaskResponse.model_validate(t) for t in tasks], total=total, page=page, page_size=page_size),
    }


@router.post("", response_model=StandardResponse[TaskResponse], status_code=status.HTTP_201_CREATED, summary="Create task")
async def create_task(payload: TaskCreateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    task = await TaskService(db).create(current_user, payload)
    return {"success": True, "message": "Task created.", "data": TaskResponse.model_validate(task)}


@router.get("/{task_id}", response_model=StandardResponse[TaskResponse], summary="Get task")
async def get_task(task_id: UUID, current_user: CurrentUser, db: DBSession) -> dict:
    task = await TaskService(db).get(current_user, task_id)
    return {"success": True, "message": "OK", "data": TaskResponse.model_validate(task)}


@router.put("/{task_id}", response_model=StandardResponse[TaskResponse], summary="Update task")
async def update_task(task_id: UUID, payload: TaskUpdateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    task = await TaskService(db).update(current_user, task_id, payload)
    return {"success": True, "message": "Task updated.", "data": TaskResponse.model_validate(task)}


@router.delete("/{task_id}", response_model=StandardResponse[dict], summary="Delete task")
async def delete_task(task_id: UUID, current_user: CurrentUser, db: DBSession) -> dict:
    await TaskService(db).delete(current_user, task_id)
    return {"success": True, "message": "Task deleted.", "data": {}}
