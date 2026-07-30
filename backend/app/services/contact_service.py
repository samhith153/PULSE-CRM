"""
Contact Management Service
"""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateException, NotFoundException, BusinessRuleException
from app.core.logging import get_logger
from app.models.contact import Contact
from app.repositories.contact_repository import ContactRepository
from app.repositories.company_repository import CompanyRepository
from app.services.timeline_engine_service import TimelineEngineService
from app.utils.enums import ActivityEntityType, ActivityType
from app.schemas.contact import ContactCreateRequest, ContactUpdateRequest

logger = get_logger(__name__)


class ContactService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ContactRepository(db)
        self.company_repo = CompanyRepository(db)
        self.timeline = TimelineEngineService(db)

    async def create(
        self,
        payload: ContactCreateRequest,
        organization_id: UUID,
        created_by: UUID,
    ) -> Contact:
        existing = await self.repo.get_by_email_in_org(str(payload.email), organization_id)
        if existing:
            raise DuplicateException("Contact", "email", str(payload.email))

        if payload.company_id:
            company = await self.company_repo.get_active_by_id(payload.company_id, organization_id)
            if not company:
                raise BusinessRuleException(
                    f"Company '{payload.company_id}' not found in your organization."
                )

        contact = await self.repo.create(
            **payload.model_dump(exclude_none=True),
            organization_id=organization_id,
            created_by=created_by,
        )
        await self.timeline.record_activity(
            organization_id=organization_id,
            created_by=created_by,
            entity_type=ActivityEntityType.CONTACT.value,
            entity_id=contact.id,
            action=ActivityType.CONTACT_CREATED.value,
            title="Contact created",
            description=f"Contact '{contact.full_name}' was created.",
            payload={"contact_id": str(contact.id), "email": contact.email},
            topic="contact",
        )
        logger.info("Contact created", extra={"contact_id": str(contact.id)})
        return contact

    async def list(
        self,
        organization_id: UUID,
        search: Optional[str],
        company_id: Optional[UUID],
        page: int,
        page_size: int,
    ) -> Tuple[List[Contact], int]:
        return await self.repo.list_by_organization(organization_id, search, company_id, page, page_size)

    async def get(self, contact_id: UUID, organization_id: UUID) -> Contact:
        contact = await self.repo.get_active_by_id(contact_id, organization_id)
        if not contact:
            raise NotFoundException("Contact", contact_id)
        return contact

    async def update(
        self,
        contact_id: UUID,
        organization_id: UUID,
        payload: ContactUpdateRequest,
    ) -> Contact:
        contact = await self.get(contact_id, organization_id)

        update_data = payload.model_dump(exclude_none=True)

        if "email" in update_data and update_data["email"] != contact.email:
            existing = await self.repo.get_by_email_in_org(update_data["email"], organization_id)
            if existing and existing.id != contact_id:
                raise DuplicateException("Contact", "email", update_data["email"])

        if "company_id" in update_data and update_data["company_id"]:
            company = await self.company_repo.get_active_by_id(update_data["company_id"], organization_id)
            if not company:
                raise BusinessRuleException("Company not found in your organization.")

        await self.repo.update(contact, **update_data)
        if update_data:
            await self.timeline.record_activity(
                organization_id=organization_id,
                created_by=contact.created_by,
                entity_type=ActivityEntityType.CONTACT.value,
                entity_id=contact.id,
                action="contact_updated",
                title="Contact updated",
                description=f"Contact '{contact.full_name}' was updated.",
                payload={"contact_id": str(contact.id), "changes": list(update_data.keys())},
                topic="contact",
            )
        return await self.get(contact_id, organization_id)

    async def delete(self, contact_id: UUID, organization_id: UUID) -> None:
        contact = await self.get(contact_id, organization_id)

        from app.models.deal import Deal
        from app.models.lead import Lead

        active_deals = (
            await self.db.execute(
                select(func.count()).select_from(Deal).where(
                    Deal.contact_id == contact_id,
                    Deal.is_deleted == False,
                )
            )
        ).scalar() or 0

        active_leads = (
            await self.db.execute(
                select(func.count()).select_from(Lead).where(
                    Lead.contact_id == contact_id,
                    Lead.is_deleted == False,
                )
            )
        ).scalar() or 0

        if active_deals > 0 or active_leads > 0:
            parts = []
            if active_deals:
                parts.append(f"{active_deals} deal{'s' if active_deals != 1 else ''}")
            if active_leads:
                parts.append(f"{active_leads} lead{'s' if active_leads != 1 else ''}")
            raise BusinessRuleException(
                f"Cannot delete contact '{contact.full_name}': linked to {', '.join(parts)}. "
                "Remove the contact from these records first, or delete them first."
            )

        await self.repo.soft_delete(contact)
        await self.timeline.record_activity(
            organization_id=organization_id,
            created_by=contact.created_by,
            entity_type=ActivityEntityType.CONTACT.value,
            entity_id=contact.id,
            action="contact_deleted",
            title="Contact deleted",
            description=f"Contact '{contact.full_name}' was deleted.",
            payload={"contact_id": str(contact.id)},
            topic="contact",
        )
        logger.info("Contact deleted", extra={"contact_id": str(contact_id)})
