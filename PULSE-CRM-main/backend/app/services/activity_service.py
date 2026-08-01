"""
Activity Timeline Service
"""
from __future__ import annotations

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.activity import ActivityTimeline
from app.repositories.activity_repository import ActivityTimelineRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.contact_repository import ContactRepository
from app.repositories.deal_repository import DealRepository
from app.repositories.email_repository import EmailRepository
from app.repositories.lead_repository import LeadRepository
from app.repositories.pipeline_repository import PipelineRepository
from app.schemas.activity import ActivityTimelineCreateRequest
from app.services.event_service import EventService
from app.utils.enums import ActivityEntityType, ActivityType, SortOrder


class ActivityService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ActivityTimelineRepository(db)
        self.deal_repo = DealRepository(db)
        self.lead_repo = LeadRepository(db)
        self.contact_repo = ContactRepository(db)
        self.company_repo = CompanyRepository(db)
        self.email_repo = EmailRepository(db)
        self.pipeline_repo = PipelineRepository(db)
        self.events = EventService(db)

    async def create(
        self,
        organization_id: UUID,
        created_by: Optional[UUID],
        payload: ActivityTimelineCreateRequest,
    ) -> ActivityTimeline:
        await self._validate_entity(organization_id, payload.entity_type, payload.entity_id)
        record = await self.repo.create(
            organization_id=organization_id,
            created_by=created_by,
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
            action=payload.action,
            title=payload.title,
            description=payload.description,
            payload=payload.payload,
        )
        await self.events.record_event(
            "ACTIVITY_CREATED",
            organization_id=organization_id,
            actor_id=created_by,
            aggregate_type=payload.entity_type,
            aggregate_id=str(payload.entity_id),
            source="activity_service",
            payload={
                "activity_id": str(record.id),
                "entity_type": payload.entity_type,
                "entity_id": str(payload.entity_id),
                "action": payload.action,
                "title": payload.title,
            },
        )
        return record

    async def list(
        self,
        organization_id: UUID,
        entity_type: Optional[str],
        entity_id: Optional[UUID],
        action: Optional[str],
        search: Optional[str],
        page: int,
        page_size: int,
        sort_order: SortOrder = SortOrder.DESC,
    ) -> Tuple[List[ActivityTimeline], int]:
        return await self.repo.list_by_organization(
            organization_id=organization_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            search=search,
            page=page,
            page_size=page_size,
            sort_order=sort_order,
        )

    async def get_deal_timeline(
        self,
        organization_id: UUID,
        deal_id: UUID,
        page: int,
        page_size: int,
        search: Optional[str] = None,
        sort_order: SortOrder = SortOrder.DESC,
    ) -> Tuple[List[ActivityTimeline], int]:
        deal = await self.deal_repo.get_active_by_id(deal_id, organization_id)
        if not deal:
            raise NotFoundException("Deal", deal_id)
        return await self.repo.list_by_entity(
            organization_id=organization_id,
            entity_type=ActivityEntityType.DEAL.value,
            entity_id=deal_id,
            page=page,
            page_size=page_size,
            search=search,
            sort_order=sort_order,
        )

    async def _validate_entity(self, organization_id: UUID, entity_type: str, entity_id: UUID) -> None:
        if entity_type == ActivityEntityType.DEAL.value:
            if not await self.deal_repo.get_active_by_id(entity_id, organization_id):
                raise NotFoundException("Deal", entity_id)
        elif entity_type == ActivityEntityType.LEAD.value:
            if not await self.lead_repo.get_active_by_id(entity_id, organization_id):
                raise NotFoundException("Lead", entity_id)
        elif entity_type == ActivityEntityType.CONTACT.value:
            if not await self.contact_repo.get_active_by_id(entity_id, organization_id):
                raise NotFoundException("Contact", entity_id)
        elif entity_type == ActivityEntityType.COMPANY.value:
            if not await self.company_repo.get_active_by_id(entity_id, organization_id):
                raise NotFoundException("Company", entity_id)
        elif entity_type == ActivityEntityType.EMAIL.value:
            email = await self.email_repo.get_by_id(entity_id)
            if not email or email.organization_id != organization_id:
                raise NotFoundException("Email", entity_id)
        elif entity_type == "pipeline_stage":
            if not await self.pipeline_repo.get_active_by_id(entity_id, organization_id):
                raise NotFoundException("PipelineStage", entity_id)
        elif entity_type == ActivityEntityType.SYSTEM.value:
            return

    async def log_special_event(
        self,
        organization_id: UUID,
        created_by: Optional[UUID],
        entity_type: str,
        entity_id: UUID,
        action: ActivityType,
        title: str,
        description: Optional[str] = None,
        payload: Optional[dict] = None,
    ) -> ActivityTimeline:
        record = await self.repo.create(
            organization_id=organization_id,
            created_by=created_by,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action.value,
            title=title,
            description=description,
            payload=payload,
        )
        await self.events.record_event(
            "ACTIVITY_CREATED",
            organization_id=organization_id,
            actor_id=created_by,
            aggregate_type=entity_type,
            aggregate_id=str(entity_id),
            source="activity_service",
            payload={
                "activity_id": str(record.id),
                "entity_type": entity_type,
                "entity_id": str(entity_id),
                "action": action.value,
                "title": title,
            },
        )
        return record
