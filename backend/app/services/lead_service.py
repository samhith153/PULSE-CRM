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
from app.services.feature_vector_service import FeatureVectorService
from app.services.lead_scoring_service import LeadScoringService
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
        self.feature_vector_service = FeatureVectorService(db)
        self.lead_scoring_service = LeadScoringService(db)

    async def create(
        self,
        payload: LeadCreateRequest,
        organization_id: UUID,
        created_by: UUID,
    ) -> Lead:
        data = payload.model_dump(exclude_none=True)

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
        # Auto-compute feature vector
        try:
            await self.feature_vector_service.compute_and_store_for_lead(
                lead.id, organization_id, created_by
            )
        except Exception as e:
            logger.warning("Failed to compute feature vector on lead create", extra={"lead_id": str(lead.id), "error": str(e)})
        # Auto-compute lead scores
        try:
            await self.lead_scoring_service.compute_and_store_scores(
                lead.id, organization_id, created_by
            )
        except Exception as e:
            logger.warning("Failed to compute lead scores on lead create", extra={"lead_id": str(lead.id), "error": str(e)})
        # Auto-generate recommendation
        try:
            from app.services.recommendation_service import RecommendationService
            await RecommendationService(self.db).generate_for_lead(lead.id, organization_id)
        except Exception as e:
            logger.warning("Failed to generate recommendation on lead create", extra={"lead_id": str(lead.id), "error": str(e)})
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
        # Auto-compute feature vector on update
        try:
            await self.feature_vector_service.compute_and_store_for_lead(
                lead.id, organization_id, lead.created_by
            )
        except Exception as e:
            logger.warning("Failed to compute feature vector on lead update", extra={"lead_id": str(lead.id), "error": str(e)})
        # Auto-compute lead scores on update
        try:
            await self.lead_scoring_service.compute_and_store_scores(
                lead.id, organization_id, lead.created_by
            )
        except Exception as e:
            logger.warning("Failed to compute lead scores on lead update", extra={"lead_id": str(lead.id), "error": str(e)})
        # Auto-generate recommendation on update
        try:
            from app.services.recommendation_service import RecommendationService
            await RecommendationService(self.db).generate_for_lead(lead.id, organization_id)
        except Exception as e:
            logger.warning("Failed to generate recommendation on lead update", extra={"lead_id": str(lead.id), "error": str(e)})
        return await self.get(lead_id, organization_id)

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
        # Auto-generate recommendation on status change
        try:
            from app.services.recommendation_service import RecommendationService
            await RecommendationService(self.db).generate_for_lead(lead.id, organization_id)
        except Exception as e:
            logger.warning("Failed to generate recommendation on status change", extra={"lead_id": str(lead.id), "error": str(e)})
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

        if lead.status == LeadStatus.CONVERTED.value:
            await self.repo.soft_delete(lead)
            logger.info("Lead archived", extra={"lead_id": str(lead_id)})
        else:
            await self.repo.delete(lead)
            logger.info("Lead hard-deleted", extra={"lead_id": str(lead_id)})

    async def convert_to_deal(
        self,
        lead_id: UUID,
        organization_id: UUID,
        created_by: UUID,
        industry: Optional[str] = None,
        revenue: Optional[float] = None,
        employee_count: Optional[int] = None,
        pipeline_stage_id: Optional[str] = None,
    ) -> Deal:
        tx_context = self.db.begin_nested() if self.db.in_transaction() else self.db.begin()
        async with tx_context:
            lead = await self.get(lead_id, organization_id)

            if lead.status == LeadStatus.CONVERTED.value:
                raise ConflictException("Lead has already been converted into a deal.")

            existing = await self.deal_repo.get_by_lead_id_in_org(lead_id, organization_id)
            if existing:
                raise ConflictException("Lead has already been converted into a deal.")

            # ── Resolve / create Company ──────────────────────────────────────
            company_id = lead.company_id
            if not company_id and lead.company_name:
                existing_company = await self.company_repo.get_by_name_in_org(
                    lead.company_name, organization_id
                )
                if existing_company:
                    company_id = existing_company.id
                else:
                    company = await self.company_repo.create(
                        name=lead.company_name,
                        industry=industry or lead.industry,
                        employee_count=employee_count or lead.employee_count,
                         annual_revenue=str(revenue) if revenue is not None else None,
                        organization_id=organization_id,
                        created_by=created_by,
                    )
                    company_id = company.id

            # ── Resolve / create Contact ──────────────────────────────────────
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
                    )
                    contact_id = contact.id

            # ── Find pipeline stage ───────────────────────────────────────────
            if pipeline_stage_id:
                stage = await self.pipeline_repo.get_by_id(UUID(pipeline_stage_id))
            else:
                stage = await self.pipeline_repo.get_by_slug(PipelineStageSlug.NEW.value, organization_id)
            if not stage:
                from app.services.pipeline_service import PipelineService

                stage = (await PipelineService(self.db).ensure_default_stages(organization_id, created_by))[0]

            # ── Create Deal ───────────────────────────────────────────────────
            deal = await self.deal_repo.create(
                name=lead.title,
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

            # ── Update company with conversion details ────────────────────────
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

            # ── Mark lead as converted ────────────────────────────────────────
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

            if created_by:
                from app.services.notification_service import NotificationService

                await NotificationService(self.db).create_for_user(
                    organization_id=organization_id,
                    user_id=lead.owner_id or created_by,
                    notif_type="lead_converted",
                    title="Lead converted",
                    message=f"Lead '{lead.title}' was converted into a deal.",
                    entity_type="deal",
                    entity_id=deal.id,
                )

            # ── Recompute lead scores with pipeline stage features ──────────
            try:
                stage_slug_for_score = stage.slug if stage else "new"
                await self.feature_vector_service.update_stage_features_for_lead(
                    lead.id, organization_id, stage_slug_for_score, created_by
                )
                await self.lead_scoring_service.recompute_for_lead(
                    lead.id, organization_id, created_by
                )
            except Exception as e:
                logger.warning(
                    "Failed to recompute scores on lead conversion",
                    extra={"lead_id": str(lead.id), "error": str(e)},
                )

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


