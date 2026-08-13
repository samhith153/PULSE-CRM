"""
SalesTarget Service
Business logic for managing sales rep targets and computing progress.
"""
from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateException, NotFoundException, ForbiddenException
from app.core.logging import get_logger
from app.models.deal import Deal
from app.models.sales_target import SalesTarget
from app.models.user import User
from app.repositories.sales_target_repository import SalesTargetRepository
from app.schemas.sales_target import SalesTargetCreate, SalesTargetUpdate, SalesTargetResponse

logger = get_logger(__name__)


def _current_period_dates(period_type: str, ref_date: Optional[date] = None) -> tuple[date, date]:
    """Return (period_start, period_end) for the period containing ref_date."""
    d = ref_date or date.today()
    if period_type == "monthly":
        start = d.replace(day=1)
        if d.month == 12:
            end = d.replace(year=d.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end = d.replace(month=d.month + 1, day=1) - timedelta(days=1)
    elif period_type == "quarterly":
        q = (d.month - 1) // 3
        start_month = q * 3 + 1
        start = d.replace(month=start_month, day=1)
        end_month = start_month + 2
        if end_month > 12:
            end = d.replace(year=d.year + 1, month=end_month - 12, day=1) - timedelta(days=1)
        else:
            end = d.replace(month=end_month + 1, day=1) - timedelta(days=1)
    else:  # yearly
        start = d.replace(month=1, day=1)
        end = d.replace(month=12, day=31)
    return start, end


def _achievement_status(
    actual: Decimal, target: Decimal, pct: Decimal
) -> str:
    if target <= 0:
        return "not_started"
    if pct >= 100:
        return "achieved" if pct < 150 else "exceeded"
    if pct >= 80:
        return "on_track"
    return "behind"


class SalesTargetService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = SalesTargetRepository(db)

    # ΓöÇΓöÇ Helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    async def _get_reps_with_actuals(
        self,
        organization_id: UUID,
        period_start: date,
        period_end: date,
        targets: List[SalesTarget],
    ) -> dict[UUID, Decimal]:
        """Sum won deal amounts per rep in the period."""
        if not targets:
            return {}
        rep_ids = [t.rep_id for t in targets]
        stmt = (
            select(
                Deal.owner_id,
                func.coalesce(func.sum(Deal.amount), 0).label("total"),
            )
            .where(
                Deal.organization_id == organization_id,
                Deal.owner_id.in_(rep_ids),
                Deal.status == "won",
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
                Deal.created_at >= period_start,
                Deal.created_at < period_end + timedelta(days=1),
            )
            .group_by(Deal.owner_id)
        )
        result = await self.db.execute(stmt)
        return {row.owner_id: Decimal(str(row.total)) for row in result}

    async def _enrich_target(self, target: SalesTarget, actuals: dict[UUID, Decimal]) -> SalesTargetResponse:
        actual = actuals.get(target.rep_id, Decimal("0"))
        target_amt = Decimal(str(target.target_amount))
        pct = (actual / target_amt * 100) if target_amt > 0 else Decimal("0")
        remaining = max(target_amt - actual, Decimal("0"))
        status = _achievement_status(actual, target_amt, pct)

        return SalesTargetResponse(
            id=target.id,
            rep_id=target.rep_id,
            rep_name=(target.rep.full_name or "").strip() if target.rep else "Unknown",
            rep_email=target.rep.email if target.rep else "",
            target_type=target.target_type,
            target_amount=target_amt,
            period_type=target.period_type,
            period_start=target.period_start,
            period_end=target.period_end,
            notes=target.notes,
            actual_amount=actual,
            achievement_pct=round(pct, 1),
            remaining=remaining,
            status=status,
            created_at=target.created_at.isoformat() if target.created_at else "",
        )

    # ΓöÇΓöÇ CRUD ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    async def list_targets(
        self,
        organization_id: UUID,
        *,
        period_type: Optional[str] = None,
        rep_id: Optional[UUID] = None,
        team_rep_ids: Optional[List[UUID]] = None,
    ) -> List[SalesTargetResponse]:
        targets = await self.repo.list_by_org(organization_id, period_type=period_type, rep_id=rep_id)
        if team_rep_ids is not None:
            targets = [t for t in targets if t.rep_id in team_rep_ids]
        if not targets:
            return []
        actuals = await self._get_reps_with_actuals(
            organization_id,
            min(t.period_start for t in targets),
            max(t.period_end for t in targets),
            targets,
        )
        return [await self._enrich_target(t, actuals) for t in targets]

    async def get_reps_with_current_targets(
        self,
        organization_id: UUID,
        period_type: str = "monthly",
        ref_date: Optional[date] = None,
        viewer_id: Optional[UUID] = None,
        viewer_role: Optional[str] = None,
    ) -> List[SalesTargetResponse]:
        """Return all reps with their current-period target (or empty target if not set).

        Scoping: admins see every sales rep in the org, managers see only the reps
        assigned to them, sales reps see only themselves.
        """
        manager_id = viewer_id if viewer_role == "manager" else None
        rep_user_id = viewer_id if viewer_role == "sales_rep" else None
        start, end = _current_period_dates(period_type, ref_date)
        pairs = await self.repo.get_reps_with_targets(
            organization_id, period_type, start,
            manager_id=manager_id,
            rep_user_id=rep_user_id,
        )
        actuals = await self._get_reps_with_actuals(organization_id, start, end, [t for _, t in pairs if t])

        responses = []
        for rep, target in pairs:
            if target:
                responses.append(await self._enrich_target(target, actuals))
            else:
                responses.append(SalesTargetResponse(
                    id=None,
                    rep_id=rep.id,
                    rep_name=(rep.full_name or "").strip(),
                    rep_email=rep.email,
                    target_type="revenue",
                    target_amount=Decimal("0"),
                    period_type=period_type,
                    period_start=start,
                    period_end=end,
                    actual_amount=actuals.get(rep.id, Decimal("0")),
                    achievement_pct=Decimal("0"),
                    remaining=Decimal("0"),
                    status="not_started",
                    created_at="",
                ))
        return responses

    async def create_target(
        self,
        organization_id: UUID,
        created_by: UUID,
        payload: SalesTargetCreate,
        viewer_id: Optional[UUID] = None,
        viewer_role: Optional[str] = None,
    ) -> SalesTargetResponse:
        if viewer_role not in ("manager", "admin"):
            raise ForbiddenException("Only managers and admins can assign targets.")
        if viewer_role == "manager":
            rep = await self.db.get(User, payload.rep_id)
            if not rep or rep.manager_id != viewer_id:
                raise ForbiddenException("You can only assign targets to sales reps on your team.")

        existing = await self.repo.get_active_by_rep_and_period(
            organization_id, payload.rep_id, payload.period_type, payload.period_start
        )
        if existing:
            raise DuplicateException("SalesTarget", "period", f"{payload.period_type} starting {payload.period_start}")

        try:
            return await self._insert_target(
                organization_id, created_by, payload, viewer_id, viewer_role
            )
        except IntegrityError as exc:
            # Race: two concurrent creates for the same rep+period. The unique
            # constraint fires instead of the check above -> surface a clean 409.
            await self.db.rollback()
            raise DuplicateException(
                "SalesTarget", "period",
                f"{payload.period_type} starting {payload.period_start}",
            ) from exc

    async def _insert_target(
        self,
        organization_id: UUID,
        created_by: UUID,
        payload: SalesTargetCreate,
        viewer_id: Optional[UUID] = None,
        viewer_role: Optional[str] = None,
    ) -> SalesTargetResponse:
        target = SalesTarget(
            organization_id=organization_id,
            created_by=created_by,
            rep_id=payload.rep_id,
            target_type=payload.target_type,
            target_amount=payload.target_amount,
            period_type=payload.period_type,
            period_start=payload.period_start,
            period_end=payload.period_end,
            notes=payload.notes,
        )
        self.db.add(target)
        await self.db.flush()
        await self.db.refresh(target)

        # Load relationships
        target.rep = await self.db.get(User, target.rep_id)

        actuals = await self._get_reps_with_actuals(
            organization_id, target.period_start, target.period_end, [target]
        )
        logger.info("Target created: rep=%s type=%s amount=%s", target.rep_id, target.target_type, target.target_amount)
        return await self._enrich_target(target, actuals)

    async def update_target(
        self,
        target_id: UUID,
        organization_id: UUID,
        payload: SalesTargetUpdate,
        viewer_id: Optional[UUID] = None,
        viewer_role: Optional[str] = None,
    ) -> SalesTargetResponse:
        target = await self.repo.get_by_id_and_org(target_id, organization_id)
        if not target:
            raise NotFoundException("SalesTarget", target_id)

        if viewer_role not in ("manager", "admin"):
            raise ForbiddenException("Only managers and admins can update targets.")
        if viewer_role == "manager" and target.rep_id:
            rep = await self.db.get(User, target.rep_id)
            if not rep or rep.manager_id != viewer_id:
                raise ForbiddenException("You can only update targets for sales reps on your team.")

        if payload.target_amount is not None:
            target.target_amount = payload.target_amount
        if payload.notes is not None:
            target.notes = payload.notes

        await self.db.flush()
        await self.db.refresh(target)
        target.rep = await self.db.get(User, target.rep_id)

        actuals = await self._get_reps_with_actuals(
            organization_id, target.period_start, target.period_end, [target]
        )
        return await self._enrich_target(target, actuals)

    async def delete_target(
        self,
        target_id: UUID,
        organization_id: UUID,
        viewer_id: Optional[UUID] = None,
        viewer_role: Optional[str] = None,
    ) -> None:
        target = await self.repo.get_by_id_and_org(target_id, organization_id)
        if not target:
            raise NotFoundException("SalesTarget", target_id)

        if viewer_role not in ("manager", "admin"):
            raise ForbiddenException("Only managers and admins can delete targets.")
        if viewer_role == "manager" and target.rep_id:
            rep = await self.db.get(User, target.rep_id)
            if not rep or rep.manager_id != viewer_id:
                raise ForbiddenException("You can only delete targets for sales reps on your team.")

        # Hard-delete so a new target for the same rep+period can be created
        # (the uq_target_rep_period unique constraint would otherwise block it).
        await self.db.delete(target)
        await self.db.flush()
        logger.info("Target deleted: id=%s", target_id)
