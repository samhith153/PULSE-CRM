"""
Pipeline Service
"""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, ConflictException, NotFoundException
from app.models.deal import Deal
from app.models.pipeline import PipelineStage
from app.repositories.deal_repository import DealRepository
from app.repositories.pipeline_repository import PipelineRepository
from app.schemas.pipeline import (
    PipelineBoardResponse,
    PipelineForecastResponse,
    PipelineForecastStageResponse,
    PipelineStageCreateRequest,
    PipelineStageResponse,
    PipelineStageStatsResponse,
    PipelineStageUpdateRequest,
    PipelineStatisticsResponse,
)
from app.services.event_service import EventService
from app.services.timeline_engine_service import TimelineEngineService
from app.utils.enums import ActivityType, DealStatus, PipelineStageSlug


DEFAULT_STAGES = [
    (PipelineStageSlug.NEW.value, "New", 10),
    (PipelineStageSlug.QUALIFIED.value, "Qualified", 25),
    (PipelineStageSlug.PROPOSAL.value, "Proposal", 50),
    (PipelineStageSlug.NEGOTIATION.value, "Negotiation", 75),
    (PipelineStageSlug.WON.value, "Won", 100),
    (PipelineStageSlug.LOST.value, "Lost", 0),
]


class PipelineService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = PipelineRepository(db)
        self.deal_repo = DealRepository(db)
        self.timeline = TimelineEngineService(db)
        self.events = EventService(db)

    async def ensure_default_stages(self, organization_id: UUID, created_by: Optional[UUID]) -> List[PipelineStage]:
        stages = await self.repo.list_by_organization(organization_id, include_inactive=True)
        stage_map = {stage.slug: stage for stage in stages}

        for sort_order, (slug, name, probability) in enumerate(DEFAULT_STAGES, start=1):
            existing = stage_map.get(slug)
            if existing:
                if not existing.is_active:
                    await self.repo.update(
                        existing,
                        name=name,
                        slug=slug,
                        sort_order=sort_order,
                        probability=probability,
                        is_default=True,
                        is_active=True,
                        updated_by=created_by,
                    )
                    await self.events.record_event(
                        "PIPELINE_STAGE_UPDATED",
                        organization_id=organization_id,
                        actor_id=created_by,
                        aggregate_type="pipeline_stage",
                        aggregate_id=str(existing.id),
                        source="pipeline_service",
                        payload={"pipeline_stage_id": str(existing.id), "slug": slug, "reactivated": True},
                    )
            else:
                stage = await self.repo.create(
                    organization_id=organization_id,
                    created_by=created_by,
                    name=name,
                    slug=slug,
                    sort_order=sort_order,
                    probability=probability,
                    color=None,
                    is_default=True,
                )
                await self.events.record_event(
                    "PIPELINE_STAGE_CREATED",
                    organization_id=organization_id,
                    actor_id=created_by,
                    aggregate_type="pipeline_stage",
                    aggregate_id=str(stage.id),
                    source="pipeline_service",
                    payload={"pipeline_stage_id": str(stage.id), "slug": slug, "name": name},
                )

        return await self.repo.list_by_organization(organization_id)

    async def list_stages(
        self,
        organization_id: UUID,
        created_by: Optional[UUID] = None,
        include_inactive: bool = False,
    ) -> List[PipelineStage]:
        if include_inactive:
            return await self.repo.list_by_organization(organization_id, include_inactive=True)
        return await self.ensure_default_stages(organization_id, created_by)

    async def get_board(self, organization_id: UUID, created_by: Optional[UUID] = None) -> PipelineBoardResponse:
        stages = await self.list_stages(organization_id, created_by)
        stats_rows = await self.repo.get_board_stats(organization_id)
        stats_map = {stage.id: (stage, deal_count, total_amount) for stage, deal_count, total_amount in stats_rows}
        summary_stages: list[PipelineStageStatsResponse] = []
        for stage in stages:
            _, deal_count, total_amount = stats_map.get(stage.id, (stage, 0, Decimal("0")))
            weighted_amount = (Decimal(str(total_amount)) * Decimal(stage.probability)) / Decimal(100)
            summary_stages.append(
                PipelineStageStatsResponse(
                    stage=PipelineStageResponse.model_validate(stage),
                    deal_count=int(deal_count or 0),
                    total_amount=Decimal(str(total_amount or 0)),
                    weighted_amount=weighted_amount,
                )
            )
        total_deals = sum(item.deal_count for item in summary_stages)
        total_amount = sum((item.total_amount for item in summary_stages), Decimal("0"))
        weighted_amount = sum((item.weighted_amount for item in summary_stages), Decimal("0"))
        return PipelineBoardResponse(
            stages=summary_stages,
            total_deals=total_deals,
            total_amount=total_amount,
            weighted_amount=weighted_amount,
        )

    async def forecast(self, organization_id: UUID, created_by: Optional[UUID] = None) -> PipelineForecastResponse:
        stages = await self.list_stages(organization_id, created_by)
        stats_rows = await self.repo.get_board_stats(organization_id)
        stats_map = {stage.id: (stage, deal_count, total_amount) for stage, deal_count, total_amount in stats_rows}

        stage_forecasts: list[PipelineForecastStageResponse] = []
        total_pipeline_value = Decimal("0")
        weighted_pipeline_value = Decimal("0")

        for stage in stages:
            _, deal_count, total_amount = stats_map.get(stage.id, (stage, 0, Decimal("0")))
            pipeline_value = Decimal(str(total_amount or 0))
            weighted_value = (pipeline_value * Decimal(stage.probability)) / Decimal(100)
            total_pipeline_value += pipeline_value
            weighted_pipeline_value += weighted_value
            stage_forecasts.append(
                PipelineForecastStageResponse(
                    stage=PipelineStageResponse.model_validate(stage),
                    deal_count=int(deal_count or 0),
                    pipeline_value=pipeline_value,
                    weighted_value=weighted_value,
                    win_probability=stage.probability,
                )
            )

        win_probability = Decimal("0")
        if total_pipeline_value > 0:
            win_probability = (weighted_pipeline_value / total_pipeline_value) * Decimal("100")

        return PipelineForecastResponse(
            organization_id=organization_id,
            total_pipeline_value=total_pipeline_value,
            weighted_pipeline_value=weighted_pipeline_value,
            revenue_forecast=weighted_pipeline_value,
            win_probability=win_probability,
            stage_wise_forecast=stage_forecasts,
            generated_at=datetime.now(timezone.utc),
        )

    async def statistics(self, organization_id: UUID, created_by: Optional[UUID] = None) -> PipelineStatisticsResponse:
        forecast = await self.forecast(organization_id, created_by)
        total_deals = await self.repo.count_total_deals(organization_id)
        won_deals = 0
        lost_deals = 0
        for row in await self.repo.get_board_stats(organization_id):
            stage = row[0]
            deal_count = int(row[1] or 0)
            if stage.slug == PipelineStageSlug.WON.value:
                won_deals = deal_count
            elif stage.slug == PipelineStageSlug.LOST.value:
                lost_deals = deal_count
        open_deals = max(total_deals - won_deals - lost_deals, 0)
        return PipelineStatisticsResponse(
            organization_id=organization_id,
            total_pipeline_value=forecast.total_pipeline_value,
            weighted_pipeline_value=forecast.weighted_pipeline_value,
            revenue_forecast=forecast.revenue_forecast,
            win_probability=forecast.win_probability,
            total_deals=total_deals,
            open_deals=open_deals,
            won_deals=won_deals,
            lost_deals=lost_deals,
            stage_wise_forecast=forecast.stage_wise_forecast,
            generated_at=forecast.generated_at,
        )

    async def create_stage(
        self,
        organization_id: UUID,
        created_by: Optional[UUID],
        payload: PipelineStageCreateRequest,
    ) -> PipelineStage:
        stages = await self.repo.list_by_organization(organization_id, include_inactive=True)
        existing = next((stage for stage in stages if stage.slug == payload.slug), None)
        if existing and existing.is_active:
            raise ConflictException(f"Pipeline stage with slug '{payload.slug}' already exists.")

        sort_order = payload.sort_order if payload.sort_order is not None else (max((stage.sort_order for stage in stages), default=0) + 1)
        if existing and not existing.is_active:
            stage = await self.repo.update(
                existing,
                name=payload.name,
                slug=payload.slug,
                color=payload.color,
                sort_order=sort_order,
                probability=payload.probability,
                is_default=payload.is_default,
                is_active=True,
                updated_by=created_by,
            )
            await self.events.record_event(
                "PIPELINE_STAGE_UPDATED",
                organization_id=organization_id,
                actor_id=created_by,
                aggregate_type="pipeline_stage",
                aggregate_id=str(stage.id),
                source="pipeline_service",
                payload={"pipeline_stage_id": str(stage.id), "changes": ["reactivated", "name", "slug"]},
            )
        else:
            stage = await self.repo.create(
                organization_id=organization_id,
                created_by=created_by,
                name=payload.name,
                slug=payload.slug,
                color=payload.color,
                sort_order=sort_order,
                probability=payload.probability,
                is_default=payload.is_default,
            )
            await self.events.record_event(
                "PIPELINE_STAGE_CREATED",
                organization_id=organization_id,
                actor_id=created_by,
                aggregate_type="pipeline_stage",
                aggregate_id=str(stage.id),
                source="pipeline_service",
                payload={"pipeline_stage_id": str(stage.id), "slug": payload.slug, "name": payload.name},
            )

        if payload.is_default:
            await self._unset_other_defaults(organization_id, stage.id)

        return stage

    async def update_stage(
        self,
        organization_id: UUID,
        created_by: Optional[UUID],
        stage_id: UUID,
        payload: PipelineStageUpdateRequest,
    ) -> PipelineStage:
        stage = await self.repo.get_active_by_id(stage_id, organization_id)
        if not stage:
            raise NotFoundException("PipelineStage", stage_id)

        update_data = payload.model_dump(exclude_none=True)
        if "slug" in update_data and update_data["slug"] != stage.slug:
            stages = await self.repo.list_by_organization(organization_id, include_inactive=True)
            if any(existing.slug == update_data["slug"] and existing.id != stage.id for existing in stages):
                raise ConflictException(f"Pipeline stage with slug '{update_data['slug']}' already exists.")

        update_data["updated_by"] = created_by
        stage = await self.repo.update(stage, **update_data)
        if update_data.get("is_default"):
            await self._unset_other_defaults(organization_id, stage.id)
        if update_data:
            await self.events.record_event(
                "PIPELINE_STAGE_UPDATED",
                organization_id=organization_id,
                actor_id=created_by,
                aggregate_type="pipeline_stage",
                aggregate_id=str(stage.id),
                source="pipeline_service",
                payload={"pipeline_stage_id": str(stage.id), "changes": list(update_data.keys())},
            )
        return stage

    async def delete_stage(self, organization_id: UUID, stage_id: UUID) -> None:
        stage = await self.repo.get_active_by_id(stage_id, organization_id)
        if not stage:
            raise NotFoundException("PipelineStage", stage_id)

        active_deals = await self.repo.count_stage_deals(organization_id, stage_id)
        if active_deals:
            raise BusinessRuleException("Move or close deals before deleting this pipeline stage.")

        await self.repo.update(stage, is_active=False)
        await self.events.record_event(
            "PIPELINE_STAGE_DELETED",
            organization_id=organization_id,
            aggregate_type="pipeline_stage",
            aggregate_id=str(stage.id),
            source="pipeline_service",
            payload={"pipeline_stage_id": str(stage.id), "slug": stage.slug},
        )

    async def move_deal(
        self,
        organization_id: UUID,
        created_by: Optional[UUID],
        deal_id: UUID,
        stage_id: UUID,
        close_reason: Optional[str] = None,
    ) -> Deal:
        deal = await self.deal_repo.get_active_by_id(deal_id, organization_id)
        if not deal:
            raise NotFoundException("Deal", deal_id)

        stage = await self.repo.get_active_by_id(stage_id, organization_id)
        if not stage:
            raise NotFoundException("PipelineStage", stage_id)

        if stage.slug in {PipelineStageSlug.WON.value, PipelineStageSlug.LOST.value} and not close_reason and not deal.close_reason:
            raise BusinessRuleException("A close_reason is required when moving a deal to Won or Lost.")

        update_data: dict[str, object] = {
            "pipeline_stage_id": stage.id,
            "probability": stage.probability,
            "status": self._status_for_stage_slug(stage.slug),
        }
        if stage.slug in {PipelineStageSlug.WON.value, PipelineStageSlug.LOST.value}:
            update_data["closed_at"] = datetime.now(timezone.utc)
            if close_reason:
                update_data["close_reason"] = close_reason
        else:
            update_data["closed_at"] = None

        await self.deal_repo.update(deal, **update_data)
        await self.timeline.record_activity(
            organization_id=organization_id,
            created_by=created_by,
            entity_type="deal",
            entity_id=deal.id,
            action=self._deal_stage_activity(stage.slug),
            title=self._deal_stage_title(stage.slug),
            description=f"Deal '{deal.name}' moved to stage '{stage.name}'.",
            payload={"deal_id": str(deal.id), "stage_id": str(stage.id), "stage_slug": stage.slug},
            topic="pipeline",
        )
        return deal

    async def list_deals_by_stage(
        self,
        organization_id: UUID,
        stage_id: UUID,
        page: int,
        page_size: int,
        search: Optional[str] = None,
    ) -> Tuple[list[Deal], int]:
        stage = await self.repo.get_active_by_id(stage_id, organization_id)
        if not stage:
            raise NotFoundException("PipelineStage", stage_id)
        return await self.deal_repo.list_by_stage(organization_id, stage_id, page, page_size, search)

    async def _unset_other_defaults(self, organization_id: UUID, keep_stage_id: UUID) -> None:
        stages = await self.repo.list_by_organization(organization_id, include_inactive=True)
        for stage in stages:
            if stage.id != keep_stage_id and stage.is_default:
                await self.repo.update(stage, is_default=False)

    def _status_for_stage_slug(self, slug: str) -> str:
        if slug == PipelineStageSlug.WON.value:
            return DealStatus.WON.value
        if slug == PipelineStageSlug.LOST.value:
            return DealStatus.LOST.value
        return DealStatus.OPEN.value

    def _deal_stage_activity(self, slug: str) -> str:
        if slug == PipelineStageSlug.WON.value:
            return ActivityType.DEAL_WON.value
        if slug == PipelineStageSlug.LOST.value:
            return ActivityType.DEAL_LOST.value
        return ActivityType.STAGE_CHANGED.value

    def _deal_stage_title(self, slug: str) -> str:
        if slug == PipelineStageSlug.WON.value:
            return "Deal won"
        if slug == PipelineStageSlug.LOST.value:
            return "Deal lost"
        return "Deal stage changed"
