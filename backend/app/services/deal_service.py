"""
Deal Management Service
"""
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, ConflictException, NotFoundException
from app.core.logging import get_logger
from app.models.deal import Deal
from app.repositories.company_repository import CompanyRepository
from app.repositories.contact_repository import ContactRepository
from app.repositories.deal_repository import DealRepository
from app.repositories.lead_repository import LeadRepository
from app.repositories.pipeline_repository import PipelineRepository
from app.repositories.user_repository import UserRepository
from app.schemas.deal import DealCreateRequest, DealUpdateRequest
from app.services.timeline_engine_service import TimelineEngineService
from app.utils.enums import (
    ActivityEntityType,
    ActivityType,
    DealSortField,
    DealStatus,
    PipelineStageSlug,
    SortOrder,
)

logger = get_logger(__name__)


class DealService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = DealRepository(db)
        self.pipeline_repo = PipelineRepository(db)
        self.timeline = TimelineEngineService(db)
        self.company_repo = CompanyRepository(db)
        self.contact_repo = ContactRepository(db)
        self.lead_repo = LeadRepository(db)
        self.user_repo = UserRepository(db)

    async def create(self, payload: DealCreateRequest, organization_id: UUID, created_by: UUID) -> Deal:
        await self._validate_relations(
            organization_id,
            payload.company_id,
            payload.contact_id,
            payload.lead_id,
            payload.owner_id,
            payload.pipeline_stage_id,
        )

        if payload.lead_id:
            existing = await self.repo.get_by_lead_id_in_org(payload.lead_id, organization_id)
            if existing:
                raise ConflictException("A deal already exists for this lead.")

        stage = await self._resolve_stage(organization_id=organization_id, stage_id=payload.pipeline_stage_id, created_by=created_by)

        create_data = payload.model_dump(exclude_none=True)
        create_data.pop("pipeline_stage_id", None)
        create_data.pop("status", None)
        create_data.pop("probability", None)

        status_value = self._status_for_stage(stage, payload.status)
        probability = stage.probability if payload.pipeline_stage_id else payload.probability
        closed_at = datetime.now(timezone.utc) if status_value in {DealStatus.WON.value, DealStatus.LOST.value} else None

        deal = await self.repo.create(
            **create_data,
            status=status_value,
            probability=probability,
            closed_at=closed_at,
            pipeline_stage_id=stage.id if stage else None,
            organization_id=organization_id,
            created_by=created_by,
        )
        await self.timeline.record_activity(
            organization_id=organization_id,
            created_by=created_by,
            entity_type=ActivityEntityType.DEAL.value,
            entity_id=deal.id,
            action=ActivityType.DEAL_CREATED.value,
            title="Deal created",
            description=f"Deal '{deal.name}' was created.",
            payload={"deal_id": str(deal.id), "pipeline_stage_id": str(stage.id) if stage else None},
            topic="deal",
        )
        logger.info("Deal created", extra={"deal_id": str(deal.id)})
        return deal

    async def list(
        self,
        organization_id: UUID,
        search: Optional[str],
        status: Optional[DealStatus],
        owner_id: Optional[UUID],
        company_id: Optional[UUID],
        contact_id: Optional[UUID],
        lead_id: Optional[UUID],
        pipeline_stage_id: Optional[UUID],
        min_amount: Optional[Decimal],
        max_amount: Optional[Decimal],
        sort_by: Optional[DealSortField],
        sort_order: SortOrder,
        page: int,
        page_size: int,
    ) -> Tuple[List[Deal], int]:
        return await self.repo.list_by_organization(
            organization_id,
            search,
            status,
            owner_id,
            company_id,
            contact_id,
            lead_id,
            pipeline_stage_id,
            min_amount,
            max_amount,
            sort_by,
            sort_order,
            page,
            page_size,
        )

    async def get(self, deal_id: UUID, organization_id: UUID) -> Deal:
        deal = await self.repo.get_active_by_id(deal_id, organization_id)
        if not deal:
            raise NotFoundException("Deal", deal_id)
        return deal

    async def update(self, deal_id: UUID, organization_id: UUID, payload: DealUpdateRequest) -> Deal:
        deal = await self.get(deal_id, organization_id)
        update_data = payload.model_dump(exclude_none=True)

        await self._validate_relations(
            organization_id,
            update_data.get("company_id"),
            update_data.get("contact_id"),
            update_data.get("lead_id"),
            update_data.get("owner_id"),
            update_data.get("pipeline_stage_id"),
        )

        lead_id = update_data.get("lead_id")
        if lead_id:
            existing = await self.repo.get_by_lead_id_in_org(lead_id, organization_id)
            if existing and existing.id != deal_id:
                raise ConflictException("A deal already exists for this lead.")

        stage = None
        if "pipeline_stage_id" in update_data:
            stage = await self._resolve_stage(
                organization_id=organization_id,
                stage_id=update_data.get("pipeline_stage_id"),
                created_by=deal.created_by,
            )
            update_data["pipeline_stage_id"] = stage.id if stage else None
            if stage:
                update_data["probability"] = stage.probability
                update_data["status"] = self._status_for_stage(stage, DealStatus.OPEN)
                if stage.slug in {PipelineStageSlug.WON.value, PipelineStageSlug.LOST.value}:
                    update_data["closed_at"] = datetime.now(timezone.utc)
                    if not update_data.get("close_reason") and not deal.close_reason:
                        raise BusinessRuleException("A close_reason is required when moving a deal to Won or Lost.")
                else:
                    update_data["closed_at"] = None
                    if "close_reason" not in update_data and deal.close_reason:
                        update_data["close_reason"] = deal.close_reason

        if "status" in update_data:
            status_value = self._to_status_value(update_data["status"])
            if status_value in {DealStatus.WON.value, DealStatus.LOST.value}:
                if not update_data.get("close_reason") and not deal.close_reason:
                    raise BusinessRuleException("A close_reason is required when marking a deal as Won or Lost.")
                update_data["closed_at"] = datetime.now(timezone.utc)
            else:
                update_data["closed_at"] = None
            update_data["status"] = status_value

        await self.repo.update(deal, **update_data)

        activity_action = self._deal_activity_action(stage, update_data)
        if activity_action:
            await self.timeline.record_activity(
                organization_id=organization_id,
                created_by=deal.created_by,
                entity_type=ActivityEntityType.DEAL.value,
                entity_id=deal.id,
                action=activity_action,
                title=self._activity_title(activity_action),
                description=f"Deal '{deal.name}' was updated.",
                payload={"deal_id": str(deal.id), "changes": list(update_data.keys())},
                topic="deal",
            )
        return deal

    async def delete(self, deal_id: UUID, organization_id: UUID) -> None:
        deal = await self.get(deal_id, organization_id)
        await self.repo.soft_delete(deal)
        await self.timeline.record_activity(
            organization_id=organization_id,
            created_by=deal.created_by,
            entity_type=ActivityEntityType.DEAL.value,
            entity_id=deal.id,
            action="deal_deleted",
            title="Deal deleted",
            description=f"Deal '{deal.name}' was deleted.",
            payload={"deal_id": str(deal.id)},
            topic="deal",
        )
        logger.info("Deal deleted", extra={"deal_id": str(deal_id)})

    async def convert_from_lead(self, lead_id: UUID, organization_id: UUID, created_by: UUID) -> Deal:
        from app.services.lead_service import LeadService

        return await LeadService(self.db).convert_to_deal(lead_id, organization_id, created_by)

    async def _validate_relations(
        self,
        organization_id: UUID,
        company_id: Optional[UUID],
        contact_id: Optional[UUID],
        lead_id: Optional[UUID],
        owner_id: Optional[UUID],
        pipeline_stage_id: Optional[UUID] = None,
    ) -> None:
        if company_id:
            company = await self.company_repo.get_active_by_id(company_id, organization_id)
            if not company:
                raise BusinessRuleException(f"Company '{company_id}' not found.")

        if contact_id:
            contact = await self.contact_repo.get_active_by_id(contact_id, organization_id)
            if not contact:
                raise BusinessRuleException(f"Contact '{contact_id}' not found.")

        if lead_id:
            lead = await self.lead_repo.get_active_by_id(lead_id, organization_id)
            if not lead:
                raise BusinessRuleException(f"Lead '{lead_id}' not found.")

        if owner_id:
            owner = await self.user_repo.get_by_id_with_roles(owner_id)
            if not owner or owner.organization_id != organization_id:
                raise BusinessRuleException(f"Owner (user) '{owner_id}' not found.")

        if pipeline_stage_id:
            stage = await self.pipeline_repo.get_active_by_id(pipeline_stage_id, organization_id)
            if not stage:
                raise BusinessRuleException(f"Pipeline stage '{pipeline_stage_id}' not found.")

    async def _resolve_stage(
        self,
        organization_id: UUID,
        stage_id: Optional[UUID],
        created_by: Optional[UUID],
    ):
        if stage_id:
            stage = await self.pipeline_repo.get_active_by_id(stage_id, organization_id)
            if not stage:
                raise BusinessRuleException(f"Pipeline stage '{stage_id}' not found.")
            return stage

        stage = await self.pipeline_repo.get_by_slug(PipelineStageSlug.NEW.value, organization_id)
        if stage:
            return stage

        from app.services.pipeline_service import PipelineService

        stages = await PipelineService(self.db).ensure_default_stages(organization_id, created_by)
        return stages[0] if stages else None

    def _status_for_stage(self, stage, fallback: DealStatus | str) -> str:
        if not stage:
            return self._to_status_value(fallback)
        if stage.slug == PipelineStageSlug.WON.value:
            return DealStatus.WON.value
        if stage.slug == PipelineStageSlug.LOST.value:
            return DealStatus.LOST.value
        return DealStatus.OPEN.value

    def _to_status_value(self, value: DealStatus | str) -> str:
        return value.value if isinstance(value, DealStatus) else str(value)

    def _deal_activity_action(self, stage, update_data: dict[str, object]) -> str:
        if stage and getattr(stage, "slug", None) == PipelineStageSlug.WON.value:
            return ActivityType.DEAL_WON.value
        if stage and getattr(stage, "slug", None) == PipelineStageSlug.LOST.value:
            return ActivityType.DEAL_LOST.value
        status_value = update_data.get("status")
        if status_value in {DealStatus.WON.value, DealStatus.WON}:
            return ActivityType.DEAL_WON.value
        if status_value in {DealStatus.LOST.value, DealStatus.LOST}:
            return ActivityType.DEAL_LOST.value
        if "pipeline_stage_id" in update_data:
            return ActivityType.STAGE_CHANGED.value
        return ActivityType.DEAL_UPDATED.value

    def _activity_title(self, action: str) -> str:
        titles = {
            ActivityType.DEAL_CREATED.value: "Deal created",
            ActivityType.DEAL_UPDATED.value: "Deal updated",
            ActivityType.STAGE_CHANGED.value: "Deal stage changed",
            ActivityType.DEAL_WON.value: "Deal won",
            ActivityType.DEAL_LOST.value: "Deal lost",
        }
        return titles.get(action, "Deal updated")

