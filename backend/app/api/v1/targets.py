"""
Sales Targets API
Endpoints for managers to set and track per-rep targets.
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.sales_target import (
    SalesTargetCreate,
    SalesTargetUpdate,
    SalesTargetResponse,
    SalesTargetListResponse,
)
from app.services.sales_target_service import SalesTargetService

router = APIRouter()


def _viewer_role(current_user) -> str:
    """Resolve the caller's effective role (admin > manager > sales_rep)."""
    roles = {
        ur.role.name for ur in current_user.user_roles if ur.role and ur.role.name
    }
    if "admin" in roles:
        return "admin"
    if "manager" in roles:
        return "manager"
    return "sales_rep"


@router.get(
    "",
    response_model=SalesTargetListResponse,
    summary="List sales targets",
)
async def list_targets(
    current_user: CurrentUser,
    db: DBSession,
    period_type: Optional[str] = Query(None, pattern="^(monthly|quarterly|yearly)$"),
    rep_id: Optional[UUID] = None,
):
    svc = SalesTargetService(db)
    viewer_role = _viewer_role(current_user)
    team_rep_ids = None
    if viewer_role == "manager":
        team = await svc.repo.get_reps_in_org(
            current_user.organization_id, manager_id=current_user.id
        )
        team_rep_ids = [r.id for r in team]
    if viewer_role == "sales_rep":
        # Sales reps may only see their own targets — never the org-wide list.
        rep_id = current_user.id
    targets = await svc.list_targets(
        current_user.organization_id,
        period_type=period_type,
        rep_id=rep_id,
        team_rep_ids=team_rep_ids,
    )
    return SalesTargetListResponse(targets=targets, total=len(targets))


@router.get(
    "/current",
    response_model=SalesTargetListResponse,
    summary="Current period targets for all reps",
)
async def get_current_targets(
    current_user: CurrentUser,
    db: DBSession,
    period_type: str = Query("monthly", pattern="^(monthly|quarterly|yearly)$"),
):
    svc = SalesTargetService(db)
    viewer_role = _viewer_role(current_user)
    targets = await svc.get_reps_with_current_targets(
        current_user.organization_id,
        period_type=period_type,
        viewer_id=current_user.id,
        viewer_role=viewer_role,
    )
    return SalesTargetListResponse(targets=targets, total=len(targets))


@router.post(
    "",
    response_model=SalesTargetResponse,
    status_code=201,
    summary="Create a sales target",
    dependencies=[Depends(require_permission("team_performance:view"))],
)
async def create_target(
    payload: SalesTargetCreate,
    current_user: CurrentUser,
    db: DBSession,
):
    svc = SalesTargetService(db)
    return await svc.create_target(
        current_user.organization_id,
        current_user.id,
        payload,
        viewer_id=current_user.id,
        viewer_role=_viewer_role(current_user),
    )


@router.put(
    "/{target_id}",
    response_model=SalesTargetResponse,
    summary="Update a sales target",
    dependencies=[Depends(require_permission("team_performance:view"))],
)
async def update_target(
    target_id: UUID,
    payload: SalesTargetUpdate,
    current_user: CurrentUser,
    db: DBSession,
):
    svc = SalesTargetService(db)
    return await svc.update_target(
        target_id,
        current_user.organization_id,
        payload,
        viewer_id=current_user.id,
        viewer_role=_viewer_role(current_user),
    )


@router.delete(
    "/{target_id}",
    status_code=204,
    summary="Delete a sales target",
    dependencies=[Depends(require_permission("team_performance:view"))],
)
async def delete_target(
    target_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
):
    svc = SalesTargetService(db)
    await svc.delete_target(
        target_id,
        current_user.organization_id,
        viewer_id=current_user.id,
        viewer_role=_viewer_role(current_user),
    )
