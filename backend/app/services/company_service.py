"""
Company Management Service
"""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateException, NotFoundException, BusinessRuleException
from app.core.logging import get_logger
from app.models.company import Company
from app.repositories.company_repository import CompanyRepository
from app.services.timeline_engine_service import TimelineEngineService
from app.utils.enums import ActivityEntityType, ActivityType
from app.schemas.company import CompanyCreateRequest, CompanyUpdateRequest

logger = get_logger(__name__)


class CompanyService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = CompanyRepository(db)
        self.timeline = TimelineEngineService(db)

    async def create(
        self,
        payload: CompanyCreateRequest,
        organization_id: UUID,
        created_by: UUID,
    ) -> Company:
        existing = await self.repo.get_by_name_in_org(payload.name, organization_id)
        if existing:
            raise DuplicateException("Company", "name", payload.name)

        company = await self.repo.create(
            **payload.model_dump(exclude_none=True),
            organization_id=organization_id,
            created_by=created_by,
        )
        await self.timeline.record_activity(
            organization_id=organization_id,
            created_by=created_by,
            entity_type=ActivityEntityType.COMPANY.value,
            entity_id=company.id,
            action=ActivityType.COMPANY_CREATED.value,
            title="Company created",
            description=f"Company '{company.name}' was created.",
            payload={"company_id": str(company.id), "company_name": company.name},
            topic="company",
        )
        logger.info("Company created", extra={"company_id": str(company.id)})
        return company

    async def list(
        self,
        organization_id: UUID,
        search: Optional[str],
        page: int,
        page_size: int,
    ) -> Tuple[List[Company], int]:
        return await self.repo.list_by_organization(organization_id, search, page, page_size)

    async def get(self, company_id: UUID, organization_id: UUID) -> Company:
        company = await self.repo.get_active_by_id(company_id, organization_id)
        if not company:
            raise NotFoundException("Company", company_id)
        return company

    async def update(
        self,
        company_id: UUID,
        organization_id: UUID,
        payload: CompanyUpdateRequest,
    ) -> Company:
        company = await self.get(company_id, organization_id)

        update_data = payload.model_dump(exclude_none=True)

        if "name" in update_data and update_data["name"] != company.name:
            existing = await self.repo.get_by_name_in_org(update_data["name"], organization_id)
            if existing and existing.id != company_id:
                raise DuplicateException("Company", "name", update_data["name"])

        await self.repo.update(company, **update_data)
        if update_data:
            await self.timeline.record_activity(
                organization_id=organization_id,
                created_by=company.created_by,
                entity_type=ActivityEntityType.COMPANY.value,
                entity_id=company.id,
                action="company_updated",
                title="Company updated",
                description=f"Company '{company.name}' was updated.",
                payload={"company_id": str(company.id), "changes": list(update_data.keys())},
                topic="company",
            )
        return await self.get(company_id, organization_id)

    async def delete(self, company_id: UUID, organization_id: UUID) -> None:
        company = await self.get(company_id, organization_id)

        from app.models.contact import Contact
        from app.models.deal import Deal
        from app.models.lead import Lead

        active_contacts = (
            await self.db.execute(
                select(func.count()).select_from(Contact).where(
                    Contact.company_id == company_id,
                    Contact.is_deleted == False,
                )
            )
        ).scalar() or 0

        active_leads = (
            await self.db.execute(
                select(func.count()).select_from(Lead).where(
                    Lead.company_id == company_id,
                    Lead.is_deleted == False,
                )
            )
        ).scalar() or 0

        active_deals = (
            await self.db.execute(
                select(func.count()).select_from(Deal).where(
                    Deal.company_id == company_id,
                    Deal.is_deleted == False,
                )
            )
        ).scalar() or 0

        if active_contacts > 0 or active_leads > 0 or active_deals > 0:
            parts = []
            if active_contacts:
                parts.append(f"{active_contacts} contact{'s' if active_contacts != 1 else ''}")
            if active_leads:
                parts.append(f"{active_leads} lead{'s' if active_leads != 1 else ''}")
            if active_deals:
                parts.append(f"{active_deals} deal{'s' if active_deals != 1 else ''}")
            raise BusinessRuleException(
                f"Cannot delete company '{company.name}': linked to {', '.join(parts)}. "
                "Remove the company from these records first, or delete them first."
            )

        await self.repo.soft_delete(company)
        await self.timeline.record_activity(
            organization_id=organization_id,
            created_by=company.created_by,
            entity_type=ActivityEntityType.COMPANY.value,
            entity_id=company.id,
            action="company_deleted",
            title="Company deleted",
            description=f"Company '{company.name}' was deleted.",
            payload={"company_id": str(company.id)},
            topic="company",
        )
        logger.info("Company deleted", extra={"company_id": str(company_id)})
