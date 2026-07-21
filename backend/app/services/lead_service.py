"""
Lead Management Service
"""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, ConflictException, NotFoundException
from app.core.logging import get_logger
from app.models.deal import Deal
from app.models.lead import Lead
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

    async def create(
        self,
        payload: LeadCreateRequest,
        organization_id: UUID,
        created_by: UUID,
    ) -> Lead:
        await self._validate_relations(
            organization_id,
            payload.company_id,
            payload.contact_id,
            payload.owner_id,
        )

        lead = await self.repo.create(
            **payload.model_dump(exclude_none=True),
            organization_id=organization_id,
            created_by=created_by,
        )
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
        logger.info("Lead created", extra={"lead_id": str(lead.id)})
        return lead

    async def list(
        self,
        organization_id: UUID,
        search: Optional[str],
        status: Optional[LeadStatus],
        owner_id: Optional[UUID],
        company_id: Optional[UUID],
        contact_id: Optional[UUID],
        page: int,
        page_size: int,
    ) -> Tuple[List[Lead], int]:
        return await self.repo.list_by_organization(
            organization_id, search, status, owner_id, company_id, contact_id, page, page_size
        )

    async def get(self, lead_id: UUID, organization_id: UUID) -> Lead:
        lead = await self.repo.get_active_by_id(lead_id, organization_id)
        if not lead:
            raise NotFoundException("Lead", lead_id)
        return lead

    async def update(self, lead_id: UUID, organization_id: UUID, payload: LeadUpdateRequest) -> Lead:
        lead = await self.get(lead_id, organization_id)
        update_data = payload.model_dump(exclude_none=True)

        await self._validate_relations(
            organization_id,
            update_data.get("company_id"),
            update_data.get("contact_id"),
            update_data.get("owner_id"),
        )

        if "status" in update_data:
            update_data.pop("status")

        await self.repo.update(lead, **update_data)
        if update_data:
            await self.timeline.record_activity(
                organization_id=organization_id,
                created_by=lead.created_by,
                entity_type=ActivityEntityType.LEAD.value,
                entity_id=lead.id,
                action=ActivityType.LEAD_UPDATED.value,
                title="Lead updated",
                description=f"Lead '{lead.title}' was updated.",
                payload={"lead_id": str(lead.id), "changes": list(update_data.keys())},
                topic="lead",
            )
        return lead

    async def update_status(
        self,
        lead_id: UUID,
        organization_id: UUID,
        payload: LeadStatusUpdateRequest,
    ) -> Lead:
        lead = await self.get(lead_id, organization_id)
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
            organization_id=organization_id,
            created_by=lead.created_by,
            entity_type=ActivityEntityType.LEAD.value,
            entity_id=lead.id,
            action=ActivityType.LEAD_UPDATED.value,
            title="Lead status updated",
            description=f"Lead '{lead.title}' changed status to {new_status.value}.",
            payload={"lead_id": str(lead.id), "status": new_status.value},
            topic="lead",
        )
        logger.info("Lead status updated", extra={"lead_id": str(lead_id), "new_status": new_status.value})
        return lead

    async def assign(
        self,
        lead_id: UUID,
        organization_id: UUID,
        payload: LeadAssignRequest,
    ) -> Lead:
        lead = await self.get(lead_id, organization_id)
        owner = await self.user_repo.get_by_id_with_roles(payload.owner_id)
        if not owner or owner.organization_id != organization_id:
            raise NotFoundException("User (owner)", payload.owner_id)

        await self.repo.update(lead, owner_id=payload.owner_id)
        await self.timeline.record_activity(
            organization_id=organization_id,
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

    async def delete(self, lead_id: UUID, organization_id: UUID) -> None:
        lead = await self.get(lead_id, organization_id)
        await self.repo.soft_delete(lead)
        logger.info("Lead deleted", extra={"lead_id": str(lead_id)})

    async def convert_to_deal(self, lead_id: UUID, organization_id: UUID, created_by: UUID) -> Deal:
        tx_context = self.db.begin_nested() if self.db.in_transaction() else self.db.begin()
        async with tx_context:
            lead = await self.get(lead_id, organization_id)

            if lead.status == LeadStatus.CONVERTED.value:
                raise ConflictException("Lead has already been converted into a deal.")

            existing = await self.deal_repo.get_by_lead_id_in_org(lead_id, organization_id)
            if existing:
                raise ConflictException("Lead has already been converted into a deal.")

            stage = await self.pipeline_repo.get_by_slug(PipelineStageSlug.NEW.value, organization_id)
            if not stage:
                from app.services.pipeline_service import PipelineService

                stage = (await PipelineService(self.db).ensure_default_stages(organization_id, created_by))[0]

            deal = await self.deal_repo.create(
                name=lead.title,
                description=lead.description,
                status=DealStatus.OPEN.value,
                amount=lead.estimated_value,
                currency=lead.currency,
                probability=min(max((lead.score or 50), 0), 100),
                notes=lead.notes,
                owner_id=lead.owner_id,
                company_id=lead.company_id,
                contact_id=lead.contact_id,
                lead_id=lead.id,
                pipeline_stage_id=stage.id,
                organization_id=organization_id,
                created_by=created_by,
            )

            await self.repo.update(lead, status=LeadStatus.CONVERTED.value)

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


