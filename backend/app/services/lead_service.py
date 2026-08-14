"""
Lead Management Service
"""
import asyncio
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import BusinessRuleException, ConflictException, DuplicateException, ForbiddenException, NotFoundException
from app.core.logging import get_logger
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.user import User
from app.repositories.company_repository import CompanyRepository
from app.repositories.contact_repository import ContactRepository
from app.repositories.deal_repository import DealRepository
from app.repositories.lead_repository import LeadRepository
from app.repositories.pipeline_repository import PipelineRepository
from app.repositories.user_repository import UserRepository
from app.schemas.lead import LeadAssignRequest, LeadCreateRequest, LeadStatusUpdateRequest, LeadUpdateRequest
from app.services.timeline_engine_service import TimelineEngineService
from app.utils.enums import ActivityEntityType, ActivityType, DealStatus, LeadStatus, PipelineStageSlug

logger = get_logger(__name__)

# Valid status transitions (Finite State Machine)
VALID_TRANSITIONS: dict[LeadStatus, list[LeadStatus]] = {
    LeadStatus.NEW: [LeadStatus.CONTACTED, LeadStatus.LOST],
    LeadStatus.CONTACTED: [LeadStatus.QUALIFIED, LeadStatus.LOST],
    LeadStatus.QUALIFIED: [LeadStatus.PROPOSAL_SENT, LeadStatus.LOST],
    LeadStatus.PROPOSAL_SENT: [LeadStatus.NEGOTIATION, LeadStatus.LOST],
    LeadStatus.NEGOTIATION: [LeadStatus.WON, LeadStatus.LOST],
    LeadStatus.WON: [],
    LeadStatus.LOST: [],
}

# ΓöÇΓöÇ Background-task infrastructure ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
_lead_ai_tasks: set[asyncio.Task] = set()


async def _lead_ai_compute(lead_id: UUID, organization_id: UUID, created_by: UUID, trigger: str = "lead_updated") -> None:
    """Run unified assessment pipeline in a fresh DB session, off the request path."""
    from app.core.concurrency import assessment_semaphore
    from app.database.connection import AsyncSessionFactory
    from app.services.ai_pipeline import run_lead_assessment

    try:
        async with assessment_semaphore:
            async with AsyncSessionFactory() as db:
                try:
                    await run_lead_assessment(db, lead_id, organization_id, created_by, trigger=trigger)
                except Exception as exc:
                    logger.warning(
                        "Background AI assessment failed for lead %s: %s",
                        lead_id, exc,
                    )
                await db.commit()
    except Exception as exc:
        logger.warning("Background AI session failed for lead %s: %s", lead_id, exc)


def _enqueue_lead_ai(lead_id: UUID, organization_id: UUID, created_by: UUID, trigger: str = "lead_updated") -> None:
    """Fire-and-forget assessment; does NOT block the caller."""
    task = asyncio.create_task(_lead_ai_compute(lead_id, organization_id, created_by, trigger=trigger))
    _lead_ai_tasks.add(task)
    task.add_done_callback(_lead_ai_tasks.discard)


# ── Batch lead assessment (for daily batch jobs) ────────────────────────────────

async def _batch_lead_assessment(
    db: AsyncSession,
    organization_id: UUID,
    lead_ids: list[UUID],
) -> None:
    """Run unified assessment pipeline for multiple leads in a single transaction."""
    from app.services.ai_pipeline import run_lead_assessment

    for lead_id in lead_ids:
        try:
            await run_lead_assessment(db, lead_id, organization_id, None, trigger="daily_refresh")
        except Exception as exc:
            logger.warning("Batch assessment failed for lead %s: %s", lead_id, exc)


class LeadService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = LeadRepository(db)
        self.deal_repo = DealRepository(db)
        self.pipeline_repo = PipelineRepository(db)
        self.timeline = TimelineEngineService(db)
        self.company_repo = CompanyRepository(db)
        self.contact_repo = ContactRepository(db)
        self.user_repo = UserRepository(db)

    # ΓöÇΓöÇ RBAC helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    def _has_elevated_access(self, user: User) -> bool:
        roles = {ur.role.name for ur in user.user_roles if ur.role}
        return bool({"admin", "manager"}.intersection(roles))

    def _assert_ownership(self, user: User, owner_id: Optional[UUID], created_by: Optional[UUID]) -> None:
        if self._has_elevated_access(user):
            return
        if owner_id != user.id and created_by != user.id:
            raise ForbiddenException("You do not have access to this lead.")

    def _scoped_owner_id(self, user: User) -> Optional[UUID]:
        """Returns owner_id filter for non-elevated users (sales_rep sees own only)."""
        return None if self._has_elevated_access(user) else user.id

    async def create(
        self,
        payload: LeadCreateRequest,
        organization_id: UUID,
        created_by: UUID,
    ) -> Lead:
        data = payload.model_dump(exclude_none=True)
        if data.get("email"):
            data["email"] = str(data["email"]).strip().lower()
        if data.get("email") and await self.repo.get_by_email_in_org(data["email"], organization_id):
            raise DuplicateException("Lead", "email", data["email"])
        if data.get("phone") and await self.repo.get_by_phone_in_org(data["phone"], organization_id):
            raise DuplicateException("Lead", "phone", data["phone"])

        # Default owner to the creator if not explicitly assigned
        if not data.get("owner_id"):
            data["owner_id"] = created_by

        await self._validate_relations(
            organization_id,
            data.get("company_id"),
            data.get("contact_id"),
            data.get("owner_id"),
        )

        lead = await self.repo.create(
            **data,
            organization_id=organization_id,
            created_by=created_by,
        )
        lead = await self.repo.get_active_by_id(lead.id, organization_id)

        await self.timeline.record_activity(
            organization_id=organization_id,
            created_by=created_by,
            entity_type=ActivityEntityType.LEAD.value,
            entity_id=lead.id,
            action=ActivityType.LEAD_CREATED.value,
            title="Lead created",
            description=f"Lead '{lead.title}' was created.",
            payload={"lead_id": str(lead.id)},
            topic="lead",
        )
        if lead.owner_id:
            await self.timeline.record_activity(
                organization_id=organization_id,
                created_by=created_by,
                entity_type=ActivityEntityType.LEAD.value,
                entity_id=lead.id,
                action=ActivityType.LEAD_ASSIGNED.value,
                title="Lead assigned",
                description=f"Lead '{lead.title}' was assigned to a user.",
                payload={"lead_id": str(lead.id), "owner_id": str(lead.owner_id)},
                topic="lead",
            )
        # Fire-and-forget: unified assessment pipeline
        _enqueue_lead_ai(lead.id, organization_id, created_by, trigger="lead_created")
        logger.info("Lead created", extra={"lead_id": str(lead.id)})
        return lead

    async def list(
        self,
        user: User,
        search: Optional[str],
        status: Optional[LeadStatus],
        owner_id: Optional[UUID],
        company_id: Optional[UUID],
        contact_id: Optional[UUID],
        page: int,
        page_size: int,
    ) -> Tuple[List[Lead], int]:
        effective_owner_id = owner_id or self._scoped_owner_id(user)
        return await self.repo.list_by_organization(
            user.organization_id, search, status, effective_owner_id, company_id, contact_id, page, page_size
        )

    async def get(self, lead_id: UUID, user: User) -> Lead:
        lead = await self.repo.get_active_by_id(lead_id, user.organization_id)
        if not lead:
            raise NotFoundException("Lead", lead_id)
        self._assert_ownership(user, lead.owner_id, lead.created_by)
        return lead

    async def update(self, lead_id: UUID, user: User, payload: LeadUpdateRequest) -> Lead:
        lead = await self.get(lead_id, user)
        update_data = payload.model_dump(exclude_none=True)

        if update_data.get("email"):
            update_data["email"] = str(update_data["email"]).strip().lower()
        if "email" in update_data and update_data["email"] != lead.email:
            existing = await self.repo.get_by_email_in_org(update_data["email"], user.organization_id)
            if existing and existing.id != lead_id:
                raise DuplicateException("Lead", "email", update_data["email"])
        if "phone" in update_data and update_data["phone"] != lead.phone:
            existing = await self.repo.get_by_phone_in_org(update_data["phone"], user.organization_id)
            if existing and existing.id != lead_id:
                raise DuplicateException("Lead", "phone", update_data["phone"])

        await self._validate_relations(
            user.organization_id,
            update_data.get("company_id"),
            update_data.get("contact_id"),
            update_data.get("owner_id"),
        )

        if "status" in update_data:
            update_data.pop("status")

        await self.repo.update(lead, **update_data)
        if update_data:
            await self.timeline.record_activity(
                organization_id=user.organization_id,
                created_by=lead.created_by,
                entity_type=ActivityEntityType.LEAD.value,
                entity_id=lead.id,
                action=ActivityType.LEAD_UPDATED.value,
                title="Lead updated",
                description=f"Lead '{lead.title}' was updated.",
                payload={"lead_id": str(lead.id), "changes": list(update_data.keys())},
                topic="lead",
            )
        # Fire-and-forget: unified assessment pipeline
        _enqueue_lead_ai(lead.id, user.organization_id, lead.created_by, trigger="lead_updated")
        return await self.get(lead_id, user)

    async def update_status(
        self,
        lead_id: UUID,
        user: User,
        payload: LeadStatusUpdateRequest,
    ) -> Lead:
        lead = await self.get(lead_id, user)
        current_status = LeadStatus(lead.status)
        new_status = payload.status

        allowed = VALID_TRANSITIONS.get(current_status, [])
        if new_status not in allowed:
            raise BusinessRuleException(
                f"Cannot transition lead from '{current_status}' to '{new_status}'. Allowed transitions: {[s.value for s in allowed] or 'none' }.",
                details={"current": current_status.value, "requested": new_status.value},
            )

        if new_status in (LeadStatus.WON, LeadStatus.LOST) and not payload.close_reason:
            raise BusinessRuleException("A close_reason is required when marking a lead as Won or Lost.")

        update_kwargs = {"status": new_status.value}
        if payload.close_reason:
            update_kwargs["close_reason"] = payload.close_reason

        await self.repo.update(lead, **update_kwargs)
        await self.timeline.record_activity(
            organization_id=user.organization_id,
            created_by=lead.created_by,
            entity_type=ActivityEntityType.LEAD.value,
            entity_id=lead.id,
            action=ActivityType.LEAD_UPDATED.value,
            title="Lead status updated",
            description=f"Lead '{lead.title}' changed status to {new_status.value}.",
            payload={"lead_id": str(lead.id), "status": new_status.value},
            topic="lead",
        )
        # Fire-and-forget: unified assessment pipeline
        _enqueue_lead_ai(lead.id, user.organization_id, lead.created_by, trigger="lead_updated")

        logger.info("Lead status updated", extra={"lead_id": str(lead_id), "new_status": new_status.value})
        return await self.get(lead_id, user)

    async def assign(
        self,
        lead_id: UUID,
        user: User,
        payload: LeadAssignRequest,
    ) -> Lead:
        lead = await self.get(lead_id, user)
        owner = await self.user_repo.get_by_id_with_roles(payload.owner_id)
        if not owner or owner.organization_id != user.organization_id:
            raise NotFoundException("User (owner)", payload.owner_id)

        await self.repo.update(lead, owner_id=payload.owner_id)
        await self.timeline.record_activity(
            organization_id=user.organization_id,
            created_by=lead.created_by,
            entity_type=ActivityEntityType.LEAD.value,
            entity_id=lead.id,
            action=ActivityType.LEAD_ASSIGNED.value,
            title="Lead assigned",
            description=f"Lead '{lead.title}' was assigned to {owner.full_name}.",
            payload={"lead_id": str(lead.id), "owner_id": str(owner.id)},
            topic="lead",
        )
        return lead

    async def delete(self, lead_id: UUID, user: User) -> None:
        lead = await self.get(lead_id, user)

        # Sales reps can only soft-delete (archive) leads
        if user.primary_role == "sales_rep":
            await self.repo.soft_delete(lead)
            logger.info("Lead archived (sales rep)", extra={"lead_id": str(lead_id)})
        elif lead.status == LeadStatus.CONVERTED.value:
            await self.repo.soft_delete(lead)
            logger.info("Lead archived", extra={"lead_id": str(lead_id)})
        else:
            await self.repo.delete(lead)
            logger.info("Lead hard-deleted", extra={"lead_id": str(lead_id)})

    # ------------------------------------------------------------------
    # Recycle bin (admin-only): permanently remove soft-deleted leads
    # ------------------------------------------------------------------

    def _assert_admin(self, user: User) -> None:
        """Only admins may permanently purge soft-deleted data.

        Check the full role set (not just ``primary_role``) so the guard is
        independent of role ordering on the user record.
        """
        if "admin" not in {r.name for r in user.roles}:
            raise ForbiddenException("Only admins can permanently delete soft-deleted leads.")

    async def list_deleted(
        self,
        user: User,
        search: Optional[str],
        page: int,
        page_size: int,
    ) -> Tuple[List[Lead], int]:
        """List soft-deleted leads in the org (admin only)."""
        self._assert_admin(user)
        return await self.repo.list_deleted_by_org(
            user.organization_id, search, page, page_size
        )

    async def hard_delete(self, lead_id: UUID, user: User) -> None:
        """Permanently delete a single soft-deleted lead (admin only)."""
        self._assert_admin(user)
        lead = await self.repo.get_deleted_by_id(lead_id, user.organization_id)
        if not lead:
            raise NotFoundException("Lead", lead_id)
        await self.repo.delete(lead)
        logger.info("Lead permanently deleted (admin)", extra={"lead_id": str(lead_id)})

    async def purge_deleted(self, user: User) -> int:
        """Permanently delete ALL soft-deleted leads in the org (admin only).

        Always refetch page 1: deleting rows shifts the remaining rows up, so an
        offset-based ``page += 1`` would skip every other batch of 100.
        """
        self._assert_admin(user)
        count = 0
        while True:
            leads, _ = await self.repo.list_deleted_by_org(
                user.organization_id, None, 1, 100
            )
            if not leads:
                break
            for lead in leads:
                await self.repo.delete(lead)
                count += 1
        logger.info("Purged %d soft-deleted leads (admin)", count)
        return count

    async def convert_to_deal(
        self,
        lead_id: UUID,
        user: User,
        industry: Optional[str] = None,
        revenue: Optional[float] = None,
        employee_count: Optional[int] = None,
        pipeline_stage_id: Optional[str] = None,
    ) -> Deal:
        organization_id = user.organization_id
        created_by = user.id
        tx_context = self.db.begin_nested() if self.db.in_transaction() else self.db.begin()
        async with tx_context:
            lead = await self.get(lead_id, user)

            if lead.status == LeadStatus.CONVERTED.value:
                raise ConflictException("Lead has already been converted into a deal.")

            existing = await self.deal_repo.get_by_lead_id_in_org(lead_id, organization_id)
            if existing:
                raise ConflictException("Lead has already been converted into a deal.")

            # ΓöÇΓöÇ Resolve / create Company ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
            company_id = lead.company_id
            if not company_id and lead.company_name:
                existing_company = await self.company_repo.get_by_name_in_org(
                    lead.company_name, organization_id
                )
                if existing_company:
                    company_id = existing_company.id
                else:
                    # A company with this name may exist but be soft-deleted
                    # (invisible to get_by_name_in_org, yet still occupying the
                    # unique slot uq_company_name_per_org). Reuse it instead of
                    # hitting an IntegrityError on INSERT.
                    deleted_company = await self.company_repo.get_by_name_in_org_include_deleted(
                        lead.company_name, organization_id
                    )
                    if deleted_company:
                        if deleted_company.is_deleted:
                            await self.company_repo.update(
                                deleted_company,
                                is_deleted=False,
                                is_active=True,
                            )
                        company_id = deleted_company.id
                    else:
                        try:
                            company = await self.company_repo.create(
                                name=lead.company_name,
                                industry=industry or lead.industry,
                                employee_count=employee_count or lead.employee_count,
                                annual_revenue=str(revenue) if revenue is not None else None,
                                organization_id=organization_id,
                                created_by=created_by,
                            )
                            company_id = company.id
                        except IntegrityError:
                            # Another request created this company concurrently.
                            # Surface a clear message instead of a raw DB error.
                            raise DuplicateException(
                                "Company", "name", lead.company_name
                            )

            # ΓöÇΓöÇ Resolve / create Contact ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
            contact_id = lead.contact_id
            if not contact_id and lead.email:
                existing_contact = await self.contact_repo.get_by_email_in_org(
                    lead.email, organization_id
                )
                if existing_contact:
                    contact_id = existing_contact.id
                else:
                    parts = (lead.title or "").strip().split(None, 1)
                    first_name = parts[0] if parts else lead.title or ""
                    last_name = parts[1] if len(parts) > 1 else ""
                    contact = await self.contact_repo.create(
                        first_name=first_name,
                        last_name=last_name,
                        email=lead.email,
                        phone=lead.phone or "",
                        job_title=lead.job_title,
                        company_id=company_id,
                        organization_id=organization_id,
                        created_by=created_by,
                        owner_id=lead.owner_id or created_by,
                    )
                    contact_id = contact.id

            # ΓöÇΓöÇ Find pipeline stage ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
            if pipeline_stage_id:
                stage = await self.pipeline_repo.get_by_id(UUID(pipeline_stage_id))
            else:
                stage = await self.pipeline_repo.get_by_slug(PipelineStageSlug.NEW.value, organization_id)
            if not stage:
                from app.services.pipeline_service import PipelineService

                stage = (await PipelineService(self.db).ensure_default_stages(organization_id, created_by))[0]

            # ΓöÇΓöÇ Create Deal ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
            deal = await self.deal_repo.create(
                name=lead.title or lead.company_name or "Untitled Deal",
                description=lead.description,
                status=DealStatus.OPEN.value,
                amount=revenue or lead.estimated_value,
                currency=lead.currency,
                probability=min(max((lead.lead_score.overall_score if lead.lead_score else 50), 0), 100),
                notes=lead.notes,
                owner_id=lead.owner_id,
                company_id=company_id,
                contact_id=contact_id,
                lead_id=lead.id,
                pipeline_stage_id=stage.id,
                organization_id=organization_id,
                created_by=created_by,
            )
            deal = await self.deal_repo.get_active_by_id(deal.id, organization_id)

            # ΓöÇΓöÇ Update company with conversion details ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
            if company_id:
                company = await self.company_repo.get_active_by_id(company_id, organization_id)
                if company:
                    comp_updates = {}
                    if industry is not None:
                        comp_updates["industry"] = industry
                    if revenue is not None:
                        comp_updates["annual_revenue"] = str(revenue)
                    if employee_count is not None:
                        comp_updates["employee_count"] = employee_count
                    if comp_updates:
                        await self.company_repo.update(company, **comp_updates)

            # ΓöÇΓöÇ Mark lead as converted ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
            lead_updates = {"status": LeadStatus.CONVERTED.value}
            if industry is not None:
                lead_updates["industry"] = industry
            if employee_count is not None:
                lead_updates["employee_count"] = employee_count
            await self.repo.update(lead, **lead_updates)

            await self.timeline.record_activity(
                organization_id=organization_id,
                created_by=created_by,
                entity_type=ActivityEntityType.LEAD.value,
                entity_id=lead.id,
                action=ActivityType.LEAD_CONVERTED.value,
                title="Lead converted",
                description=f"Lead '{lead.title}' was converted into a deal.",
                payload={"lead_id": str(lead.id), "deal_id": str(deal.id)},
                topic="conversion",
            )
            await self.timeline.record_activity(
                organization_id=organization_id,
                created_by=created_by,
                entity_type=ActivityEntityType.DEAL.value,
                entity_id=deal.id,
                action="created_from_lead",
                title="Lead converted to deal",
                description=f"Lead '{lead.title}' was converted into deal '{deal.name}'.",
                payload={"lead_id": str(lead.id), "deal_id": str(deal.id)},
                topic="conversion",
            )

            logger.info("Lead converted to deal", extra={"lead_id": str(lead.id), "deal_id": str(deal.id)})
            return deal

    async def _validate_relations(
        self,
        organization_id: UUID,
        company_id: Optional[UUID],
        contact_id: Optional[UUID],
        owner_id: Optional[UUID],
    ) -> None:
        if company_id:
            company = await self.company_repo.get_active_by_id(company_id, organization_id)
            if not company:
                raise BusinessRuleException(f"Company '{company_id}' not found.")

        if contact_id:
            contact = await self.contact_repo.get_active_by_id(contact_id, organization_id)
            if not contact:
                raise BusinessRuleException(f"Contact '{contact_id}' not found.")

        if owner_id:
            owner = await self.user_repo.get_by_id_with_roles(owner_id)
            if not owner or owner.organization_id != organization_id:
                raise BusinessRuleException(f"Owner (user) '{owner_id}' not found.")
