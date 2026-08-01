"""
Organization Management Service
"""
import re
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    DuplicateException,
    NotFoundException,
    ForbiddenException,
)
from app.core.logging import get_logger
from app.models.organization import Organization
from app.repositories.organization_repository import OrganizationRepository
from app.schemas.organization import OrganizationCreateRequest, OrganizationUpdateRequest
from app.services.event_service import EventService

logger = get_logger(__name__)


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug[:100]


class OrganizationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.org_repo = OrganizationRepository(db)
        self.events = EventService(db)

    async def create(
        self, payload: OrganizationCreateRequest, created_by: UUID
    ) -> Organization:
        existing = await self.org_repo.get_by_name(payload.name.strip())
        if existing:
            raise DuplicateException("Organization", "name", payload.name)

        slug = _slugify(payload.name)
        org = await self.org_repo.create(
            name=payload.name.strip(),
            slug=slug,
            description=payload.description,
            website=payload.website,
            phone=payload.phone,
            email=payload.email,
            address=payload.address,
            city=payload.city,
            country=payload.country,
            timezone=payload.timezone,
            plan=payload.plan,
        )
        logger.info("Organization created", extra={"org_id": str(org.id)})
        await self.events.record_event(
            "ORGANIZATION_CREATED",
            organization_id=org.id,
            actor_id=created_by,
            aggregate_type="organization",
            aggregate_id=str(org.id),
            source="organization_service",
            payload={"organization_id": str(org.id), "name": org.name, "slug": org.slug},
        )
        return org

    async def get(self, org_id: UUID) -> Organization:
        org = await self.org_repo.get_active_by_id(org_id)
        if not org:
            raise NotFoundException("Organization", org_id)
        return org

    async def update(
        self, org_id: UUID, payload: OrganizationUpdateRequest, requestor_org_id: UUID
    ) -> Organization:
        if org_id != requestor_org_id:
            raise ForbiddenException("You can only update your own organization.")
        org = await self.get(org_id)

        update_data = payload.model_dump(exclude_none=True)
        if "name" in update_data:
            existing = await self.org_repo.get_by_name(update_data["name"])
            if existing and existing.id != org_id:
                raise DuplicateException("Organization", "name", update_data["name"])
            update_data["slug"] = _slugify(update_data["name"])

        await self.org_repo.update(org, **update_data)
        if update_data:
            await self.events.record_event(
                "ORGANIZATION_UPDATED",
                organization_id=org.id,
                actor_id=requestor_org_id,
                aggregate_type="organization",
                aggregate_id=str(org.id),
                source="organization_service",
                payload={"organization_id": str(org.id), "changes": list(update_data.keys())},
            )
        return org

    async def delete(self, org_id: UUID, requestor_org_id: UUID) -> None:
        if org_id != requestor_org_id:
            raise ForbiddenException("You can only delete your own organization.")
        org = await self.get(org_id)
        await self.org_repo.soft_delete(org)
        logger.info("Organization deleted", extra={"org_id": str(org_id)})
        await self.events.record_event(
            "ORGANIZATION_DELETED",
            organization_id=org.id,
            actor_id=requestor_org_id,
            aggregate_type="organization",
            aggregate_id=str(org.id),
            source="organization_service",
            payload={"organization_id": str(org.id), "requestor_id": str(requestor_org_id)},
        )
